
import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- KONSTRANTY PRODUKTŮ ---
const CLOTHING_ITEMS = [
  { name: 'Béžová mikina s kapucí', imageUrl: 'https://yakoking.cz/images_upd/products/7/w61mxk9y4zjf.webp' },
  { name: 'Černá mikina s kapucí', imageUrl: 'https://yakoking.cz/images_upd/products/5/pvxjwz8c4yq2.jpg' },
  { name: 'Béžová mikina černý střík', imageUrl: 'https://yakoking.cz/images_upd/products/6/jqh37e2wbt6i.jpg' },
  { name: 'Khaki mikina s kapucí', imageUrl: 'https://yakoking.cz/images_upd/products/1/1tvwsi0j89pn.jpg' },
  { name: 'Modrá mikina s kapucí', imageUrl: 'https://yakoking.cz/images_upd/products/8/o05k6hlq2ret.jpg' },
  { name: 'Mikinové šaty černé', imageUrl: 'https://yakoking.cz/images_upd/products/9/lyemx76ksg1j.jpg' },
  { name: 'Dámská mikina bez kapuce', imageUrl: 'https://yakoking.cz/images_upd/products/3/eyqchobf7knw.jpg' },
  { name: 'Dámské triko bavlna', imageUrl: 'https://yakoking.cz/images_upd/products/7/kha02lvm6t1p.jpg' },
  { name: 'Crop Top Jaro', imageUrl: 'https://yakoking.cz/images_upd/products/3/9l3n27tgeyq4.jpg' },
  { name: 'Crop Top Léto', imageUrl: 'https://yakoking.cz/images_upd/products/9/5m831gfkjary.jpg' },
  { name: 'Khaki mikina trhaná', imageUrl: 'https://yakoking.cz/images_upd/products/3/ghrcsab8jf9l.jpg' },
  { name: 'Černá mikina trhaná', imageUrl: 'https://yakoking.cz/images_upd/products/1/vlstbeif261m.jpg' },
  { name: 'Červená mikina trhaná', imageUrl: 'https://yakoking.cz/images_upd/products/5/yi6rfa417oqv.jpg' },
  { name: 'Šedá mikina trhaná', imageUrl: 'https://yakoking.cz/images_upd/products/4/4y1ipxet8kcb.jpg' },
  { name: 'Šafránová mikina trhaná', imageUrl: 'https://yakoking.cz/images_upd/products/2/37t81crbueo4.jpg' },
  { name: 'Pánské triko bavlna', imageUrl: 'https://yakoking.cz/images_upd/products/3/8eta512klsp4.jpg' },
];

const getSafeUrl = (url) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=400`;

// --- POMOCNÉ FUNKCE ---
const fileToPart = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve({ inlineData: { data: result.split(',')[1], mimeType: file.type } });
      }
    };
    reader.readAsDataURL(file);
  });
};

const urlToPart = async (url) => {
  const res = await fetch(`https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=800&output=jpg`);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve({ inlineData: { data: result.split(',')[1], mimeType: 'image/jpeg' } });
      }
    };
    reader.readAsDataURL(blob);
  });
};

// --- HLAVNÍ KOMPONENTA ---
const App = () => {
  const [userImg, setUserImg] = useState(null);
  const [userFile, setUserFile] = useState(null);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = (e) => {
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const [uPart, iPart] = await Promise.all([fileToPart(userFile), urlToPart(selected.imageUrl)]);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: "Image 1 is a person. Image 2 is a clothing item from Yako King. Output a single photorealistic image of the person from Image 1 wearing the exact clothing item from Image 2. Maintain the person's face, pose, and background." },
            uPart, iPart
          ]
        },
        config: { imageConfig: { aspectRatio: "3:4" } }
      });

      const candidate = response.candidates?.[0];
      const imgPart = candidate?.content?.parts?.find(p => p.inlineData);
      
      if (imgPart?.inlineData?.data) {
        setResult(`data:image/png;base64,${imgPart.inlineData.data}`);
      } else {
        throw new Error("Model nevrátil platná obrazová data.");
      }
    } catch (err) {
      // DŮLEŽITÉ: Převod chyby na string pro zamezení Error #31
      console.error(err);
      setError(err instanceof Error ? err.message : "Nepodařilo se vytvořit náhled. Zkuste jinou fotku.");
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
        {/* OVLÁDACÍ PANEL */}
        <div className="lg:col-span-4 glass p-6 md:p-8 rounded-[2.5rem] shadow-2xl space-y-8 animate-fade-in" style={{animationDelay: '0.1s'}}>
          <section>
            <h3 className="text-[10px] font-black uppercase text-indigo-900/40 mb-4 tracking-widest">01. Tvoje postava</h3>
            <div className="relative group h-24 border-2 border-dashed border-indigo-100 rounded-2xl flex items-center justify-center overflow-hidden transition-all hover:border-indigo-400 hover:bg-indigo-50/30">
              <input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              {userImg ? (
                <div className="flex items-center gap-4 px-4">
                  <img src={userImg} className="w-12 h-12 object-cover rounded-xl shadow-lg ring-2 ring-white" alt="User" />
                  <span className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest">Fotka připravena</span>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-indigo-400 font-black text-[10px] uppercase tracking-widest">Nahraj svou fotku</p>
                </div>
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

        {/* VÝSLEDKOVÝ PANEL */}
        <div className="lg:col-span-8 glass rounded-[3rem] p-4 flex flex-col items-center justify-center min-h-[600px] shadow-2xl relative overflow-hidden animate-fade-in" style={{animationDelay: '0.2s'}}>
          {loading ? (
            <div className="text-center p-12">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent animate-spin rounded-full mx-auto mb-6"></div>
              <p className="text-indigo-600 font-black text-[11px] uppercase tracking-[0.5em] animate-pulse">Designuji tvůj outfit...</p>
            </div>
          ) : result ? (
            <div className="w-full h-full flex flex-col items-center p-4">
              <img src={result} className="max-h-[700px] rounded-[2rem] shadow-2xl mb-8 object-contain bg-white" alt="Výsledek" />
              <div className="flex gap-4">
                <a href={result} download="yako-king-fit.png" className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-colors">Uložit náhled</a>
                <button onClick={() => setResult(null)} className="px-10 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl text-[10px] uppercase tracking-widest hover:bg-gray-200">Zkusit jiný</button>
              </div>
            </div>
          ) : selected ? (
            <div className="text-center opacity-40 group">
              <img src={getSafeUrl(selected.imageUrl)} className="max-h-[500px] rounded-[2.5rem] mb-6 grayscale group-hover:grayscale-0 transition-all duration-700" alt="Produkt" />
              <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em]">Klikni na "Vyzkoušet na sobě"</p>
            </div>
          ) : (
            <div className="text-center opacity-10 select-none">
                <div className="w-32 h-32 border-2 border-indigo-200 rounded-full flex items-center justify-center mx-auto mb-8">
                    <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4v16m8-8H4"></path></svg>
                </div>
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

      <footer className="mt-20 opacity-20 text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.5em]">&copy; {new Date().getFullYear()} Yako King Handmade Studio</p>
      </footer>
    </div>
  );
};

// Start aplikace
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
