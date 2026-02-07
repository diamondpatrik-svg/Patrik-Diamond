import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- KONSTANTY PRODUKTŮ ---
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

const fileToPart = async (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (!result) return reject("Chyba čtení nahraného obrázku.");
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
    if (!res.ok) throw new Error("Obrázek produktu se nepodařilo stáhnout.");
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve({ inlineData: { data: result.split(',')[1], mimeType: 'image/jpeg' } });
      };
      reader.onerror = () => reject("Chyba při převodu produktu.");
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("UrlToPart error:", err);
    throw new Error("Nepodařilo se připravit data produktu.");
  }
};

const Loader = () => (
  <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
    <div className="relative w-20 h-20">
      <div className="absolute inset-0 rounded-full border-[3px] border-indigo-100 opacity-30"></div>
      <div className="absolute inset-0 rounded-full border-[3px] border-indigo-600 border-t-transparent animate-spin"></div>
    </div>
    <div className="mt-10 text-center">
      <p className="text-indigo-600 font-black text-[11px] uppercase tracking-[0.4em] animate-pulse">Navrhuji tvůj outfit...</p>
      <p className="mt-2 text-slate-400 text-[9px] uppercase tracking-widest font-medium italic">Gemini 3 Pro Studio</p>
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

  const getApiKey = () => {
    return process.env.API_KEY;
  };

  useEffect(() => {
    const checkKey = async () => {
      const studio = (window as any).aistudio;
      if (studio?.hasSelectedApiKey) {
        const selected = await studio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        setHasKey(!!getApiKey());
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    const studio = (window as any).aistudio;
    if (studio?.openSelectKey) {
      await studio.openSelectKey();
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

  const handleShare = async () => {
    if (!result) return;
    
    try {
      // Převod base64 na File pro sdílení
      const response = await fetch(result);
      const blob = await response.blob();
      const file = new File([blob], 'yako-king-fit.png', { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          title: 'Můj nový Yako King outfit!',
          text: `Podívej se na můj nový fit z Yako King Studio! Vyzkoušej si ho taky na ${YAKO_URL}`,
          files: [file],
        });
      } else {
        // Fallback pro desktop - kopírování odkazu nebo prosté otevření e-shopu
        alert("Funkce přímého sdílení není ve vašem prohlížeči podporována. Obrázek si můžete stáhnout pomocí tlačítka se šipkou.");
      }
    } catch (err) {
      console.error("Chyba při sdílení:", err);
    }
  };

  const generate = async () => {
    if (!userFile || !selected || loading) return;

    setLoading(true);
    setError(null);
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        setHasKey(false);
        throw new Error("API klíč nebyl vybrán.");
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
            { text: "VIRTUAL TRY-ON: Take the EXACT clothing item from Image 2 and superimpose it naturally on the person in Image 1. Keep the person's face, skin, and original background exactly as they are. The result must be a high-quality, realistic professional clothing model photograph." },
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
        throw new Error("AI nevygenerovala obrázek. Zkuste prosím jinou fotografii postavy.");
      }
    } catch (err: any) {
      console.error("AI Error:", err);
      if (err.message?.includes("Requested entity was not found") || err.message?.includes("API key") || err.message?.includes("billing")) {
        setHasKey(false);
        setError("Chyba API klíče: Pro tento model (Gemini 3 Pro) Google vyžaduje projekt s aktivovaným billingem (platební kartou). Vygenerování jednoho obrázku stojí řádově jen pár haléřů.");
      } else if (err.message?.includes("Safety")) {
        setError("Bezpečnostní filtr AI zablokoval tento obrázek. Zkuste fotku v lepším světle.");
      } else {
        setError(err.message || "Technická chyba serveru. Zkuste to prosím za okamžik.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-10 flex flex-col items-center bg-[#f8faff] text-slate-900">
      <header className="mb-12 text-center animate-fade-in w-full max-w-2xl">
        <div className="inline-block bg-white border border-indigo-100 px-6 py-2 rounded-full mb-6 shadow-sm">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em]">Yako King AI Studio</p>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-950 italic tracking-tighter leading-none mb-4">Virtuální kabinka</h1>
        <p className="text-slate-500 font-medium text-sm md:text-base">Zkuste si náš styl bez převlékání. Stačí jedna fotka.</p>
      </header>

      <main className="w-full max-w-2xl flex flex-col gap-8">
        <div className="glass p-6 md:p-10 rounded-[2.5rem] space-y-10 animate-fade-in relative z-10">
          <section>
            <div className="flex justify-between items-end mb-5">
               <h3 className="text-[11px] font-black uppercase text-indigo-900/40 tracking-[0.3em]">01. Tvá postava</h3>
               {userImg && <button type="button" onClick={() => {setUserImg(null); setUserFile(null); setResult(null);}} className="text-[10px] font-bold text-red-400 uppercase tracking-widest hover:text-red-600">Změnit</button>}
            </div>
            <div className={`relative border-2 border-dashed rounded-3xl flex items-center justify-center overflow-hidden transition-all duration-500 min-h-[160px] ${userImg ? 'border-indigo-200 bg-white' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer'}`}>
              {!userImg && <input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" />}
              {userImg ? (
                <img src={userImg} className="w-full max-h-[300px] object-contain" alt="Uživatel" />
              ) : (
                <div className="text-center p-6 pointer-events-none">
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <p className="text-indigo-600 font-black text-[10px] uppercase tracking-widest">Nahrát tvou fotku</p>
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-[11px] font-black uppercase text-indigo-900/40 mb-5 tracking-[0.3em]">02. Výběr oblečení</h3>
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
                  <h4 className="text-[12px] font-black text-indigo-900 uppercase tracking-widest mb-2">Vyžadován API klíč (Paid Tier)</h4>
                  <p className="text-[10px] text-indigo-900/70 text-center mb-4 leading-relaxed">
                    Tato AI funkce používá model <strong>Gemini 3 Pro</strong>. Google u něj vyžaduje projekt s aktivovaným billingem. <br/>
                    <em>Nebojte se, cena za jeden obrázek je jen pár haléřů a Google dává novým účtům 300 USD kredit zdarma.</em>
                  </p>
                  <button type="button" onClick={handleSelectKey} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-[0.3em] text-[12px] shadow-lg hover:bg-indigo-700 transition-colors">
                    Nastavit / Vybrat API Klíč
                  </button>
                  <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="mt-3 text-[9px] font-bold text-indigo-600 underline uppercase tracking-tighter">Jak zapnout billing v Google AI Studiu?</a>
               </div>
            ) : (
              <button 
                type="button"
                onClick={generate} 
                disabled={loading || !userFile || !selected} 
                className="w-full py-6 btn-grad text-white font-black rounded-2xl shadow-xl disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-[0.5em] text-[13px] flex items-center justify-center"
              >
                {loading ? 'AI PRACUJE...' : 'NASADIT OUTFIT'}
              </button>
            )}
          </div>
          
          {error && (
            <div className="p-5 bg-red-50 border border-red-100 rounded-2xl animate-fade-in text-center">
              <p className="text-red-600 font-bold text-[10px] uppercase tracking-widest leading-normal">{error}</p>
              <button onClick={() => window.location.reload()} className="text-[9px] mt-3 font-black text-red-700 underline uppercase tracking-tighter">Zkusit restartovat aplikaci</button>
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
              <div className="text-center">
                <h3 className="text-[11px] font-black uppercase text-indigo-900/40 tracking-[0.3em] mb-2">Tvůj nový Yako King fit</h3>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest italic">Nezapomeň se pochlubit!</p>
              </div>
              
              <div className="relative group w-full max-w-md">
                <img src={result} className="w-full rounded-[2rem] shadow-2xl border border-indigo-50" alt="Výsledek" />
                
                {/* Overlay tlačítka na mobilu i desktopu */}
                <div className="absolute top-4 right-4 flex flex-col gap-3">
                   <a href={result} download="yako-king-fit.png" title="Stáhnout fotografii" className="w-12 h-12 bg-white/90 backdrop-blur text-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   </a>
                   <button onClick={handleShare} title="Sdílet výsledek" className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                   </button>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 w-full">
                <button 
                  onClick={handleShare}
                  className="w-full max-w-xs py-4 bg-indigo-50 text-indigo-600 font-black rounded-2xl uppercase tracking-[0.2em] text-[11px] hover:bg-indigo-100 transition-colors flex items-center justify-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  Sdílet můj Yako King styl
                </button>

                <a href={YAKO_URL} target="_blank" rel="noopener noreferrer" className="px-10 py-4 rounded-full border border-indigo-100 text-[12px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-sm text-center">
                  Koupit tento kousek na e-shopu
                </a>

                <button type="button" onClick={() => setResult(null)} className="text-slate-300 hover:text-slate-500 text-[9px] uppercase font-black tracking-widest mt-4">
                  Zkusit jinou kombinaci
                </button>
              </div>
            </div>
          ) : (
             <div className="glass rounded-[3rem] p-20 flex flex-col items-center justify-center text-center opacity-40">
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Tady uvidíš svůj nový fit</p>
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
