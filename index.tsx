
import React, { useState } from 'react';
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

const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

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
      <p className="mt-2 text-slate-400 text-[9px] uppercase tracking-widest font-medium italic">Gemini 2.5 Flash Engine</p>
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
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUserFile(file);
      setUserImg(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const copyImageToClipboard = async () => {
    if (!result) return;
    try {
      const response = await fetch(result);
      const blob = await response.blob();
      
      // Zkusíme nejdřív zkopírovat samotný obrázek (funguje na desktopu skvěle)
      if (typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 3000);
      } else {
        // Fallback na odkaz
        navigator.clipboard.writeText(YAKO_URL);
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 3000);
      }
    } catch (err) {
      console.error("Copy failed", err);
      // Poslední záchrana: jen text
      navigator.clipboard.writeText(YAKO_URL);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 3000);
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Koukni na můj novej fit z Yako King Studio! Vyzkoušej si ho taky na: ${YAKO_URL}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShare = async () => {
    if (!result) return;
    try {
      const file = base64ToFile(result, 'yako-king-fit.png');
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Yako King Outfit',
          text: `Můj novej fit z Yako King Studia! 🔥`,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: 'Yako King Outfit',
          url: YAKO_URL,
        });
      } else {
        copyImageToClipboard();
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        copyImageToClipboard();
      }
    }
  };

  const generate = async () => {
    if (!userFile || !selected || loading) return;
    setLoading(true);
    setError(null);
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("Chybí API klíč.");

      const ai = new GoogleGenAI({ apiKey });
      const [uPart, iPart] = await Promise.all([
        fileToPart(userFile), 
        urlToPart(selected.imageUrl)
      ]);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: "VIRTUAL TRY-ON: Take the EXACT clothing item from Image 2 and superimpose it naturally on the person in Image 1. Keep the person's face, skin, and original background exactly as they are. The result must be a high-quality, realistic professional clothing model photograph." },
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
           document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      } else {
        throw new Error("Obrázek nebyl vygenerován. Zkuste to prosím znovu.");
      }
    } catch (err: any) {
      console.error("AI Error:", err);
      setError("Omlouváme se, došlo k chybě. Zkuste jinou fotku.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-10 flex flex-col items-center bg-[#f8faff] text-slate-900">
      <header className="mb-10 text-center animate-fade-in w-full max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-black text-slate-950 italic tracking-tighter leading-none mb-4 uppercase">Virtuální kabinka</h1>
        <p className="text-slate-500 font-medium text-sm md:text-base">Vyber si kousek a zkus si ho virtuálně na sobě.</p>
      </header>

      <main className="w-full max-w-2xl flex flex-col gap-8">
        <div className="glass p-6 md:p-10 rounded-[2.5rem] space-y-10 animate-fade-in relative z-10">
          <section>
            <div className="flex justify-between items-end mb-4">
               <h3 className="text-[11px] font-black uppercase text-indigo-900/40 tracking-[0.3em]">01. Tvůj základ</h3>
               {userImg && <button type="button" onClick={() => {setUserImg(null); setUserFile(null); setResult(null);}} className="text-[10px] font-bold text-red-400 uppercase tracking-widest hover:text-red-600">Změnit fotku</button>}
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
                  <p className="text-indigo-600 font-black text-[10px] uppercase tracking-widest">Nahraj svou postavu</p>
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-[11px] font-black uppercase text-indigo-900/40 mb-4 tracking-[0.3em]">02. Vyber Yako kousek</h3>
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

          <div className="pt-2">
            <button 
              type="button"
              onClick={generate} 
              disabled={loading || !userFile || !selected} 
              className="w-full py-6 btn-grad text-white font-black rounded-2xl shadow-xl disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-[0.5em] text-[13px] flex items-center justify-center"
            >
              {loading ? 'VYTVÁŘÍM OUTFIT...' : 'NASADIT NA SEBE'}
            </button>
          </div>
          
          {error && (
            <p className="text-red-500 font-bold text-center text-[10px] uppercase tracking-widest">{error}</p>
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
                <h3 className="text-[11px] font-black uppercase text-indigo-900/40 tracking-[0.3em] mb-2">Takhle ti to sekne</h3>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Ulož si fotku a pochlub se!</p>
              </div>
              
              <div className="relative w-full max-w-md group">
                <img src={result} className="w-full rounded-[2rem] shadow-2xl border border-indigo-50" alt="Výsledek" />
                <div className="absolute top-4 right-4 flex flex-col gap-3">
                   <a href={result} download="yako-king-fit.png" className="w-12 h-12 bg-white/95 backdrop-blur text-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all cursor-pointer" title="Stáhnout">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   </a>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 w-full max-w-xs">
                {/* HLAVNÍ SDÍLECÍ TLAČÍTKO */}
                <button 
                  onClick={handleShare}
                  className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-[11px] hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  Sdílet s přáteli
                </button>

                {/* WHATSAPP TLAČÍTKO */}
                <button 
                  onClick={handleWhatsAppShare}
                  className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-[11px] hover:bg-emerald-600 transition-all flex items-center justify-center gap-3"
                >
                  Poslat na WhatsApp
                </button>
                
                {/* KOPIE DO SCHRÁNKY */}
                <button 
                  onClick={copyImageToClipboard}
                  className={`w-full py-4 border-2 font-black rounded-2xl uppercase tracking-[0.2em] text-[11px] transition-all flex items-center justify-center gap-3 ${copyStatus === 'copied' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                >
                  {copyStatus === 'copied' ? (
                    <span className="flex items-center gap-2">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                       Zkopírováno! (Vložte Ctrl+V)
                    </span>
                  ) : 'Kopírovat pro vložení'}
                </button>

                <button type="button" onClick={() => setResult(null)} className="text-slate-300 hover:text-slate-500 text-[9px] uppercase font-black tracking-widest mt-4">
                  Zkusit jiný kousek
                </button>
              </div>
            </div>
          ) : (
             <div className="glass rounded-[3rem] p-16 flex flex-col items-center justify-center text-center opacity-30">
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Zde se zobrazí výsledek</p>
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
