import { GoogleGenerativeAI } from '@google/generative-ai';
import Report from '../models/Report.js';
import dotenv from 'dotenv';
dotenv.config();

export const runAIPatternDetector = async () => {
  try {
    console.log('🤖 Running AI Pattern Detector via Gemini...');

    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY is not set in environment variables.');
      return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Fetch reports that haven't been aggressively flagged yet and are still open
    const activeReports = await Report.find({ 
      status: { $in: ['pending', 'investigating'] },
      $or: [
        { aiFlag: false },
        { aiFlag: { $exists: false } }
      ]
    });
    
    if (activeReports.length === 0) {
      console.log('✅ No new unanalyzed reports found.');
      return;
    }

    // Group reports by county for localized contextual analysis
    const reportsByCounty = {};
    activeReports.forEach(r => {
      if (!reportsByCounty[r.county]) reportsByCounty[r.county] = [];
      reportsByCounty[r.county].push(r);
    });

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    let flaggedCount = 0;
    let analyzedCount = 0;

    for (const [county, reports] of Object.entries(reportsByCounty)) {
      console.log(`📊 Analyzing ${reports.length} reports for ${county} county...`);
      
      // Batch processing: max 20 reports per prompt to avoid exceeding context/output limits
      const batchSize = 20;
      for (let i = 0; i < reports.length; i += batchSize) {
        const batch = reports.slice(i, i + batchSize);
        
        const reportDataForAI = batch.map(r => ({
          reportId: r._id.toString(),
          title: r.title,
          description: r.description,
          category: r.category,
          subcounty: r.subcounty || 'Unknown',
          department: r.department || 'Unknown',
          contractors: r.contractorIds || []
        }));

        const prompt = `
          You are an expert anti-corruption and forensic pattern analysis AI for "PublicEye Kenya".
          Analyze the following reports submitted by citizens for ${county} county.
          
          Look for:
          - Suspicious patterns of kickbacks, ghost workers, or fraud.
          - Similar incidents happening in the same department or subcounty.
          - Contractors being mentioned multiple times in suspicious contexts.
          - High severity language or urgency.

          Return a JSON array where each object corresponds to a report and contains EXACTLY these keys:
          - "reportId": the exact string ID of the report provided.
          - "aiRiskScore": an integer from 0 to 100 representing corruption risk/severity based on the description and patterns.
          - "aiFlag": boolean true if the aiRiskScore is >= 70, else false.
          - "aiPattern": a concise 1-2 sentence string explaining what is suspicious (e.g. "Mention of missing funds in healthcare procurement", "Multiple reports point to this same contractor", or "Routine complaint, low risk").

          Reports Data:
          ${JSON.stringify(reportDataForAI, null, 2)}
          
          Return ONLY valid JSON array. No markdown blocks, no other text.
        `;

        try {
          const result = await model.generateContent(prompt);
          let responseText = result.response.text().trim();
          
          // Clean markdown JSON blocks if Gemini returns them despite instructions
          if (responseText.startsWith('\`\`\`json')) {
            responseText = responseText.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
          } else if (responseText.startsWith('\`\`\`')) {
            responseText = responseText.replace(/^\`\`\`\n/, '').replace(/\n\`\`\`$/, '');
          }

          const aiAnalyses = JSON.parse(responseText);

          for (const analysis of aiAnalyses) {
            if (!analysis.reportId) continue;
            
            await Report.findByIdAndUpdate(analysis.reportId, {
              aiFlag: analysis.aiFlag || false,
              aiPattern: analysis.aiPattern || 'Analyzed by AI.',
              aiRiskScore: analysis.aiRiskScore || 0
            });
            
            analyzedCount++;
            if (analysis.aiFlag) flaggedCount++;
          }
        } catch (apiErr) {
          console.error(`❌ AI API Error for ${county} batch:`, apiErr.message);
          console.log(`Failed response text was:`, apiErr.message);
        }
      }
    }

    console.log(`✅ AI Detector finished. Analyzed ${analyzedCount} reports, flagged ${flaggedCount} high-risk reports.`);
  } catch (err) {
    console.error('❌ AI Detector fatal error:', err.message);
  }
};
