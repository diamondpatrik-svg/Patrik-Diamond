
import { GoogleGenAI } from "@google/genai";
import { ClothingItem } from '../types';

const fileToGenerativePart = async (file: File) => {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return { inlineData: { data: base64, mimeType: file.type } };
};

const imageUrlToGenerativePart = async (url: string) => {
    // Použití proxy pro obejití CORS a zajištění, že model dostane data
    const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=1000&output=jpg`;
    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(blob);
        });
        return { inlineData: { data: base64, mimeType: blob.type || 'image/jpeg' } };
    } catch (e) {
        throw new Error(`Nepodařilo se načíst produkt pro AI. Zkuste to prosím znovu.`);
    }
};

export const generateVirtualTryOnImage = async (
  userImageFile: File,
  clothingItem: ClothingItem
): Promise<string> => {
  try {
    // Fix: Initialize GoogleGenAI directly with process.env.API_KEY as per the coding guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const [userPart, itemPart] = await Promise.all([
      fileToGenerativePart(userImageFile),
      imageUrlToGenerativePart(clothingItem.imageUrl)
    ]);
    
    const prompt = `FASHION VIRTUAL TRY-ON:
    - Target: Put the clothing item from Image 2 on the person in Image 1.
    - Consistency: Keep the person's face, hair, body shape, and background exactly as in Image 1.
    - Realism: Ensure the garment from Image 2 fits the person's pose and lighting naturally.
    - Output: High-quality, photorealistic fashion photography style.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: {
        parts: [
          { text: "Image 1 (Person):" },
          userPart, 
          { text: "Image 2 (Clothing):" },
          itemPart, 
          { text: prompt }
        ],
      },
      config: {
        imageConfig: { 
          aspectRatio: "3:4"
        }
      }
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      const imagePart = candidate.content.parts.find(p => p.inlineData);
      if (imagePart?.inlineData?.data) {
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      }
    }
    
    throw new Error("Model nevrátil obrázek. Zkuste jinou kombinaci fotek.");
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes('403')) {
        throw new Error("Chyba 403: Ujistěte se, že máte v Google Cloud Console povolený 'Generative Language API' pro váš projekt.");
    }
    if (error.message?.includes('429')) {
        throw new Error("Limit bezplatných požadavků byl vyčerpán. Zkuste to za minutu.");
    }
    throw new Error(error.message || "Náhled se nepodařilo vytvořit.");
  }
};
