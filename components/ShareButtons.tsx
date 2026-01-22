
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

  const handleShare = async () => {
    if (!navigator.share) return;
    try {
      const imageFile = await dataUrlToFile(imageUrl, 'yk-handmade-ai.png');
      if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        await navigator.share({
          title: 'Můj nový look od YK Handmade',
          text: 'Podívej, jak mi sluší YK Handmade! Vyzkoušej to taky ve virtuální kabince.',
          files: [imageFile],
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Chyba při sdílení:', error);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="flex items-center justify-center gap-3 w-full">
        {navigator.share && (
          <button
            onClick={handleShare}
            className="flex-1 px-6 py-4 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg hover:bg-gray-800 transition-all"
          >
            Sdílet
          </button>
        )}
        <a
          href={imageUrl}
          download="yk-fitting-room.png"
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
