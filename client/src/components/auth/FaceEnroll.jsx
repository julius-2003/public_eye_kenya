import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import toast from 'react-hot-toast';
import { Camera, CheckCircle, RefreshCw, AlertCircle, RotateCw } from 'lucide-react';

export default function FaceEnroll({ onEnroll }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading, ready, detecting, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [stream, setStream] = useState(null);

  // Load face detection models with retry logic
  useEffect(() => {
    let isMounted = true;

    const loadModels = async () => {
      try {
        console.log('Starting model load...');
        setStatus('loading');

        // Model URL configurations to try in order (jsDelivr is first - most reliable)
        const modelConfigs = [
          {
            name: 'jsDelivr CDN (Fastest)',
            url: 'https://cdn.jsdelivr.net/gh/vladmandic/face-api@latest/dist/models/',
          },
          {
            name: 'unpkg CDN',
            url: 'https://unpkg.com/face-api.js@0.22.2/dist/models/',
          },
          {
            name: 'GitHub CDN',
            url: 'https://raw.githubusercontent.com/vladmandic/face-api/master/dist/models/',
          },
          {
            name: 'Local Models',
            url: '/models/',
          },
        ];

        let lastError = null;

        for (const config of modelConfigs) {
          try {
            if (!isMounted) return;

            console.log(`Loading from ${config.name} (${config.url})...`);

            // Load models with timeout
            const loadPromise = Promise.all([
              faceapi.nets.tinyFaceDetector.loadFromUri(config.url),
              faceapi.nets.faceLandmark68Net.loadFromUri(config.url),
              faceapi.nets.faceRecognitionNet.loadFromUri(config.url),
              faceapi.nets.faceExpressionNet.loadFromUri(config.url),
            ]);

            // Set a timeout for model loading
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Model loading timeout after 30 seconds')), 30000)
            );

            await Promise.race([loadPromise, timeoutPromise]);

            if (isMounted) {
              console.log(`✓ Models loaded from ${config.name}`);
              setStatus('ready');
              startCamera();
              return;
            }
          } catch (err) {
            console.warn(`✗ Failed from ${config.name}:`, err.message);
            lastError = err;
          }
        }

        // If all failed, show error with clear messaging
        if (isMounted) {
          const errorText = lastError?.message?.includes('<!DOCTYPE') || lastError?.message?.includes('HTML')
            ? 'CDN models temporarily unavailable. You can still continue by taking a selfie for manual verification.'
            : lastError?.message || 'Could not load face detection models';
          
          setErrorMsg(errorText);
          setStatus('error');
          console.error('All model loading attempts failed:', lastError);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Unexpected error during model loading:', err);
          setErrorMsg('An unexpected error occurred while loading face detection');
          setStatus('error');
        }
      }
    };

    loadModels();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Start camera with fallback for mobile/desktop
  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (err) {
      console.error('Failed to access camera:', err);
      setErrorMsg('Camera access denied or not available');
      setStatus('error');
      toast.error('Please enable camera permissions to continue');
    }
  };

  // Detect face and extract descriptor
  const detectFace = async () => {
    if (!videoRef.current) {
      toast.error('Camera not ready');
      return;
    }

    setStatus('detecting');
    try {
      const video = videoRef.current;

      // Wait for video to have dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        toast.error('Camera is loading, please wait a moment and try again');
        setStatus('ready');
        return;
      }

      const displaySize = {
        width: video.videoWidth,
        height: video.videoHeight,
      };

      // Detect faces
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withFaceExpressions();

      if (detections.length === 0) {
        toast.error('No face detected. Please position your face in the camera.');
        setStatus('ready');
        return;
      }

      if (detections.length > 1) {
        toast.error('Multiple faces detected. Please ensure only your face is visible.');
        setStatus('ready');
        return;
      }

      const detection = detections[0];
      const descriptor = Array.from(detection.descriptor);

      // Check face quality (confidence check with more lenient threshold)
      const confidence = detection.detection.score;
      if (confidence < 0.5) {
        toast.error('Face quality too low. Try better lighting and positioning.');
        setStatus('ready');
        return;
      }

      // Capture photo
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = displaySize.width;
        canvas.height = displaySize.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        // Draw detection box
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        faceapi.draw.drawDetections(canvas, resizedDetections);

        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        setPhotoUrl(photoData);
      }

      setFaceDescriptor(descriptor);
      setFaceDetected(true);
      setStatus('success');
      toast.success('Face captured successfully! Review and submit.');
    } catch (err) {
      console.error('Face detection error:', err);
      setStatus('ready');
      toast.error('Error detecting face. Please try again.');
    }
  };

  // Submit enrollment
  const handleSubmit = () => {
    if (faceDescriptor && photoUrl) {
      onEnroll({
        faceDescriptor,
        facePhotoUrl: photoUrl,
      });
      toast.success('Face enrollment submitted!');
    } else {
      toast.error('Please capture your face first.');
    }
  };

  // Retry enrollment
  const handleRetry = () => {
    setFaceDetected(false);
    setFaceDescriptor(null);
    setPhotoUrl(null);
    setStatus('ready');
    toast.info('Ready to capture again. Position your face in the frame.');
  };

  // Retry model loading
  const retryModelLoad = () => {
    window.location.reload();
  };

  // Skip face enrollment
  const skipFaceEnroll = () => {
    toast.info('Continuing without face enrollment');
    onEnroll({
      faceDescriptor: [],
      facePhotoUrl: null,
    });
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mb-4"></div>
        <p className="text-white/60 text-sm text-center font-medium">Loading face detection...</p>
        <p className="text-white/40 text-xs mt-2">This may take 30-60 seconds on first load</p>
        <p className="text-white/30 text-xs mt-3 text-center max-w-xs">
          Downloading TensorFlow.js face recognition models (~171MB)
        </p>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-xl" style={{ background: 'rgba(187, 0, 0, 0.1)' }}>
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-white/80 text-sm font-semibold text-center mb-2">Face Detection Setup Failed</p>
        <p className="text-white/50 text-xs text-center mb-4 max-w-sm">{errorMsg}</p>
        <p className="text-white/40 text-xs text-center mb-4">
          This may be caused by:
        </p>
        <ul className="text-white/40 text-xs mb-6 space-y-1 list-disc list-inside">
          <li>Network connectivity issue</li>
          <li>Browser not supporting WebRTC</li>
          <li>Ad blocker or privacy tool blocking CDN</li>
        </ul>
        <div className="w-full flex gap-3">
          <button
            onClick={retryModelLoad}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all hover:scale-105"
            style={{ background: '#BB0000' }}
          >
            <RotateCw size={16} />
            Retry
          </button>
          <button
            onClick={skipFaceEnroll}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
          >
            <CheckCircle size={16} />
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Camera Preview */}
      <div className="relative rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.5)' }}>
        {!faceDetected ? (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-video object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="border-2 border-dashed border-green-400/50 rounded-2xl"
                style={{ width: '280px', height: '280px' }}
              ></div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="text-white/70 text-sm font-medium">Position your face in the frame</p>
              <p className="text-white/40 text-xs mt-1">Good lighting and clear view required</p>
            </div>
          </div>
        ) : (
          <img src={photoUrl} alt="Captured face" className="w-full aspect-video object-cover" />
        )}
      </div>

      {/* Action Buttons */}
      {!faceDetected ? (
        <button
          onClick={detectFace}
          disabled={status === 'detecting' || status !== 'ready'}
          className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
          style={{ background: status === 'detecting' ? 'rgba(187,0,0,0.5)' : '#BB0000' }}
        >
          <Camera size={16} />
          {status === 'detecting' ? 'Detecting...' : 'Capture Face'}
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={handleRetry}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <RefreshCw size={16} />
            Retake
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
            style={{ background: '#22c55e' }}
          >
            <CheckCircle size={16} />
            Confirm & Continue
          </button>
        </div>
      )}

      {/* Tips */}
      <div
        className="p-4 rounded-xl text-sm text-white/60"
        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
      >
        <p className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
          <span>💡</span> Face Enrollment Tips
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs text-white/50">
          <li>Ensure good lighting on your face</li>
          <li>Face the camera directly</li>
          <li>Keep a neutral expression</li>
          <li>Remove sunglasses or hat if possible</li>
          <li>Works on mobile and desktop browsers</li>
          <li>First load may take 30-60 seconds</li>
        </ul>
      </div>
    </div>
  );
}
