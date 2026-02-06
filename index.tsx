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

const YAKO_URL = "https://www.yakoking.cz";
const getSafeUrl = (url: string, width = 600) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=${width}&fit=contain&output=webp`;

// --- POMOCNÉ FUNKCE ---
const fileToPart = async (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (!result) return reject("Chyba čtení souboru.");
      resolve({ inlineData: { data: result.split(',')[1], mimeType: file.type } });
    };
    reader.onerror = () => reject("Chyba čtení souboru.");
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
      reader.onerror = () => reject("Chyba zpracování produktu.");
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    throw new Error("Chyba stažení produktu.");
  }
};

const Loader = () => (
  <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
    <div className="relative w-20 h-20">
      <div className="absolute inset-0 rounded-full border-[3px] border-indigo-100 opacity-30"></div>
      <div className="absolute inset-0 rounded-full border-[3px] border-indigo-600 border-t-transparent animate-spin"></div>
    </div>
    <div className="mt-10 text-center">
      <p className="text-indigo-600 font-black text-[11px] uppercase tracking-[0.4em] animate-pulse">Navrhuji tvůj styl...</p>
      <p className="mt-2 text-slate-400 text-[9px] uppercase tracking-widest font-medium italic">Gemini 3 Pro v akci</p>
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
  const [hasKey, setHasKey] = useState(true);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasKey(true); // Předpokládáme úspěch pro plynulost
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
          text: `Checkni, jak mi sekne tenhle kousek od Yako King! Víc na ${YAKO_URL}`,
          url: YAKO_URL,
        });
      } else {
        alert(`Uloženo. Navštivte ${YAKO_URL}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generate = async () => {
    if (!userFile || !selected || loading) return;

    setLoading(true);
    setError(null);
    try {
      // Vytváříme novou instanci přímo zde, aby se vždy použil aktuální klíč
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const [uPart, iPart] = await Promise.all([
        fileToPart(userFile), 
        urlToPart(selected.imageUrl)
      ]);
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [
            { text: "VIRTUAL TRY-ON: Realistic professional fashion photograph. Take the exact clothing item from Image 2 and place it naturally on the person in Image 1. Maintain the person's identity, face, and the original background perfectly. Ensure realistic fabric folds, shadows and high-end studio lighting." },
            uPart as any, 
            iPart as any
          ]
        },
        config: { imageConfig: { aspectRatio: "3:4", imageSize: "1K" } }
      });

      const parts = response.candidates?.[0]?.content?.parts;
      const imagePart = parts?.find((p: any) => p.inlineData);
      
      if (imagePart?.inlineData?.data) {
        setResult(`data:image/png;base64,${imagePart.inlineData.data}`);
        setTimeout(() => {
           document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      } else {
        throw new Error("AI nepředala obrázek. Zkuste to znovu.");
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("entity was not found")) {
        setHasKey(false);
        setError("Klíč k AI nebyl nalezen. Prosím klikněte na tlačítko Nastavit klíč.");
      } else {
        setError("Technická chyba. Zkuste jinou fotku nebo to zkuste za chvíli.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-10 flex flex-col items-center bg-[#f8faff] text-slate-900">
      <header className="mb-12 text-center animate-fade-in w-full max-w-2xl">
        <div className="inline-block bg-white border border-indigo-100 px-6 py-2 rounded-full mb-6 shadow-sm">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em]">Yako King Studio 3.0</p>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-950 italic tracking-tighter leading-none mb-4">Virtuální kabinka</h1>
        <p className="text-slate-500 font-medium text-sm md:text-base leading-relaxed">Špičková AI technologie pro váš dokonalý výběr.</p>
      </header>

      <main className="w-full max-w-2xl flex flex-col gap-8">
        <div className="glass p-6 md:p-10 rounded-[2.5rem] space-y-10 animate-fade-in relative z-10">
          <section>
            <div className="flex justify-between items-end mb-5">
               <h3 className="text-[11px] font-black uppercase text-indigo-900/40 tracking-[0.3em]">01. Tvůj základ</h3>
               {userImg && <button onClick={() => {setUserImg(null); setUserFile(null); setResult(null);}} className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Reset</button>}
            </div>
            <div className={`relative border-2 border-dashed rounded-3xl flex items-center justify-center overflow-hidden transition-all duration-500 min-h-[160px] ${userImg ? 'border-indigo-200 bg-white' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30'}`}>
              {!userImg && <input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" />}
              {userImg ? (
                <img src={userImg} className="w-full max-h-[300px] object-contain" alt="User" />
              ) : (
                <div className="text-center p-6 pointer-events-none">
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <p className="text-indigo-600 font-black text-[10px] uppercase tracking-widest">Nahraj svou fotku</p>
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-[11px] font-black uppercase text-indigo-900/40 mb-5 tracking-[0.3em]">02. Co si zkusíš?</h3>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3 max-h-[250px] overflow-y-auto pr-2 clothing-scroll">
              {CLOTHING_ITEMS.map(item => (
                <button 
                  key={item.id} 
                  onClick={() => { setSelected(item); setResult(null); setError(null); }}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 relative ${selected?.id === item.id ? 'border-indigo-600 scale-[0.95] ring-4 ring-indigo-50' : 'border-transparent bg-white shadow-sm hover:scale-[1.05]'}`}
                >
                  <img src={getSafeUrl(item.imageUrl, 200)} className="w-full h-full object-cover" alt={item.name} />
                </button>
              ))}
            </div>
          </section>

          <div className="pt-4 flex flex-col gap-3">
            {!hasKey ? (
               <div className="flex flex-col items-center p-6 border-2 border-indigo-100 rounded-3xl bg-indigo-50/20">
                  <p className="text-[10px] font-bold text-indigo-900/60 uppercase tracking-widest mb-4 text-center leading-relaxed">
                    Pro spuštění AI na tomto webu je potřeba vybrat klíč.<br/>
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-indigo-600 underline">Info o účtování najdete zde.</a>
                  </p>
                  <button onClick={handleSelectKey} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-[0.3em] text-[12px] shadow-lg hover:bg-indigo-700 transition-colors">
                    Nastavit klíč k AI
                  </button>
               </div>
            ) : (
              <button 
                onClick={generate} 
                disabled={loading || !userFile || !selected} 
                className="w-full py-6 btn-grad text-white font-black rounded-2xl shadow-xl disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-[0.5em] text-[13px] flex items-center justify-center"
              >
                {loading ? 'Generuji...' : 'Vyzkoušet na sobě'}
              </button>
            )}
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl animate-fade-in text-center">
              <p className="text-red-500 font-bold text-[10px] uppercase tracking-widest leading-relaxed">{error}</p>
            </div>
          )}
        </div>

        <div id="result-section" className="w-full">
          {loading ? (
            <div className="glass rounded-[3rem] min-h-[400px] flex items-center justify-center">
              <Loader />
            </div>
          ) : result ? (
            <div className="glass rounded-[3rem] p-6 md:p-10 flex flex-col items-center animate-fade-in space-y-8">
              <h3 className="text-[11px] font-black uppercase text-indigo-900/40 tracking-[0.3em]">Tvůj nový fit</h3>
              <div className="relative group w-full max-w-md">
                <img src={result} className="w-full rounded-[2rem] shadow-2xl border border-indigo-50" alt="Výsledek" />
                <div className="absolute top-4 right-4 flex gap-3">
                   <button onClick={handleShare} className="w-12 h-12 bg-white/95 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform text-indigo-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                   </button>
                   <a href={result} download="yako-king-fit.png" className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   </a>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <a href={YAKO_URL} target="_blank" rel="noopener noreferrer" className="px-8 py-3 rounded-full border border-indigo-100 text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 transition-colors">Koupit na e-shopu</a>
                <button onClick={() => setResult(null)} className="text-slate-300 hover:text-slate-500 text-[9px] uppercase font-black tracking-widest pt-4">Zkusit něco jiného</button>
              </div>
            </div>
          ) : (
             <div className="glass rounded-[3rem] p-20 flex flex-col items-center justify-center text-center opacity-40">
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Zde se zobrazí tvůj outfit</p>
             </div>
          )}
        </div>
      </main>

      <footer className="mt-20 mb-10 text-center">
        <a href={YAKO_URL} target="_blank" rel="noopener noreferrer" className="group">
           <p className="text-[10px] font-black text-slate-900/20 uppercase tracking-[0.5em] group-hover:text-indigo-600/60 transition-colors">&copy; 2024 Yako King Studio | www.yakoking.cz</p>
        </a>
      </footer>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}