
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

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

const getSafeUrl = (url: string) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=800`;

const fileToPart = async (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve({ inlineData: { data: result.split(',')[1], mimeType: file.type } });
    };
    reader.readAsDataURL(file);
  });
};

const urlToPart = async (url: string) => {
  const res = await fetch(`https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=1000&output=jpg`);
  const blob = await res.blob();
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve({ inlineData: { data: result.split(',')[1], mimeType: 'image/jpeg' } });
    };
    reader.readAsDataURL(blob);
  });
};

const Loader = () => (
  <div className="flex flex-col items-center justify-center">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
      <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
    </div>
  </div>
);

// Samostatná komponenta pro sdílení integrovaná pro stabilitu
const ShareButtons = ({ imageUrl }: { imageUrl: string }) => {
  const handleShare = async () => {
    if (!navigator.share) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const imageFile = new File([blob], 'yako-king-look.png', { type: 'image/png' });
      
      let appUrl = 'https://yakoking.cz';
      try {
        const currentUrl = window.location.href;
        if (currentUrl && currentUrl.startsWith('http')) {
          appUrl = currentUrl;
        }
      } catch (e) {}

      const shareTitle = 'Yako King | Můj nový look';
      const shareText = `Mrkni, jak mi sluší kousky od Yako King! Vyzkoušej si je i ty v naší virtuální kabince zde: ${appUrl}`;
      
      const shareData: ShareData = {
        title: shareTitle,
        text: shareText,
        url: appUrl,
        files: [imageFile],
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback bez URL v parametru (je v textu)
        await navigator.share({
          title: shareTitle,
          text: shareText,
          files: [imageFile]
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') console.error(error);
    }
  };

  return (
    <div className="flex gap-4 w-full max-w-sm mt-6">
      {navigator.share && (
        <button onClick={handleShare} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Sdílet
        </button>
      )}
      <a href={imageUrl} download="yako-king-fit.png" className="flex-1 py-4 bg-white text-gray-500 font-bold rounded-2xl text-[10px] uppercase tracking-widest border border-gray-100 text-center hover:bg-gray-50">Uložit</a>
    </div>
  );
};

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
      if (!apiKey) throw new Error("API klíč nebyl nalezen.");

      const ai = new GoogleGenAI({ apiKey });
      const [uPart, iPart] = await Promise.all([fileToPart(userFile), urlToPart(selected.imageUrl)]);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: "Output a single photorealistic image of the person from Image 1 wearing the clothing from Image 2. Keep the person's face, hair, body shape, and background exactly the same as in Image 1. Fit the clothes perfectly." },
            uPart, 
            iPart
          ]
        },
        config: { imageConfig: { aspectRatio: "3:4" } }
      });

      const candidate = response.candidates?.[0];
      if (!candidate) throw new Error("Žádná odpověď od AI.");

      let base64Data = "";
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          base64Data = part.inlineData.data;
          break;
        }
      }
      
      if (base64Data) {
        setResult(`data:image/png;base64,${base64Data}`);
      } else {
        throw new Error("Model nevrátil data obrázku. Zkuste jinou fotku.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-12 flex flex-col items-center">
      <header className="mb-12 text-center animate-fade-in">
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-3">Yako King Handmade</p>
        <h1 className="text-4xl md:text-7xl font-black text-indigo-600 italic tracking-tighter leading-none">Virtuální kabinka</h1>
        <div className="h-1 w-12 bg-indigo-200 mx-auto mt-6 rounded-full"></div>
      </header>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
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
            <div className="grid grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-2 clothing-scroll">
              {CLOTHING_ITEMS.map(item => (
                <button 
                  key={item.name} 
                  onClick={() => { setSelected(item); setResult(null); setError(null); }}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${selected?.name === item.name ? 'border-indigo-600 scale-95 ring-4 ring-indigo-50 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={getSafeUrl(item.imageUrl)} className="w-full h-full object-cover" alt={item.name} />
                </button>
              ))}
            </div>
          </section>

          <button 
            onClick={generate} 
            disabled={loading || !userFile || !selected}
            className="w-full py-5 btn-grad text-white font-black rounded-2xl shadow-xl disabled:opacity-20 uppercase tracking-[0.3em] text-[11px]"
          >
            {loading ? 'Sestavuji tvůj look...' : 'Vyzkoušet na sobě'}
          </button>
        </div>

        <div className="lg:col-span-8 glass rounded-[3rem] p-4 flex flex-col items-center justify-center min-h-[600px] shadow-2xl relative overflow-hidden animate-fade-in">
          {loading ? (
            <div className="text-center p-12">
              <Loader />
              <p className="mt-6 text-indigo-600 font-black text-[11px] uppercase tracking-[0.5em] animate-pulse">Designuji tvůj outfit...</p>
            </div>
          ) : result ? (
            <div className="w-full h-full flex flex-col items-center p-4">
              <img src={result} className="max-h-[700px] rounded-[2rem] shadow-2xl mb-2 object-contain bg-white" alt="Výsledek" />
              <ShareButtons imageUrl={result} />
              <button onClick={() => setResult(null)} className="mt-4 text-[9px] font-black text-indigo-300 uppercase tracking-widest hover:text-indigo-600 transition-colors">Zkusit jinou kombinaci</button>
            </div>
          ) : selected ? (
            <div className="text-center opacity-40 group">
              <img src={getSafeUrl(selected.imageUrl)} className="max-h-[500px] rounded-[2.5rem] mb-6 grayscale group-hover:grayscale-0 transition-all duration-700" alt="Produkt" />
              <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em]">Klikni na "Vyzkoušet na sobě"</p>
            </div>
          ) : (
            <div className="text-center opacity-10 select-none">
              <p className="text-indigo-900 font-black uppercase tracking-[0.8em] text-[12px] italic">Studio Yako King</p>
            </div>
          )}
          
          {error && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/95 px-8 py-3 rounded-full shadow-2xl border border-red-100 animate-fade-in">
                <p className="text-red-500 font-bold text-[10px] uppercase tracking-widest">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
