
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
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API klíč není v aplikaci nastaven.");
    }

    const ai = new GoogleGenAI({ apiKey });

    const [userPart, itemPart] = await Promise.all([
      fileToGenerativePart(userImageFile),
      imageUrlToGenerativePart(clothingItem.imageUrl)
    ]);
    
    // Explicitnější prompt pro model 2.5-flash-image
    const prompt = `IMAGE EDITING TASK: You are a professional virtual fitting room. 
    1. Take the person from Image 1.
    2. Take the specific clothing item from Image 2.
    3. Generate a new image where the person from Image 1 is wearing the clothing from Image 2.
    Maintain the person's identity, pose, and background exactly. 
    The clothing should drape naturally over the person's body. 
    Photorealistic high-quality fashion result.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: {
        parts: [
          { text: "Image 1: Target person" },
          userPart, 
          { text: "Image 2: Clothing item to apply" },
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
    
    throw new Error("AI nevygenerovala žádný obrázek. Zkuste prosím jinou fotku postavy nebo jiný produkt.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('429')) {
        throw new Error("Limit požadavků vyčerpán. Zkuste to prosím za chvíli.");
    }
    if (error.message?.includes('403')) {
        throw new Error("Přístup zamítnut. Zkontrolujte, zda je váš API klíč správný a má povolen model Gemini 2.5 Flash Image.");
    }
    throw new Error(error.message || "Omlouváme se, náhled se nepodařilo vytvořit.");
  }
};
