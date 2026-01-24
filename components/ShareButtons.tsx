
import React from 'react';

interface ShareButtonsProps {
  imageUrl: string;
}

const ShareButtons: React.FC<ShareButtonsProps> = ({ imageUrl }) => {
  const dataUrlToFile = async (dataUrl: string, fileName: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], fileName, { type: blob.type });
  };

  const getValidAppUrl = () => {
    try {
      const currentUrl = window.location.href;
      // Kontrola, zda je URL validní a začíná http (navigator.share vyžaduje absolutní URL)
      if (currentUrl && currentUrl.startsWith('http')) {
        return currentUrl;
      }
    } catch (e) {
      // Ignorovat chybu přístupu k location
    }
    return 'https://yakoking.cz'; // Bezpečný fallback
  };

  const handleShare = async () => {
    if (!navigator.share) return;
    
    try {
      const imageFile = await dataUrlToFile(imageUrl, 'yako-king-look.png');
      const appUrl = getValidAppUrl();
      const shareTitle = 'Yako King | Můj nový look';
      const shareText = `Mrkni, jak mi sluší kousky od Yako King! Vyzkoušej si je i ty v naší virtuální kabince zde: ${appUrl}`;

      const shareData: ShareData = {
        title: shareTitle,
        text: shareText,
        url: appUrl,
        files: [imageFile],
      };

      // Pokus o sdílení všeho najednou
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: Pokud nelze sdílet soubory i link najednou, zkusíme jen soubor s textem (link je v textu)
        const simpleShareData: ShareData = {
          title: shareTitle,
          text: shareText,
          files: [imageFile]
        };
        
        if (navigator.canShare && navigator.canShare(simpleShareData)) {
           await navigator.share(simpleShareData);
        } else {
           // Poslední záchrana: Jen text a link bez souboru
           await navigator.share({
             title: shareTitle,
             text: shareText,
             url: appUrl
           });
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Chyba při sdílení:', error);
        // V případě totálního selhání (např. v nekompatibilním iframe) zkusíme jen text
        try {
          await navigator.share({
            title: 'Yako King',
            text: 'Mrkni na mou virtuální kabinku u Yako King!',
            url: 'https://yakoking.cz'
          });
        } catch (e) {
          // Pokud selže i toto, uživatel má pravděpodobně starý prohlížeč nebo zakázané API
        }
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full">
      <div className="flex items-center justify-center gap-3 w-full">
        {navigator.share && (
          <button
            onClick={handleShare}
            className="flex-1 px-6 py-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Sdílet outfit
          </button>
        )}
        <a
          href={imageUrl}
          download="yako-king-fit.png"
          className="flex-1 px-6 py-4 bg-gray-100 text-gray-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-gray-200 text-center hover:bg-gray-200 transition-all"
        >
          Uložit
        </a>
      </div>
      {!navigator.share && (
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
          Obrázek si můžeš uložit do galerie
        </p>
      )}
    </div>
  );
};

export default ShareButtons;
