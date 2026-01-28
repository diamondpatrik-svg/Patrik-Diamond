
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- KONSTANTA PRODUKTŮ ---
const CLOTHING_ITEMS = [
  { name: 'Béžová mikina s kapucí', imageUrl: 'https://yakoking.cz/images_upd/products/7/w61mxk9y4zjf.webp' },
  { name: 'Černá mikina s kapucí', imageUrl: 'https://yakoking.cz/images_upd/products/5/pvxjwz8c4yq2.jpg' },
  { name: 'Béžová mikina s kapucí černý střík', imageUrl: 'https://yakoking.cz/images_upd/products/6/jqh37e2wbt6i.jpg' },
  { name: 'Khaki mikina s kapucí', imageUrl: 'https://yakoking.cz/images_upd/products/1/1tvwsi0j89pn.jpg' },
  { name: 'Modrá mikina s kapucí', imageUrl: 'https://yakoking.cz/images_upd/products/8/o05k6hlq2ret.jpg' },
  { name: 'Mikinové šaty bez kapuce černé', imageUrl: 'https://yakoking.cz/images_upd/products/9/lyemx76ksg1j.jpg' },
  { name: 'Dámská mikina bez kapuce', imageUrl: 'https://yakoking.cz/images_upd/products/3/eyqchobf7knw.jpg' },
  { name: 'Dámské triko 100% bavlna', imageUrl: 'https://yakoking.cz/images_upd/products/7/kha02lvm6t1p.jpg' },
  { name: 'Crop Top Jaro', imageUrl: 'https://yakoking.cz/images_upd/products/3/9l3n27tgeyq4.jpg' },
  { name: 'Crop Top Léto', imageUrl: 'https://yakoking.cz/images_upd/products/9/5m831gfkjary.jpg' },
  { name: 'Khaki mikina stříkaná trhaná', imageUrl: 'https://yakoking.cz/images_upd/products/3/ghrcsab8jf9l.jpg' },
  { name: 'Černá mikina stříkaná trhaná', imageUrl: 'https://yakoking.cz/images_upd/products/1/vlstbeif261m.jpg' },
  { name: 'Červená mikina stříkaná trhaná', imageUrl: 'https://yakoking.cz/images_upd/products/5/yi6rfa417oqv.jpg' },
  { name: 'Šedá mikina stříkaná trhaná', imageUrl: 'https://yakoking.cz/images_upd/products/4/4y1ipxet8kcb.jpg' },
  { name: 'Šafránová mikina stříkaná trhaná', imageUrl: 'https://yakoking.cz/images_upd/products/2/37t81crbueo4.jpg' },
  { name: 'Pánské triko 100% bavlna', imageUrl: 'https://yakoking.cz/images_upd/products/3/8eta512klsp4.jpg' },
];

const getSafeUrl = (url: string, width = 600) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=${width}&fit=contain`;

// --- POMOCNÉ FUNKCE ---
const fileToPart = async (file: File) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve({ inlineData: { data: result.split(',')[1], mimeType: file.type } });
    };
    reader.readAsDataURL(file);
  });
};

const urlToPart = async (url: string) => {
  const res = await fetch(getSafeUrl(url, 1000));
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve({ inlineData: { data: result.split(',')[1], mimeType: 'image/jpeg' } });
    };
    reader.readAsDataURL(blob);
  });
};

// --- KOMPONENTY ---
const Loader = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="relative w-20 h-20">
      <div className="absolute inset-0 rounded-full border-4 border-indigo-100 opacity-20"></div>
      <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
    </div>
    <p className="mt-8 text-indigo-600 font-black text-[11px] uppercase tracking-[0.4em] animate-pulse">Upravuji tvůj fit...</p>
    <p className="mt-2 text-slate-400 text-[9px] uppercase tracking-widest">To může trvat až 20 sekund</p>
  </div>
);

const ShareButtons = ({ imageUrl }: { imageUrl: string }) => {
  const [status, setStatus] = useState<'idle' | 'copied' | 'sharing'>('idle');

  const handleShare = async () => {
    if (status !== 'idle') return;

    if (!navigator.share) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setStatus('copied');
        setTimeout(() => setStatus('idle'), 2000);
      } catch (err) {}
      return;
    }

    try {
      setStatus('sharing');
      const shareData: any = {
        title: 'Můj nový Yako King look!',
        text: 'Zkouším oblečení ve virtuální kabince Yako King.',
        url: window.location.href,
      };

      try {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        const imageFile = new File([blob], 'yako-king-look.png', { type: 'image/png' });
        
        if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
          shareData.files = [imageFile];
        }
      } catch (e) {
        console.warn("Could not prepare file for sharing, sharing link only.");
      }

      await navigator.share(shareData);
    } catch (e: any) {
      // AbortError is thrown when user cancels the share sheet, which is normal behavior
      if (e.name !== 'AbortError') {
        console.error("Sharing failed", e);
        // Fallback to copying link
        try {
          await navigator.clipboard.writeText(window.location.href);
          setStatus('copied');
          setTimeout(() => setStatus('idle'), 2000);
        } catch (err) {}
      }
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full mt-6">
      <div className="flex gap-3 w-full max-w-md">
        <button 
          onClick={handleShare} 
          className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
        >
          {status === 'copied' ? 'Odkaz zkopírován' : 'Sdílet look'}
        </button>
        <a 
          href={imageUrl} 
          download="yako-king-fit.png" 
          className="flex-1 py-4 bg-white text-gray-500 font-bold rounded-2xl text-[10px] uppercase tracking-widest border border-gray-100 text-center hover:bg-gray-50 flex items-center justify-center"
        >
          Uložit
        </a>
      </div>
    </div>
  );
};

// --- HLAVNÍ APLIKACE ---
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
      setUserFile(file);
      setUserImg(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const generate = async () => {
    if (!userFile || !selected) return;
    setLoading(true);
    setError(null);
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("Systémová chyba: Chybí přístupový klíč k AI.");

      const ai = new GoogleGenAI({ apiKey });
      const [uPart, iPart] = await Promise.all([fileToPart(userFile), urlToPart(selected.imageUrl)]);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: "VIRTUAL TRY-ON: Take the exact clothing item shown in Image 2 and place it on the person in Image 1. IMPORTANT: Keep the person's face, hair, and background exactly as they are in Image 1. The clothing should fit naturally on the person's body. High quality fashion photography style." },
            uPart as any, 
            iPart as any
          ]
        },
        config: { imageConfig: { aspectRatio: "3:4" } }
      });

      const candidate = response.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find((p: any) => p.inlineData);
      
      if (imagePart?.inlineData?.data) {
        setResult(`data:image/png;base64,${imagePart.inlineData.data}`);
      } else {
        throw new Error("AI nepodařilo vygenerovat obrázek. Zkuste prosím jinou fotku postavy (lépe osvětlenou).");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Došlo k chybě při komunikaci s AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-10 flex flex-col items-center">
      <header className="mb-12 text-center animate-fade-in">
        <div className="inline-block bg-indigo-50 px-4 py-1 rounded-full mb-4">
          <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.4em]">Yako King Handmade Studio</p>
        </div>
        <h1 className="text-4xl md:text-7xl font-black text-indigo-950 italic tracking-tighter leading-none">Virtuální kabinka</h1>
        <p className="mt-4 text-slate-400 font-medium text-sm max-w-md mx-auto">Vyberte si kousek z naší dílny a vyzkoušejte si ho přímo na své fotce.</p>
      </header>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEVÝ PANEL - OVLÁDÁNÍ */}
        <div className="lg:col-span-4 glass p-6 md:p-8 rounded-[2.5rem] shadow-2xl space-y-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <section>
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-[10px] font-black uppercase text-indigo-900/40 tracking-widest">01. Tvoje postava</h3>
               {userImg && <button onClick={() => {setUserImg(null); setUserFile(null);}} className="text-[9px] font-bold text-red-400 uppercase">Změnit</button>}
            </div>
            
            <div className={`relative group border-2 border-dashed rounded-3xl flex items-center justify-center overflow-hidden transition-all duration-500 ${userImg ? 'h-40 border-indigo-200 bg-indigo-50/20' : 'h-32 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30'}`}>
              {!userImg && <input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />}
              {userImg ? (
                <img src={userImg} className="w-full h-full object-cover" alt="User" />
              ) : (
                <div className="text-center">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-indigo-600 font-black text-[10px] uppercase tracking-widest">Nahrát fotku</p>
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-black uppercase text-indigo-900/40 mb-4 tracking-widest">02. Vyber si kousek</h3>
            <div className="grid grid-cols-4 gap-2 max-h-[340px] overflow-y-auto pr-2 clothing-scroll">
              {CLOTHING_ITEMS.map(item => (
                <button 
                  key={item.name} 
                  onClick={() => { setSelected(item); setResult(null); setError(null); }}
                  className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 ${selected?.name === item.name ? 'border-indigo-600 scale-95 ring-4 ring-indigo-50' : 'border-transparent bg-slate-50 opacity-70 hover:opacity-100'}`}
                >
                  <img src={getSafeUrl(item.imageUrl, 150)} className="w-full h-full object-cover" alt={item.name} />
                </button>
              ))}
            </div>
          </section>

          <button 
            onClick={generate} 
            disabled={loading || !userFile || !selected}
            className="w-full py-5 btn-grad text-white font-black rounded-2xl shadow-xl disabled:opacity-30 uppercase tracking-[0.4em] text-[11px]"
          >
            {loading ? 'Generuji...' : 'Vyzkoušet na sobě'}
          </button>
        </div>

        {/* PRAVÝ PANEL - NÁHLED */}
        <div className="lg:col-span-8 glass rounded-[3rem] p-4 flex flex-col items-center justify-center min-h-[500px] lg:min-h-[750px] shadow-2xl relative overflow-hidden animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {loading ? (
            <Loader />
          ) : result ? (
            <div className="w-full h-full flex flex-col items-center p-4 animate-fade-in">
              <div className="relative group">
                <img src={result} className="max-h-[650px] rounded-[2.5rem] shadow-2xl object-contain bg-white ring-1 ring-black/5" alt="Výsledek" />
                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg">
                   <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Tvůj nový fit</p>
                </div>
              </div>
              <ShareButtons imageUrl={result} />
              <button onClick={() => setResult(null)} className="mt-8 text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-indigo-600 transition-colors">Zkusit jinou kombinaci</button>
            </div>
          ) : selected ? (
            <div className="text-center group animate-fade-in flex flex-col items-center">
              <div className="relative">
                <img src={getSafeUrl(selected.imageUrl, 800)} className="max-h-[500px] rounded-[3rem] shadow-2xl bg-white mb-8 group-hover:scale-[1.02] transition-transform duration-700" alt="Produkt" />
                <div className="absolute inset-0 rounded-[3rem] ring-1 ring-inset ring-black/5 pointer-events-none"></div>
              </div>
              <h4 className="text-indigo-950 font-black uppercase text-[16px] tracking-widest mb-1">{selected.name}</h4>
              <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-[0.3em] opacity-60">Ručně šito v Yako King</p>
            </div>
          ) : (
            <div className="text-center p-12 max-w-sm">
               <div className="w-20 h-20 mx-auto bg-indigo-50 rounded-full flex items-center justify-center mb-8 border border-indigo-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
               </div>
               <p className="text-indigo-950/20 font-black uppercase tracking-[0.6em] text-[13px] italic mb-2">Yako King AI Studio</p>
               <p className="text-slate-400 text-[10px] uppercase tracking-widest leading-loose">Nahrajte fotku své postavy a vyberte produkt z menu pro spuštění kabinky.</p>
            </div>
          )}
          
          {error && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-red-50 px-8 py-4 rounded-2xl shadow-xl border border-red-100 animate-fade-in flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <p className="text-red-600 font-bold text-[10px] uppercase tracking-widest">{error}</p>
            </div>
          )}
        </div>
      </div>
      
      <footer className="mt-20 py-10 opacity-30 text-center w-full">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-500">
          &copy; {new Date().getFullYear()} Yako King Handmade &bull; Technologie AI Gemini
        </p>
      </footer>
    </div>
  );
};

// --- RENDER ---
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
