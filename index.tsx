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
const getSafeUrl = (url: string, width = 800) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=${width}&fit=contain&output=webp&n=-1`;

// --- POMOCNÉ FUNKCE ---
const fileToPart = async (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (!result) return reject("Nepodařilo se přečíst nahranou fotku.");
      resolve({ inlineData: { data: result.split(',')[1], mimeType: file.type } });
    };
    reader.onerror = () => reject("Chyba při čtení souboru.");
    reader.readAsDataURL(file);
  });
};

const urlToPart = async (url: string) => {
  try {
    const safeUrl = getSafeUrl(url, 1000);
    const res = await fetch(safeUrl);
    if (!res.ok) throw new Error("Produkt se nepodařilo stáhnout.");
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve({ inlineData: { data: result.split(',')[1], mimeType: 'image/jpeg' } });
      };
      reader.onerror = () => reject("Chyba při zpracování produktu.");
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("UrlToPart error:", err);
    throw new Error("Nepodařilo se připravit obrázek produktu.");
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
      <p className="mt-2 text-slate-400 text-[9px] uppercase tracking-widest font-medium italic">Gemini 3 Pro AI v akci</p>
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

  // Bezpečné získání API klíče bez pádů ReferenceError
  const getApiKey = () => {
    try {
      return (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;
    } catch {
      return undefined;
    }
  };

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // Pokud není key dialog k dispozici, zkontrolujeme process.env
        setHasKey(!!getApiKey());
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
      setError(null);
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

  const generate = async () => {
    if (!userFile || !selected || loading) return;

    setLoading(true);
    setError(null);
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        setHasKey(false);
        throw new Error("API klíč nebyl nalezen. Prosím vyberte jej v nastavení.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const [uPart, iPart] = await Promise.all([
        fileToPart(userFile), 
        urlToPart(selected.imageUrl)
      ]);
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [
            { text: "VIRTUAL TRY-ON: Take the EXACT clothing item from Image 2 and superimpose it onto the person in Image 1. Maintain the person's face, identity and background perfectly. The final image should look like a professional studio fashion photograph." },
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
        }, 100);
      } else {
        throw new Error("AI nevrátila obrázek. Zkuste prosím jinou fotografii.");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      if (err.message?.includes("Requested entity was not found") || err.message?.includes("API key")) {
        setHasKey(false);
        setError("Váš API klíč je neplatný. Klikněte na 'Nastavit klíč'.");
      } else if (err.message?.includes("Safety")) {
        setError("AI vyhodnotila obrázek jako nevhodný. Zkuste prosím jinou fotku.");
      } else {
        setError(err.message || "Došlo k technické chybě. Zkuste to za chvíli.");
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
        <p className="text-slate-500 font-medium text-sm md:text-base leading-relaxed">Vyzkoušejte si naše kousky přímo na své fotce.</p>
      </header>

      <main className="w-full max-w-2xl flex flex-col gap-8">
        <div className="glass p-6 md:p-10 rounded-[2.5rem] space-y-10 animate-fade-in relative z-10">
          <section>
            <div className="flex justify-between items-end mb-5">
               <h3 className="text-[11px] font-black uppercase text-indigo-900/40 tracking-[0.3em]">01. Tvůj základ</h3>
               {userImg && <button type="button" onClick={() => {setUserImg(null); setUserFile(null); setResult(null);}} className="text-[10px] font-bold text-red-400 uppercase tracking-widest hover:text-red-600">Reset</button>}
            </div>
            <div className={`relative border-2 border-dashed rounded-3xl flex items-center justify-center overflow-hidden transition-all duration-500 min-h-[160px] ${userImg ? 'border-indigo-200 bg-white' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer'}`}>
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
                  type="button"
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
               <div className="flex flex-col items-center p-6 border-2 border-indigo-100 rounded-3xl bg-indigo-50/20 animate-fade-in">
                  <p className="text-[10px] font-bold text-indigo-900/60 uppercase tracking-widest mb-4 text-center leading-relaxed">
                    Pro spuštění AI na tomto webu musíte vybrat klíč.<br/>
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-indigo-600 underline">Více info o Gemini API</a>
                  </p>
                  <button type="button" onClick={handleSelectKey} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-[0.3em] text-[12px] shadow-lg hover:bg-indigo-700 transition-colors">
                    Nastavit klíč k AI
                  </button>
               </div>
            ) : (
              <button 
                type="button"
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
              <button onClick={() => window.location.reload()} className="text-[9px] mt-2 font-black text-red-700 underline uppercase tracking-tighter">Restartovat aplikaci</button>
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
                   <a href={result} download="yako-king-fit.png" className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   </a>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <a href={YAKO_URL} target="_blank" rel="noopener noreferrer" className="px-8 py-3 rounded-full border border-indigo-100 text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 transition-colors">Koupit na e-shopu</a>
                <button type="button" onClick={() => setResult(null)} className="text-slate-300 hover:text-slate-500 text-[9px] uppercase font-black tracking-widest pt-4">Zkusit něco jiného</button>
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