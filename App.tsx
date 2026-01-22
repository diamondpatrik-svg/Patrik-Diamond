
import React, { useState } from 'react';
import { ClothingItem } from './types';
import { CLOTHING_ITEMS } from './constants';
import { generateVirtualTryOnImage } from './services/geminiService';
import Loader from './components/Loader';
import ShareButtons from './components/ShareButtons';

const getSafeUrl = (url: string) => {
  if (!url) return '';
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=400`;
};

const Header: React.FC = () => (
  <header className="py-12 text-center">
    <div className="container mx-auto px-4">
      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.7em] mb-2">
        Yako King Handmade
      </p>
      <h1 className="text-4xl md:text-7xl lg:text-8xl font-[900] text-indigo-600 tracking-tighter leading-none italic">
        Zkušební kabinka online
      </h1>
      <div className="w-16 h-1 bg-indigo-500 mx-auto mt-8 rounded-full opacity-30"></div>
    </div>
  </header>
);

const App: React.FC = () => {
  const [userImageFile, setUserImageFile] = useState<File | null>(null);
  const [userImagePreview, setUserImagePreview] = useState<string | null>(null);
  const [selectedClothing, setSelectedClothing] = useState<ClothingItem | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUserImageFile(file);
      setUserImagePreview(URL.createObjectURL(file));
      setGeneratedImage(null);
      setError(null);
    }
  };

  const handleGenerate = async () => {
    if (!userImageFile || !selectedClothing) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateVirtualTryOnImage(userImageFile, selectedClothing);
      setGeneratedImage(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f8faff] text-slate-900 animate-fade-in">
      <Header />
      
      <main className="container mx-auto px-4 max-w-7xl flex-grow pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-4 space-y-6">
            <div className="glass p-7 rounded-[2.5rem] shadow-2xl border border-white">
              <section className="mb-8">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-900/40">01. Tvoje postava</h3>
                </div>
                <div className="relative group aspect-[21/4] rounded-2xl overflow-hidden bg-white/50 border-2 border-dashed border-indigo-100 transition-all hover:border-indigo-400 hover:bg-indigo-50/30">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 z-20 cursor-pointer" />
                  {userImagePreview ? (
                    <div className="flex items-center h-full px-5 gap-4">
                      <img src={userImagePreview} alt="Náhled" className="h-10 w-10 object-cover rounded-lg shadow-md" />
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Fotka nahrána</span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center gap-3">
                      <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <p className="text-indigo-900 font-black text-[10px] uppercase tracking-widest opacity-40">Nahraj svou fotku</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="mb-10">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-900/40 mb-5 px-1">02. Kolekce Handmade</h3>
                <div className="grid grid-cols-4 gap-3 max-h-[480px] lg:max-h-[580px] overflow-y-auto pr-3 clothing-scroll">
                  {CLOTHING_ITEMS.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => { setSelectedClothing(item); setGeneratedImage(null); }}
                      className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition-all transform hover:scale-[1.05] ${
                        selectedClothing?.name === item.name 
                          ? 'border-indigo-600 ring-4 ring-indigo-100 shadow-xl z-10' 
                          : 'border-transparent bg-white shadow-sm hover:shadow-md'
                      }`}
                    >
                      <img src={getSafeUrl(item.imageUrl)} alt={item.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </section>

              <button
                onClick={handleGenerate}
                disabled={isLoading || !userImageFile || !selectedClothing}
                className="w-full py-6 btn-grad text-white font-black text-[11px] rounded-[2rem] shadow-xl disabled:opacity-20 disabled:cursor-not-allowed uppercase tracking-[0.5em] mt-4"
              >
                {isLoading ? 'Sestavuji náhled...' : 'VYZKOUŠET NA SOBĚ'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="glass min-h-[500px] lg:min-h-[850px] rounded-[3.5rem] p-6 lg:p-10 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl border border-white">
              {isLoading ? (
                <div className="animate-fade-in flex flex-col items-center">
                  <Loader />
                  <p className="mt-8 text-indigo-600 font-black text-[11px] uppercase tracking-[0.6em] animate-pulse">Generuji tvůj nový look...</p>
                </div>
              ) : error ? (
                <div className="text-center p-8 lg:p-12 bg-red-50/50 rounded-[3rem] border border-red-100 max-w-md animate-fade-in">
                  <p className="text-red-700 text-[11px] font-black uppercase tracking-[0.2em] mb-8 leading-loose">{error}</p>
                  <button onClick={handleGenerate} className="px-10 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-red-700 transition-colors">Zkusit znovu</button>
                </div>
              ) : generatedImage ? (
                <div className="w-full flex flex-col items-center animate-fade-in">
                  <div className="relative group">
                    <img src={generatedImage} alt="Výsledek" className="max-h-[600px] lg:max-h-[680px] rounded-[3rem] shadow-2xl bg-white ring-1 ring-black/5" />
                  </div>
                  <div className="mt-12 w-full max-w-sm">
                    <ShareButtons imageUrl={generatedImage} />
                  </div>
                </div>
              ) : selectedClothing ? (
                <div className="w-full flex flex-col items-center animate-fade-in text-center">
                  <div className="mb-10 max-w-[480px] group transition-all">
                    <img src={getSafeUrl(selectedClothing.imageUrl)} alt={selectedClothing.name} className="rounded-[3rem] shadow-2xl bg-white border border-indigo-50 transform group-hover:scale-[1.02] transition-transform duration-500" />
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-[900] text-gray-900 tracking-tight">{selectedClothing.name}</h3>
                  <div className="flex items-center gap-3 mt-5">
                    <span className="h-[2px] w-8 bg-indigo-500 rounded-full opacity-30"></span>
                    <p className="text-indigo-500 text-[11px] font-black tracking-[0.4em] uppercase italic">Připraveno ke zkoušce</p>
                    <span className="h-[2px] w-8 bg-indigo-500 rounded-full opacity-30"></span>
                  </div>
                </div>
              ) : (
                <div className="text-center opacity-10 select-none">
                  <div className="w-20 h-20 lg:w-28 lg:h-28 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-8 border-2 border-indigo-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 lg:h-12 lg:w-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-indigo-900 font-black tracking-[0.8em] uppercase text-[10px] lg:text-[12px]">Virtuální Studio YK</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="py-12 text-center opacity-20">
        <p className="text-gray-500 text-[9px] font-black tracking-[0.6em] uppercase">
          &copy; {new Date().getFullYear()} Yako King Handmade &bull; Designed for Creators
        </p>
      </footer>
    </div>
  );
};

export default App;
