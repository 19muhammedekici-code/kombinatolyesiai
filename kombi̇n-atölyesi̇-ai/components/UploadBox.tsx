import React, { useRef, useState } from 'react';
import { Upload, X, Info, Camera } from 'lucide-react';
import { Category } from '../types';
import { CATEGORY_INFO } from '../constants';
import CameraModal from './CameraModal';

interface UploadBoxProps {
  category: Category | 'MODEL';
  images: string[];
  onUpload: (files: FileList) => void;
  onRemove: (index: number) => void;
  single?: boolean;
}

const UploadBox: React.FC<UploadBoxProps> = ({ category, images, onUpload, onRemove, single = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  
  const isModel = category === 'MODEL';
  const info = isModel 
    ? { title: 'Model Fotoğrafı', description: 'Lütfen yüzünüz net ve bedeninizin tamamı kadrajda olacak şekilde bir fotoğraf yükleyin. En iyi sonucu almak için seçtiğiniz kombine uygun bir fotoğraf tercih ediniz.', icon: 'user' }
    : CATEGORY_INFO[category];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCameraCapture = (base64: string) => {
    fetch(base64)
    .then(res => res.blob())
    .then(blob => {
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: "image/jpeg" });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        onUpload(dataTransfer.files);
    });
  };

  return (
    <>
      {showCamera && (
        <CameraModal 
          onCapture={handleCameraCapture} 
          onClose={() => setShowCamera(false)} 
        />
      )}

      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col transition-all hover:border-brand-300">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
            {info.title}
          </h3>
          <div className="group relative">
             <Info size={14} className="text-gray-400 cursor-help" />
             <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 text-white text-xs p-2 rounded hidden group-hover:block z-20 shadow-lg pointer-events-none">
               {info.description}
             </div>
          </div>
        </div>
        
        {isModel && (
           <p className="text-[10px] text-gray-500 mb-2 leading-3">{info.description}</p>
        )}

        <div className={`grid grid-cols-2 gap-2 ${isModel ? '' : 'mb-0'}`}>
          {images.map((img, idx) => (
            <div key={idx} className={`relative group ${isModel ? 'col-span-2 aspect-[3/4]' : 'aspect-square'} rounded-lg overflow-hidden border border-gray-100 bg-gray-50`}>
              <img src={img} alt="Uploaded" className="w-full h-full object-cover" />
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
                className="absolute top-1 right-1 bg-white/90 p-1 rounded-full text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          
          {/* Action Area */}
          {(!single || images.length === 0) && (
             <div className={`border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50/50 ${isModel && images.length === 0 ? 'col-span-2 aspect-[3/4] min-h-[160px]' : 'aspect-square min-h-[80px]'}`}>
               <div className="flex gap-4 items-center justify-center w-full h-full">
                  {/* Upload Button */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center text-gray-400 hover:text-brand-600 transition-colors p-2"
                    title="Dosya Yükle"
                  >
                    <Upload size={isModel ? 24 : 20} className="mb-1" />
                    <span className="text-[10px] font-medium">Yükle</span>
                  </button>
                  
                  {/* Divider */}
                  <div className="w-px h-8 bg-gray-300"></div>

                  {/* Camera Button */}
                  <button 
                    onClick={() => setShowCamera(true)}
                    className="flex flex-col items-center justify-center text-gray-400 hover:text-brand-600 transition-colors p-2"
                    title="Fotoğraf Çek"
                  >
                    <Camera size={isModel ? 24 : 20} className="mb-1" />
                    <span className="text-[10px] font-medium">Çek</span>
                  </button>
               </div>
             </div>
          )}
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          multiple={!single} 
          className="hidden" 
        />
      </div>
    </>
  );
};

export default UploadBox;