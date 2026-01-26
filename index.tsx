import React, { useState } from 'react';
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

const getSafeUrl = (url: string, width = 600) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=${width}`;

// --- AI LOGIKA ---
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
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
      <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
    </div>
    <p className="mt-8 text-indigo-600 font-black text-[10px] uppercase tracking-[0.4em] animate-pulse text-center">Designuji tvůj look...</p>
    <p className="mt-2 text-slate-400 text-[9px] uppercase tracking-widest text-center">Trvá to cca 15 sekund</p>
  </div>
);

const ShareButtons = ({ imageUrl }: { imageUrl: string }) => {
  const handleShare = async () => {
    if (!navigator.share) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const imageFile = new File([blob], 'yako-king-fit.png', { type: 'image/png' });
      const shareData = {
        title: 'Yako King | Můj nový look',
        text: `Koukni na můj outfit z virtuální kabinky Yako King! Vyzkoušej si ho taky tady: ${window.location.href}`,
        files: [imageFile],
      };
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.share({ title: shareData.title, text: shareData.text, url: window.location.href });
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full mt-8">
      <div className="flex gap-3 w-full max-w-sm">
        {navigator.share && (
          <button onClick={handleShare} className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
            Sdílet outfit
          </button>
        )}
        <a href={imageUrl} download="yako-king-fit.png" className="flex-1 py-4 bg-white text-gray-500 font-bold rounded-2xl text-[10px] uppercase tracking-widest border border-gray-100 text-center hover:bg-gray-50 flex items-center justify-center">
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
      if (!apiKey) throw new Error("Chybí API klíč.");

      const ai = new GoogleGenAI({ apiKey });
      const [uPart, iPart] = await Promise.all([fileToPart(userFile), urlToPart(selected.imageUrl)]);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: "FASHION VIRTUAL TRY-ON: Take the exact clothing from Image 2 and put it on the person in Image 1. Keep the person's face, hair, and background identical to Image 1. Photorealistic, high quality." },
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
        throw new Error("Nepodařilo se vygenerovat náhled. Zkuste prosím jinou fotku postavy.");
      }
    } catch (err: any) {
      setError(err.message || "Došlo k neočekávané chybě.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-12 flex flex-col items-center">
      <header className="mb-10 text-center animate-fade-in">
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-2">Yako King Handmade</p>
        <h1 className="text-4xl md:text-7xl font-black text-indigo-600 italic tracking-tighter leading-none">Virtuální kabinka</h1>
        <div className="h-1 w-12 bg-indigo-200 mx-auto mt-6 rounded-full opacity-30"></div>
      </header>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEVÝ PANEL */}
        <div className="lg:col-span-4 glass p-6 md:p-8 rounded-[2.5rem] shadow-2xl space-y-8 animate-fade-in">
          <section>
            <h3 className="text-[10px] font-black uppercase text-indigo-900/40 mb-4 tracking-widest">01. Tvoje postava</h3>
            <div className="relative group h-24 border-2 border-dashed border-indigo-100 rounded-2xl flex items-center justify-center overflow-hidden transition-all hover:border-indigo-400 hover:bg-indigo-50/30">
              <input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              {userImg ? (
                <div className="flex items-center gap-4 px-4">
                  <img src={userImg} className="w-12 h-12 object-cover rounded-xl shadow-lg ring-2 ring-white" alt="User" />
                  <span className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest">Fotka nahrána</span>
                </div>
              ) : (
                <p className="text-indigo-400 font-black text-[10px] uppercase tracking-widest">Nahraj svou fotku</p>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-black uppercase text-indigo-900/40 mb-4 tracking-widest">02. Výběr oblečení</h3>
            <div className="grid grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-2 clothing-scroll">
              {CLOTHING_ITEMS.map(item => (
                <button 
                  key={item.name} 
                  onClick={() => { setSelected(item); setResult(null); setError(null); }}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${selected?.name === item.name ? 'border-indigo-600 scale-95 ring-4 ring-indigo-50 shadow-lg' : 'border-transparent bg-white opacity-60 hover:opacity-100'}`}
                >
                  <img src={getSafeUrl(item.imageUrl, 200)} className="w-full h-full object-cover" alt={item.name} />
                </button>
              ))}
            </div>
          </section>

          <button 
            onClick={generate} 
            disabled={loading || !userFile || !selected}
            className="w-full py-5 btn-grad text-white font-black rounded-2xl shadow-xl disabled:opacity-20 uppercase tracking-[0.4em] text-[11px]"
          >
            {loading ? 'Sestavuji tvůj look...' : 'Vyzkoušet na sobě'}
          </button>
        </div>

        {/* PRAVÝ PANEL */}
        <div className="lg:col-span-8 glass rounded-[3rem] p-4 flex flex-col items-center justify-center min-h-[500px] lg:min-h-[750px] shadow-2xl relative overflow-hidden animate-fade-in">
          {loading ? (
            <Loader />
          ) : result ? (
            <div className="w-full h-full flex flex-col items-center p-4 animate-fade-in">
              <img src={result} className="max-h-[650px] rounded-[2.5rem] shadow-2xl mb-2 object-contain bg-white ring-1 ring-black/5" alt="Výsledek" />
              <ShareButtons imageUrl={result} />
              <button onClick={() => setResult(null)} className="mt-8 text-[9px] font-black text-indigo-300 uppercase tracking-widest hover:text-indigo-600 transition-colors">Zkusit jinou kombinaci</button>
            </div>
          ) : selected ? (
            <div className="text-center group animate-fade-in">
              <img src={getSafeUrl(selected.imageUrl, 800)} className="max-h-[500px] rounded-[3rem] shadow-2xl bg-white mb-8 group-hover:scale-[1.02] transition-transform duration-500" alt="Produkt" />
              <h4 className="text-gray-900 font-black uppercase text-[14px] tracking-widest mb-2">{selected.name}</h4>
              <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em] opacity-40">Klikni na "Vyzkoušet na sobě"</p>
            </div>
          ) : (
            <div className="text-center opacity-10 select-none p-12">
               <div className="w-24 h-24 mx-auto border-2 border-indigo-200 rounded-full flex items-center justify-center mb-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                  </svg>
               </div>
               <p className="text-indigo-900 font-black uppercase tracking-[0.8em] text-[12px] italic">Studio Yako King</p>
            </div>
          )}
          
          {error && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/95 px-8 py-4 rounded-3xl shadow-2xl border border-red-100 animate-fade-in">
                <p className="text-red-500 font-bold text-[10px] uppercase tracking-widest">{error}</p>
            </div>
          )}
        </div>
      </div>
      
      <footer className="mt-20 py-10 opacity-20 text-center w-full">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-500">&copy; {new Date().getFullYear()} Yako King Handmade &bull; Designed by Patrik</p>
      </footer>
    </div>
  );
};

// --- RENDER ---
const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}