import React, { useRef, useEffect, useState } from 'react';
import { X, Camera, RefreshCw, AlertCircle } from 'lucide-react';

interface CameraModalProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  useEffect(() => {
    let mounted = true;
    
    const startCamera = async () => {
      try {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 } 
          },
          audio: false
        });

        if (mounted) {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          console.error("Camera access error:", err);
          setError("Kameraya erişilemedi. Lütfen tarayıcı izinlerini kontrol edin.");
        }
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
            // Mirror effect for selfie
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(videoRef.current, 0, 0);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(base64);
        
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        onClose();
      }
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-4 bg-gray-900/80 absolute top-0 w-full z-10">
           <button 
             onClick={switchCamera}
             className="text-white hover:bg-white/10 p-2 rounded-full transition-colors"
             title="Kamerayı Çevir"
           >
             <RefreshCw size={20} />
           </button>
           <button 
             onClick={() => {
                if (stream) stream.getTracks().forEach(track => track.stop());
                onClose();
             }} 
             className="text-white hover:bg-red-500/20 hover:text-red-500 p-2 rounded-full transition-colors"
           >
             <X size={24} />
           </button>
        </div>

        <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="text-red-400 flex flex-col items-center text-center p-6 gap-2">
              <AlertCircle size={48} />
              <p>{error}</p>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
          )}
        </div>

        <div className="p-6 bg-gray-900 flex justify-center items-center pb-8">
          <button 
            onClick={handleCapture}
            disabled={!!error}
            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-brand-600 hover:bg-brand-500 hover:scale-105 transition-all shadow-lg shadow-brand-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera size={32} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraModal;