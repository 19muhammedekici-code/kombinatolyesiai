import React, { useState } from 'react';
import { Category, ClothingItem, LoadingState } from '../types';
import UploadBox from '../components/UploadBox';
import { generateOutfit } from '../services/gemini';
import { Loader2, RefreshCcw, Maximize2, Download, Layers, Sparkles } from 'lucide-react';

const Studio: React.FC = () => {
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [clothingItems, setClothingItems] = useState<Record<Category, string[]>>({
    [Category.TOP]: [],
    [Category.BOTTOM]: [],
    [Category.ONE_PIECE]: [],
    [Category.SHOES]: [],
    [Category.ACCESSORIES]: []
  });
  
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState<{current: number, total: number, message: string} | null>(null);

  const handleFileRead = (files: FileList, callback: (base64: string) => void) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          callback(reader.result);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const addClothing = (category: Category, files: FileList) => {
    handleFileRead(files, (base64) => {
      setClothingItems(prev => ({
        ...prev,
        [category]: [...prev[category], base64]
      }));
    });
  };

  const removeClothing = (category: Category, index: number) => {
    setClothingItems(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }));
  };

  const handleGenerate = async () => {
    if (!modelImage) {
      alert("Lütfen önce bir model fotoğrafı yükleyin.");
      return;
    }

    // Collect all items safely
    const activeItems: ClothingItem[] = [];
    const categories = Object.keys(clothingItems) as Category[];
    
    categories.forEach((cat) => {
      const images = clothingItems[cat];
      images.forEach((img, idx) => {
        activeItems.push({
          id: `${cat}-${idx}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          category: cat,
          imageUrl: img
        });
      });
    });

    if (activeItems.length === 0) {
      alert("Lütfen en az bir kıyafet yükleyin.");
      return;
    }

    setStatus('generating');
    setErrorMsg(null);
    setProgress({ current: 0, total: activeItems.length, message: "Başlatılıyor..." });

    try {
      const result = await generateOutfit(
        modelImage, 
        activeItems, 
        undefined, 
        (step, total, msg) => {
          setProgress({ current: step, total, message: `Giydiriliyor: ${msg}` });
        }
      );
      setResultImage(result);
      setStatus('success');
    } catch (error: any) {
      setStatus('error');
      setErrorMsg(error.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setProgress(null);
    }
  };

  const openFullSize = () => {
    if (resultImage) {
      const win = window.open();
      if (win) {
        win.document.write(`<img src="${resultImage}" style="width:100%; height:auto;" />`);
      }
    }
  };
  
  const downloadResult = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = 'kombin-atolyesi-ai.png';
      link.click();
    }
  };

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Left Sidebar: Inputs - Scrollable */}
      <div className="w-[320px] md:w-[380px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-10 h-full shadow-xl">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <h2 className="text-lg font-bold text-gray-900 sticky top-0 bg-white z-10 py-2 border-b mb-2 flex items-center gap-2">
            <Layers size={18} className="text-brand-600" />
            Stüdyo Paneli
          </h2>
          
          {/* ORDER: Model -> Top -> Bottom -> One Piece -> Shoes -> Accessories */}
          
          {/* 1. Model Upload */}
          <div className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl border border-purple-100 shadow-sm">
             <UploadBox 
              category="MODEL"
              images={modelImage ? [modelImage] : []}
              onUpload={(files) => handleFileRead(files, setModelImage)}
              onRemove={() => setModelImage(null)}
              single
            />
          </div>

          <div className="border-t border-gray-100 my-2"></div>

          {/* 2. Top Wear */}
          <UploadBox 
            category={Category.TOP}
            images={clothingItems[Category.TOP]}
            onUpload={(f) => addClothing(Category.TOP, f)}
            onRemove={(i) => removeClothing(Category.TOP, i)}
          />

          {/* 3. Bottom Wear */}
          <UploadBox 
            category={Category.BOTTOM}
            images={clothingItems[Category.BOTTOM]}
            onUpload={(f) => addClothing(Category.BOTTOM, f)}
            onRemove={(i) => removeClothing(Category.BOTTOM, i)}
          />

           {/* 4. One Piece */}
           <UploadBox 
            category={Category.ONE_PIECE}
            images={clothingItems[Category.ONE_PIECE]}
            onUpload={(f) => addClothing(Category.ONE_PIECE, f)}
            onRemove={(i) => removeClothing(Category.ONE_PIECE, i)}
          />

           {/* 5. Shoes */}
           <UploadBox 
            category={Category.SHOES}
            images={clothingItems[Category.SHOES]}
            onUpload={(f) => addClothing(Category.SHOES, f)}
            onRemove={(i) => removeClothing(Category.SHOES, i)}
          />

           {/* 6. Accessories */}
           <UploadBox 
            category={Category.ACCESSORIES}
            images={clothingItems[Category.ACCESSORIES]}
            onUpload={(f) => addClothing(Category.ACCESSORIES, f)}
            onRemove={(i) => removeClothing(Category.ACCESSORIES, i)}
          />
          
          <div className="h-20"></div> {/* Spacer for scrolling past bottom */}
        </div>
        
        {/* Fixed Bottom Action Bar in Sidebar */}
        <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
           <button 
              onClick={handleGenerate}
              disabled={status === 'generating'}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white px-4 py-3 rounded-xl font-semibold shadow-lg shadow-brand-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {status === 'generating' ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> İşleniyor...
                </>
              ) : (
                <>
                  <RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" /> Kombin Oluştur
                </>
              )}
            </button>
            
            <div className="mt-3 px-1">
               <p className="text-[10px] text-gray-400 text-center leading-relaxed font-medium">
                 Hatalı oluşumlarda lütfen tekrar kombin oluştur butonuna basalım. En iyi sonucu almak için oluşturulacak kombine uygun fotoğraf yükleyelim.
               </p>
            </div>
        </div>
      </div>

      {/* Right Content: Canvas - Flex Column Layout */}
      <div className="flex-1 bg-stone-100 flex flex-col p-4 md:p-6 overflow-hidden relative">
         
         {/* Background Pattern */}
         <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
         
         {/* Canvas Container */}
         <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center">
            <div className="w-full h-full max-w-4xl bg-white rounded-2xl border-2 border-gray-200 shadow-2xl flex items-center justify-center relative overflow-hidden">
                
                {status === 'idle' && !resultImage && (
                  <div className="w-full h-full flex flex-col items-center justify-center relative p-8">
                    
                    {/* Main Empty State Content */}
                    <div className="text-center text-gray-400 mt-4 max-w-md">
                      <div className="w-24 h-24 bg-purple-50 rounded-full mx-auto mb-6 flex items-center justify-center shadow-inner">
                        <RefreshCcw size={40} className="opacity-50 text-brand-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Hoşgeldin!</h3>
                      <p className="text-gray-500">
                        Sol panelden model fotoğrafını ve kıyafetleri yükle, <span className="font-bold text-brand-600">"Kombin Oluştur"</span> butonuna bas.
                      </p>
                    </div>
                  </div>
                )}

                {status === 'generating' && (
                  <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center text-center p-4">
                    <div className="relative mb-6">
                      <div className="w-24 h-24 border-4 border-gray-100 border-t-brand-600 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-brand-600">{progress ? `${Math.round((progress.current / progress.total) * 100)}%` : ''}</span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 animate-pulse">Yapay Zeka Tasarlıyor...</h3>
                    <p className="text-brand-600 mt-2 font-medium">
                      {progress?.message || "Kıyafetler analiz ediliyor..."}
                    </p>
                    <p className="text-xs text-gray-400 mt-6 max-w-sm">
                       Modelin kimliği ve vücut yapısı korunarak, seçilen parçalar sırayla işleniyor.
                    </p>
                  </div>
                )}

                {status === 'error' && (
                  <div className="text-center text-red-500 p-8">
                     <div className="bg-red-50 p-4 rounded-full inline-flex mb-4">
                       <Maximize2 size={32} className="rotate-45" />
                     </div>
                     <p className="font-bold text-lg mb-2">Bir hata oluştu</p>
                     <p className="max-w-xs mx-auto text-sm">{errorMsg}</p>
                     <button onClick={() => setStatus('idle')} className="mt-6 px-4 py-2 bg-white border border-red-200 rounded-lg text-red-600 font-medium hover:bg-red-50 transition-colors">
                       Tekrar Dene
                     </button>
                  </div>
                )}

                {resultImage && (
                  <img 
                    src={resultImage} 
                    alt="AI Result" 
                    className="w-full h-full object-contain"
                  />
                )}
                
                {resultImage && (
                  <div className="absolute top-4 right-4 flex flex-col gap-2 z-30">
                     <button 
                      onClick={openFullSize}
                      className="bg-white/90 hover:bg-white p-2.5 rounded-xl text-gray-700 shadow-md backdrop-blur transition-all border border-gray-100 hover:text-brand-600"
                      title="Tam Boyut Gör"
                    >
                      <Maximize2 size={20} />
                    </button>
                    <button 
                      onClick={downloadResult}
                      className="bg-white/90 hover:bg-white p-2.5 rounded-xl text-gray-700 shadow-md backdrop-blur transition-all border border-gray-100 hover:text-brand-600"
                      title="İndir"
                    >
                      <Download size={20} />
                    </button>
                  </div>
                )}
            </div>

            {/* Bottom Info Bar & Badge */}
            <div className="flex-none w-full mt-3 flex flex-col items-center gap-2 z-10">
                <div className="animate-neon-blink px-4 py-1.5 md:px-6 md:py-2 rounded-full bg-white/80 backdrop-blur-md border border-brand-200 shadow-sm">
                  <h1 className="text-[10px] md:text-xs font-bold text-neon uppercase tracking-widest flex items-center gap-2">
                     <Sparkles size={12} className="text-brand-500" />
                     GERÇEKÇİ YAPAY ZEKA TEKNOLOJİSİ İLE KOMBİNİNİ ÜZERİNDE GÖR
                     <Sparkles size={12} className="text-brand-500" />
                  </h1>
                </div>

                <div className="w-full flex items-center justify-between px-2 text-[10px] text-gray-400 border-t border-gray-200 pt-2">
                   <span>© 2026 Muhammed EKC</span>
                   {resultImage && <span className="text-green-600 font-medium flex items-center gap-1">● İşlem Başarılı</span>}
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Studio;