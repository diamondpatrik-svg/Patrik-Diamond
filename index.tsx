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

const getSafeUrl = (url: string) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=800`;

// --- POMOCNÉ FUNKCE PRO AI ---
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
  const res = await fetch(`https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=1000&output=jpg`);
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
    <p className="mt-8 text-indigo-600 font-black text-[10px] uppercase tracking-[0.5em] animate-pulse text-center">
      Vytvářím tvůj nový styl...
    </p>
    <p className="mt-2 text-gray-400 text-[9px] uppercase tracking-widest text-center">Trvá to cca 10-15 sekund</p>
  </div>
);

const ShareButtons = ({ imageUrl }: { imageUrl: string }) => {
  const handleShare = async () => {
    if (!navigator.share) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const imageFile = new File([blob], 'yako-king-fit.png', { type: 'image/png' });
      
      let appUrl = 'https://yakoking.cz';
      try {
        const currentUrl = window.location.href;
        if (currentUrl && currentUrl.startsWith('http')) {
          appUrl = currentUrl;
        }
      } catch (e) {}

      const shareTitle = 'Yako King | Můj nový look';
      const shareText = `Mrkni, jak mi sluší kousky od Yako King! Vyzkoušej si je i ty v naší virtuální kabince zde: ${appUrl}`;
      
      const shareData: any = {
        title: shareTitle,
        text: shareText,
        url: appUrl,
        files: [imageFile],
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: appUrl
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') console.error('Chyba při sdílení:', error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mt-8 animate-fade-in">
      <div className="flex gap-3 w-full">
        {!!navigator.share && (
          <button onClick={handleShare} className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Sdílet outfit
          </button>
        )}
        <a href={imageUrl} download="yako-king-look.png" className="flex-1 py-4 bg-white text-gray-500 font-bold rounded-2xl text-[10px] uppercase tracking-widest border border-gray-100 text-center hover:bg-gray-50 flex items-center justify-center">
          Uložit
        </a>
      </div>
      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center px-4">
        Pošleš přátelům fotku i s odkazem na Yako King virtuální kabinku
      </p>
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
      if (!apiKey) throw new Error("API klíč nebyl nalezen. Zkontrolujte připojení k internetu.");

      const ai = new GoogleGenAI({ apiKey });
      const [uPart, iPart] = await Promise.all([fileToPart(userFile), urlToPart(selected.imageUrl)]);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: "Output a single photorealistic fashion photograph of the person from Image 1 wearing the exact clothing item from Image 2. The person's face, hair, body position, and background must remain identical to Image 1. The garment from Image 2 must be seamlessly fitted onto their body, respecting folds, lighting, and anatomy. High quality, clear, realistic." },
            uPart as any, 
            iPart as any
          ]
        },
        config: { imageConfig: { aspectRatio: "3:4" } }
      });

      const candidate = response.candidates?.[0];
      if (!candidate) throw new Error("AI momentálně neodpovídá. Zkuste to prosím znovu.");

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
        throw new Error("Nepodařilo se vygenerovat náhled. Zkuste jinou fotku (lépe osvětlenou).");
      }
    } catch (err: any) {
      console.error('Chyba AI:', err);
      setError(err instanceof Error ? err.message : "Došlo k chybě při komunikaci s AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-12 flex flex-col items-center max-w-7xl mx-auto">
      <header className="mb-12 text-center animate-fade-in">
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-3">Yako King Handmade</p>
        <h1 className="text-4xl md:text-7xl font-black text-indigo-600 italic tracking-tighter leading-none">Virtuální kabinka</h1>
        <div className="h-1 w-12 bg-indigo-200 mx-auto mt-6 rounded-full"></div>
      </header>

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEVÝ OVLÁDACÍ PANEL */}
        <div className="lg:col-span-4 glass p-6 md:p-8 rounded-[2.5rem] shadow-2xl space-y-8 animate-fade-in" style={{animationDelay: '0.1s'}}>
          <section>
            <h3 className="text-[10px] font-black uppercase text-indigo-900/40 mb-4 tracking-widest">01. Tvoje postava</h3>
            <div className="relative group h-28 border-2 border-dashed border-indigo-100 rounded-2xl flex items-center justify-center overflow-hidden transition-all hover:border-indigo-400 hover:bg-indigo-50/30 bg-white/50">
              <input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              {userImg ? (
                <div className="flex items-center gap-4 px-4 w-full">
                  <img src={userImg} className="w-16 h-16 object-cover rounded-xl shadow-lg ring-2 ring-white" alt="User" />
                  <div className="flex flex-col">
                    <span className="text-indigo-600 font-black text-[10px] uppercase tracking-widest">Fotka nahrána</span>
                    <span className="text-gray-400 text-[9px] uppercase font-bold">Změnit kliknutím</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-indigo-400 font-black text-[10px] uppercase tracking-widest">Nahraj svou fotku</p>
                </div>
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
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${selected?.name === item.name ? 'border-indigo-600 scale-95 ring-4 ring-indigo-50 shadow-lg' : 'border-transparent bg-white shadow-sm opacity-70 hover:opacity-100'}`}
                  title={item.name}
                >
                  <img src={getSafeUrl(item.imageUrl)} className="w-full h-full object-cover" alt={item.name} />
                </button>
              ))}
            </div>
          </section>

          <button 
            onClick={generate} 
            disabled={loading || !userFile || !selected}
            className="w-full py-5 btn-grad text-white font-black rounded-2xl shadow-xl disabled:opacity-20 uppercase tracking-[0.3em] text-[11px] mt-4"
          >
            {loading ? 'Designuji tvůj look...' : 'Vyzkoušet na sobě'}
          </button>
        </div>

        {/* PRAVÝ PANEL S VÝSLEDKEM */}
        <div className="lg:col-span-8 glass rounded-[3rem] p-4 flex flex-col items-center justify-center min-h-[600px] shadow-2xl relative overflow-hidden animate-fade-in" style={{animationDelay: '0.2s'}}>
          {loading ? (
            <Loader />
          ) : result ? (
            <div className="w-full h-full flex flex-col items-center p-4 animate-fade-in">
              <div className="relative group max-w-full">
                <img src={result} className="max-h-[700px] rounded-[2.5rem] shadow-2xl mb-2 object-contain bg-white ring-1 ring-black/5" alt="Výsledek" />
              </div>
              <ShareButtons imageUrl={result} />
              <button onClick={() => setResult(null)} className="mt-8 text-[9px] font-black text-indigo-300 uppercase tracking-[0.4em] hover:text-indigo-600 transition-colors">
                Zkusit jinou kombinaci
              </button>
            </div>
          ) : selected ? (
            <div className="text-center group animate-fade-in">
              <div className="relative mb-8 px-4">
                <img src={getSafeUrl(selected.imageUrl)} className="max-h-[500px] rounded-[3rem] shadow-2xl bg-white transform group-hover:scale-[1.02] transition-transform duration-700" alt="Produkt" />
              </div>
              <h4 className="text-gray-900 font-black uppercase text-[16px] tracking-widest mb-3">{selected.name}</h4>
              <div className="flex items-center justify-center gap-4 opacity-40">
                <div className="h-[1px] w-8 bg-indigo-600"></div>
                <p className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em] italic">Klikni na "Vyzkoušet na sobě"</p>
                <div className="h-[1px] w-8 bg-indigo-600"></div>
              </div>
            </div>
          ) : (
            <div className="text-center opacity-10 select-none p-20 animate-fade-in">
              <div className="w-32 h-32 mx-auto border-2 border-indigo-200 rounded-full flex items-center justify-center mb-10">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                 </svg>
              </div>
              <p className="text-indigo-900 font-black uppercase tracking-[1em] text-[14px] italic">Studio Yako King</p>
            </div>
          )}
          
          {error && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white px-8 py-4 rounded-3xl shadow-2xl border border-red-100 animate-fade-in flex items-center gap-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <p className="text-red-500 font-black text-[10px] uppercase tracking-widest">{error}</p>
            </div>
          )}
        </div>
      </div>
      
      <footer className="mt-20 py-10 opacity-25 text-center w-full">
        <p className="text-[9px] font-black uppercase tracking-[0.6em] text-gray-500">
          &copy; {new Date().getFullYear()} Yako King Handmade &bull; Designed with AI by Patrik
        </p>
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