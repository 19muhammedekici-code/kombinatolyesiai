import React, { useState, useEffect } from 'react';
import { Category, ClothingItem, WardrobeItem } from '../types';
import { CATEGORY_INFO } from '../constants';
import { Trash2, Plus, Sparkles, User, Loader2, Lock, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import { generateOutfit } from '../services/gemini';

const Wardrobe: React.FC = () => {
  // --- AUTH STATES ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // --- EXISTING STATES ---
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState({
    age: '',
    gender: 'Kadın',
    skinTone: 'Açık',
    style: 'Modern'
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoResult, setAutoResult] = useState<string | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const storedItems = localStorage.getItem('wardrobe_items');
    const storedModel = localStorage.getItem('wardrobe_model');
    
    // Check session storage for auth persistence (optional UX improvement)
    const sessionAuth = sessionStorage.getItem('wardrobe_auth');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
    }

    if (storedItems) setItems(JSON.parse(storedItems));
    if (storedModel) setModelImage(storedModel);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (isAuthenticated) {
        localStorage.setItem('wardrobe_items', JSON.stringify(items));
        if (modelImage) localStorage.setItem('wardrobe_model', modelImage);
    }
  }, [items, modelImage, isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'Kombin2026.') {
      setIsAuthenticated(true);
      setAuthError(false);
      sessionStorage.setItem('wardrobe_auth', 'true'); // Keep logged in for the session
    } else {
      setAuthError(true);
      setPasswordInput('');
    }
  };

  const handleAddItem = (category: Category, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const newItem: WardrobeItem = {
        id: Date.now().toString(),
        category,
        imageUrl: reader.result as string,
        dateAdded: Date.now()
      };
      setItems(prev => [...prev, newItem]);
    };
    reader.readAsDataURL(file);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
         setModelImage(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleAutoGenerate = async () => {
    if (!modelImage) {
      alert("Otomatik kombin için lütfen önce bir model fotoğrafı kaydedin.");
      return;
    }
    if (items.length < 2) {
      alert("Gardırobunuzda yeterli parça yok. Lütfen biraz kıyafet ekleyin.");
      return;
    }

    setIsGenerating(true);
    setAutoResult(null);

    const tops = items.filter(i => i.category === Category.TOP);
    const bottoms = items.filter(i => i.category === Category.BOTTOM);
    const dresses = items.filter(i => i.category === Category.ONE_PIECE);
    const shoes = items.filter(i => i.category === Category.SHOES);
    const accessories = items.filter(i => i.category === Category.ACCESSORIES);

    const selectedItems: ClothingItem[] = [];

    const useDress = dresses.length > 0 && (Math.random() > 0.5 || (tops.length === 0 && bottoms.length === 0));

    if (useDress) {
      selectedItems.push(dresses[Math.floor(Math.random() * dresses.length)]);
    } else {
      if (tops.length > 0) selectedItems.push(tops[Math.floor(Math.random() * tops.length)]);
      if (bottoms.length > 0) selectedItems.push(bottoms[Math.floor(Math.random() * bottoms.length)]);
    }

    if (shoes.length > 0) {
       selectedItems.push(shoes[Math.floor(Math.random() * shoes.length)]);
    }
    
    if (accessories.length > 0) {
       selectedItems.push(accessories[Math.floor(Math.random() * accessories.length)]);
    }

    const context = `Kullanıcı Profili: ${userProfile.gender}, ${userProfile.age} yaşlarında, ${userProfile.skinTone} ten rengi, ${userProfile.style} tarzı. Bu profili baz alarak seçilen kıyafetleri en uygun şekilde kombinle.`;

    try {
      const result = await generateOutfit(modelImage, selectedItems, context);
      setAutoResult(result);
    } catch (e) {
      console.error(e);
      alert("Otomatik kombin oluşturulurken hata oluştu.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- LOCK SCREEN RENDER ---
  if (!isAuthenticated) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-stone-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all hover:scale-[1.01]">
          <div className="bg-brand-600 p-8 flex flex-col items-center justify-center text-white relative overflow-hidden">
             {/* Background decorative circles */}
             <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
             <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3"></div>
             
             <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm mb-4 shadow-inner">
                <Lock size={40} className="text-white" />
             </div>
             <h2 className="text-2xl font-bold tracking-tight">Özel Gardırop</h2>
             <p className="text-brand-100 text-sm mt-1 font-medium">Lütfen erişim şifresini giriniz</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound size={20} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (authError) setAuthError(false);
                  }}
                  className={`block w-full pl-10 pr-3 py-3 border ${authError ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-brand-500 focus:border-brand-500'} rounded-xl transition-colors outline-none`}
                  placeholder="Şifre"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 animate-pulse">
                  <AlertCircle size={16} />
                  <span>Hatalı şifre girdiniz.</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                Giriş Yap <ArrowRight size={18} />
              </button>
            </form>
          </div>
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">Bu alan kişisel verilerinizi korumak için şifrelenmiştir.</p>
          </div>
        </div>
      </div>
    );
  }

  // --- WARDROBE CONTENT RENDER ---
  return (
    <div className="container mx-auto px-4 md:px-8 py-8 h-full overflow-y-auto">
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              Dijital Gardırop 
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full border border-green-200 flex items-center gap-1">
                <Lock size={10} /> Güvenli Mod
              </span>
            </h1>
            <p className="text-gray-500 mt-1">Kıyafetlerinizi saklayın, yapay zeka sizin için seçsin.</p>
          </div>
          
          <div className="flex gap-3">
            <label className="bg-gray-900 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors flex items-center gap-2">
              <User size={18} />
              {modelImage ? "Modeli Güncelle" : "Model Yükle"}
              <input type="file" onChange={handleModelUpload} className="hidden" accept="image/*" />
            </label>
            <button 
              onClick={() => {
                setIsAuthenticated(false);
                sessionStorage.removeItem('wardrobe_auth');
              }} 
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Çıkış
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Wardrobe Grid */}
          <div className="lg:col-span-2 space-y-8">
            {Object.values(Category).map((cat) => (
              <div key={cat} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-800">
                      {cat}
                   </h3>
                   <label className="text-sm text-brand-600 hover:text-brand-800 cursor-pointer font-medium flex items-center gap-1">
                      <Plus size={16} /> Ekle
                      <input 
                        type="file" 
                        onChange={(e) => e.target.files?.[0] && handleAddItem(cat, e.target.files[0])} 
                        className="hidden" 
                        accept="image/*" 
                      />
                   </label>
                </div>
                
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {items.filter(i => i.category === cat).length === 0 && (
                    <div className="text-gray-400 text-sm italic py-4 w-full text-center bg-gray-50 rounded-lg">Bu kategoride ürün yok.</div>
                  )}
                  {items.filter(i => i.category === cat).map((item) => (
                    <div key={item.id} className="relative group min-w-[100px] w-[100px] h-[100px] rounded-lg overflow-hidden border border-gray-200">
                      <img src={item.imageUrl} alt={cat} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Auto Generate Panel */}
          <div className="lg:col-span-1">
             <div className="sticky top-4 bg-white p-6 rounded-xl shadow-lg border border-brand-100">
                <div className="flex items-center gap-2 text-brand-600 mb-4">
                  <Sparkles size={24} />
                  <h2 className="text-xl font-bold text-gray-900">Akıllı Stilist</h2>
                </div>
                
                <p className="text-sm text-gray-600 mb-6">
                  Yapay zeka, fiziksel özelliklerinize ve gardırobunuza göre en iyi kombini seçsin.
                </p>

                {/* Profile Inputs */}
                <div className="space-y-4 mb-6">
                  <div>
                     <label className="block text-xs font-semibold text-gray-700 mb-1">Cinsiyet</label>
                     <select 
                       value={userProfile.gender}
                       onChange={(e) => setUserProfile({...userProfile, gender: e.target.value})}
                       className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                     >
                       <option>Kadın</option>
                       <option>Erkek</option>
                       <option>Unisex</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-xs font-semibold text-gray-700 mb-1">Yaş Grubu</label>
                     <input 
                       type="text" 
                       placeholder="Örn: 25"
                       value={userProfile.age}
                       onChange={(e) => setUserProfile({...userProfile, age: e.target.value})}
                       className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-semibold text-gray-700 mb-1">Ten Rengi</label>
                     <select 
                       value={userProfile.skinTone}
                       onChange={(e) => setUserProfile({...userProfile, skinTone: e.target.value})}
                       className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                     >
                       <option>Açık</option>
                       <option>Buğday</option>
                       <option>Esmer</option>
                       <option>Koyu</option>
                     </select>
                  </div>
                </div>

                <button 
                  onClick={handleAutoGenerate}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white py-3 rounded-xl font-bold shadow-md transition-all flex justify-center items-center gap-2"
                >
                  {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                  Otomatik Kombinle
                </button>
             </div>
             
             {/* Auto Result Preview */}
             {autoResult && (
               <div className="mt-6 bg-white p-4 rounded-xl shadow border border-gray-200 animate-in fade-in zoom-in duration-300">
                 <h3 className="font-bold text-gray-800 mb-2">Öneri:</h3>
                 <img src={autoResult} alt="Auto Result" className="w-full rounded-lg" />
               </div>
             )}
          </div>
        </div>
        
        {/* Footer in Wardrobe Page */}
        <footer className="py-8 mt-12 text-center border-t border-gray-200">
          <p className="text-gray-500 text-sm font-medium">
            © 2026 Muhammed EKC — Bu sitenin tüm hakları saklıdır.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Wardrobe;