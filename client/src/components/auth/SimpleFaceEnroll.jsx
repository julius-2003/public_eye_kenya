import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Upload, CheckCircle, X } from 'lucide-react';

/**
 * Simple Profile Picture Upload
 * Users upload a profile picture without live camera
 */
export default function SimpleFaceEnroll({ onEnroll }) {
  const fileInputRef = useRef(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setUploading(true);
    try {
      // Read file as data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result;
        if (typeof dataUrl === 'string') {
          setPhotoUrl(dataUrl);
          toast.success('✓ Photo selected! Click submit to continue.');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File read error:', err);
      toast.error('Error reading file');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (photoUrl) {
      onEnroll({
        faceDescriptor: [],
        facePhotoUrl: photoUrl,
      });
      toast.success('Profile picture uploaded!');
    } else {
      toast.error('Please select a photo first');
    }
  };

  const handleClear = () => {
    setPhotoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info('Photo cleared');
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className="relative rounded-xl overflow-hidden border-2 border-dashed transition-all cursor-pointer hover:opacity-80"
        style={{
          background: 'rgba(255,255,255,0.03)',
          borderColor: photoUrl ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.1)',
        }}
        onClick={() => !photoUrl && !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />

        {photoUrl ? (
          <div className="relative">
            <img src={photoUrl} alt="Selected" className="w-full aspect-video object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <CheckCircle size={48} className="text-green-400" />
            </div>
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <Upload size={48} className="text-white/40 mb-3" />
            <p className="text-white/70 font-semibold mb-1">Click to upload photo</p>
            <p className="text-white/40 text-xs">or drag and drop</p>
            <p className="text-white/30 text-xs mt-2">JPG, PNG up to 5MB</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {photoUrl && (
          <button
            onClick={handleClear}
            disabled={uploading}
            className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            style={{
              background: 'rgba(220,38,38,0.2)',
              color: '#fca5a5',
              border: '1px solid rgba(220,38,38,0.3)',
            }}
          >
            <X size={16} />
            Clear
          </button>
        )}

        <button
          onClick={handleSubmit}
          disabled={!photoUrl || uploading}
          className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          style={{
            background: photoUrl ? '#BB0000' : 'rgba(187,0,0,0.5)',
            color: 'white',
          }}
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle size={16} />
              {photoUrl ? 'Submit Photo' : 'Select Photo'}
            </>
          )}
        </button>
      </div>

      {/* Info */}
      <p className="text-xs text-white/40 text-center">
        📸 Select a clear photo of yourself for your profile picture
      </p>
    </div>
  );
}
