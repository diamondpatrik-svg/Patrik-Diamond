import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- KONSTANTY ---
const CLOTHING_ITEMS = [
  { id: 1, name: 'Béžová mikina s kapucí', imageUrl: 'https://yakoking.cz/images_upd/products/7/w61mxk9y4zjf.webp' },
  { id: 2, name: 'Černá mikina s kapucí', imageUrl: 'https://yakoking.cz/images_upd/products/5/pvxjwz8c4yq2.jpg' },
  { id: 3, name: 'Béžová mikina černý střík', imageUrl: 'https://yakoking.cz/images_upd/products/6/jqh37e2wbt6i.jpg' },
  { id: 4, name: 'Khaki mikina s kapucí', imageUrl: 'https://yakoking.cz/images_upd/products/1/1tvwsi0j89pn.jpg' },
  { id: 5, name: 'Modrá mikina s kapucí', imageUrl: 'https://yakoking.cz/images_upd/products/8/o05k6hlq2ret.jpg' },
  { id: 6, name: 'Mikinové šaty černé', imageUrl: 'https://yakoking.cz/images_upd/products/9/lyemx76ksg1j.jpg' },
  { id: 7, name: 'Dámská mikina bez kapuce', imageUrl: 'https://yakoking.cz/images_upd/products/3/eyqchobf7knw.jpg' },
  { id: 8, name: 'Dámské triko 100% bavlna', imageUrl: 'https://yakoking.cz/images_upd/products/7/kha02lvm6t1p.jpg' },
  { id: 9, name: 'Crop Top Jaro', imageUrl: 'https://yakoking.cz/images_upd/products/3/9l3n27tgeyq4.jpg' },
  { id: 10, name: 'Crop Top Léto', imageUrl: 'https://yakoking.cz/images_upd/products/9/5m831gfkjary.jpg' },
  { id: 11, name: 'Khaki mikina trhaná', imageUrl: 'https://yakoking.cz/images_upd/products/3/ghrcsab8jf9l.jpg' },
  { id: 12, name: 'Černá mikina trhaná', imageUrl: 'https://yakoking.cz/images_upd/products/1/vlstbeif261m.jpg' },
  { id: 13, name: 'Červená mikina trhaná', imageUrl: 'https://yakoking.cz/images_upd/products/5/yi6rfa417oqv.jpg' },
  { id: 14, name: 'Šedá mikina trhaná', imageUrl: 'https://yakoking.cz/images_upd/products/4/4y1ipxet8kcb.jpg' },
  { id: 15, name: 'Šafránová mikina trhaná', imageUrl: 'https://yakoking.cz/images_upd/products/2/37t81crbueo4.jpg' },
  { id: 16, name: 'Pánské triko bavlna', imageUrl: 'https://yakoking.cz/images_upd/products/3/8eta512klsp4.jpg' },
];

const getSafeUrl = (url: string, width = 600) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=${width}&fit=contain&output=webp`;

// --- POMOCNÉ FUNKCE ---
const fileToPart = async (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (!result) return reject("Nepodařilo se přečíst soubor.");
      resolve({ inlineData: { data: result.split(',')[1], mimeType: file.type } });
    };
    reader.onerror = () => reject("Chyba při čtení souboru.");
    reader.readAsDataURL(file);
  });
};

const urlToPart = async (url: string) => {
  try {
    const res = await fetch(getSafeUrl(url, 1000));
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve({ inlineData: { data: result.split(',')[1], mimeType: 'image/jpeg' } });
      };
      reader.onerror = () => reject("Chyba při zpracování obrázku produktu.");
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    throw new Error("Nepodařilo se stáhnout obrázek produktu.");
  }
};

// --- KOMPONENTY ---
const Loader = () => (
  <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
    <div className="relative w-24 h-24">
      <div className="absolute inset-0 rounded-full border-[3px] border-indigo-100 opacity-30"></div>
      <div className="absolute inset-0 rounded-full border-[3px] border-indigo-600 border-t-transparent animate-spin"></div>
    </div>
    <div className="mt-10 text-center">
      <p className="text-indigo-600 font-black text-[12px] uppercase tracking-[0.5em] animate-pulse">Upravuji tvůj fit...</p>
      <p className="mt-3 text-slate-400 text-[9px] uppercase tracking-widest font-medium">Naše AI krejčí právě pracují (cca 15-20s)</p>
    </div>
  </div>
);

const App = () => {
  const [userImg, setUserImg] = useState<string | null>(null);
  const [userFile, setUserFile] = useState<File | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Obrázek je příliš velký (max 10MB).");
        return;
      }
      setUserFile(file);
      setUserImg(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleShare = async () => {
    if (!result) return;
    try {
      const response = await fetch(result);
      const blob = await response.blob();
      const file = new File([blob], 'yakoking-fit.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Můj Yako King outfit',
          text: 'Koukni, jak mi sekne tenhle outfit od Yako King! Víc na www.yakoking.cz',
          url: 'https://www.yakoking.cz',
        });
      } else {
        alert("Sdílení souborů není tvým prohlížečem přímo podporováno. Obrázek si můžeš stáhnout tlačítkem vedle nebo navštívit www.yakoking.cz");
      }
    } catch (err) {
      console.error("Chyba při sdílení:", err);
    }
  };

  const generate = async () => {
    if (!userFile || !selected) return;
    
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setError("API klíč není nastaven. Prosím zkontrolujte konfiguraci prostředí.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      const [uPart, iPart] = await Promise.all([
        fileToPart(userFile), 
        urlToPart(selected.imageUrl)
      ]);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: "VIRTUAL TRY-ON: Realistic professional fashion photograph. Take the exact clothing item from Image 2 and place it naturally on the person in Image 1. Maintain the person's identity, face, and the original background perfectly. Ensure realistic fabric folds and lighting." },
            uPart as any, 
            iPart as any
          ]
        },
        config: { imageConfig: { aspectRatio: "3:4" } }
      });

      const parts = response.candidates?.[0]?.content?.parts;
      const imagePart = parts?.find((p: any) => p.inlineData);
      
      if (imagePart?.inlineData?.data) {
        setResult(`data:image/png;base64,${imagePart.inlineData.data}`);
        setTimeout(() => {
           const resEl = document.getElementById('result-section');
           if (resEl) resEl.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      } else {
        throw new Error("AI se nepodařilo vytvořit náhled. Zkuste prosím jinou nebo jasnější fotku postavy.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Technický problém. Zkuste to prosím znovu za chvíli.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-[#f8faff]">
      <header className="mb-10 text-center animate-fade-in w-full max-w-4xl">
        <div className="inline-block bg-white/80 border border-indigo-100 px-5 py-1.5 rounded-full mb-5 shadow-sm">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">Yako King Handmade</p>
        </div>
        <h1 className="text-4xl md:text-7xl font-black text-indigo-950 italic tracking-tighter leading-tight mb-4">Virtuální kabinka</h1>
        <p className="text-slate-500 font-medium text-sm md:text-base max-w-xl mx-auto leading-relaxed">Vyber si kousek z naší dílny, nahraj fotku a podívej se, jak ti sekne dřív, než si ho objednáš.</p>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Ovládací panel nahoře */}
        <div className="lg:col-span-4 glass p-6 md:p-8 rounded-[2.5rem] space-y-8 animate-fade-in order-1">
          <section>
            <div className="flex justify-between items-end mb-4">
               <h3 className="text-[11px] font-black uppercase text-indigo-900/40 tracking-[0.2em]">01. Tvoje fotka</h3>
               {userImg && <button onClick={() => {setUserImg(null); setUserFile(null); setResult(null);}} className="text-[10px] font-bold text-red-400 uppercase hover:text-red-500 transition-colors">Reset</button>}
            </div>
            <div className={`relative group border-2 border-dashed rounded-3xl flex items-center justify-center overflow-hidden transition-all duration-500 min-h-[140px] ${userImg ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40'}`}>
              {!userImg && <input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />}
              {userImg ? (
                <img src={userImg} className="w-full h-full object-cover aspect-video lg:aspect-auto" alt="User" />
              ) : (
                <div className="text-center p-6">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <p className="text-indigo-600 font-black text-[10px] uppercase tracking-widest">Nahrát postavu</p>
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-[11px] font-black uppercase text-indigo-900/40 mb-4 tracking-[0.2em]">02. Výběr produktu</h3>
            <div className="grid grid-cols-4 gap-2.5 max-h-[300px] overflow-y-auto pr-2 clothing-scroll">
              {CLOTHING_ITEMS.map(item => (
                <button 
                  key={item.id} 
                  onClick={() => { setSelected(item); setResult(null); setError(null); }}
                  className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 relative ${selected?.id === item.id ? 'border-indigo-600 scale-[0.98] ring-4 ring-indigo-50' : 'border-transparent bg-white shadow-sm grayscale-[0.3] hover:grayscale-0 hover:scale-[1.02]'}`}
                  title={item.name}
                >
                  <img src={getSafeUrl(item.imageUrl, 200)} className="w-full h-full object-cover" alt={item.name} />
                </button>
              ))}
            </div>
          </section>

          <button 
            onClick={generate} 
            disabled={loading || !userFile || !selected} 
            className="w-full py-5 btn-grad text-white font-black rounded-[1.5rem] shadow-lg disabled:opacity-20 disabled:cursor-not-allowed uppercase tracking-[0.4em] text-[12px]"
          >
            {loading ? 'Pracuji...' : 'Vyzkoušet na sobě'}
          </button>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl animate-fade-in">
              <p className="text-red-500 font-bold text-[10px] uppercase tracking-wider text-center leading-relaxed">{error}</p>
            </div>
          )}
        </div>

        {/* Hlavní náhled dole/vpravo */}
        <div id="result-section" className="lg:col-span-8 glass rounded-[3rem] p-4 md:p-8 flex flex-col items-center justify-center min-h-[400px] lg:min-h-[800px] relative overflow-hidden animate-fade-in order-2">
          {loading ? (
            <Loader />
          ) : result ? (
            <div className="w-full h-full flex flex-col items-center animate-fade-in">
              <div className="relative group max-w-full">
                <img src={result} className="max-h-[700px] rounded-[2.5rem] shadow-2xl object-contain bg-white border border-indigo-50" alt="Výsledek" />
                <div className="absolute top-4 right-4 flex gap-3">
                   {/* Share Button */}
                   <button onClick={handleShare} className="w-12 h-12 bg-white/95 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform text-indigo-600" title="Sdílet outfit">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                   </button>
                   {/* Download Button */}
                   <a href={result} download="yakoking-style.png" className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform text-white" title="Stáhnout">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   </a>
                </div>
              </div>
              <button onClick={() => setResult(null)} className="mt-8 px-6 py-2 rounded-full border border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-colors">Zkusit jinou kombinaci</button>
            </div>
          ) : selected ? (
            <div className="text-center animate-fade-in flex flex-col items-center max-w-lg">
              <img src={getSafeUrl(selected.imageUrl, 800)} className="max-h-[550px] rounded-[3rem] shadow-2xl bg-white mb-8 border border-slate-50" alt="Produkt" />
              <div className="space-y-2">
                <h4 className="text-indigo-950 font-black uppercase text-[18px] tracking-[0.1em]">{selected.name}</h4>
                <p className="text-indigo-500 font-bold text-[11px] uppercase tracking-[0.4em] opacity-50 italic">Handmade in Czech Republic</p>
              </div>
            </div>
          ) : (
            <div className="text-center p-12 max-w-sm flex flex-col items-center">
               <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-10 shadow-inner border border-indigo-50/50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
               </div>
               <p className="text-slate-400 text-[11px] font-medium uppercase tracking-[0.2em] leading-loose">
                 Vítejte v našem studiu.<br/>Nahrajte svou fotku a vyberte si produkt pro spuštění kabinky.
               </p>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-16 mb-8 text-center">
        <a href="https://www.yakoking.cz" target="_blank" rel="noopener noreferrer" className="opacity-30 hover:opacity-100 transition-opacity">
           <p className="text-[10px] font-black text-indigo-950 uppercase tracking-[0.5em]">&copy; 2024 Yako King Studio | www.yakoking.cz</p>
        </a>
      </footer>
    </div>
  );
};

// --- RENDER ---
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}