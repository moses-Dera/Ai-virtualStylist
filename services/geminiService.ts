import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Product, UserProfile } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Converts an image URL to a base64 encoded string.
 */
const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]); // remove the "data:..." part
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`Failed to convert URL to base64: ${url}`, error);
    throw error;
  }
};


export const getFashionAdvice = async (
  prompt: string,
  userProfile: UserProfile,
  products: Product[]
): Promise<string> => {
  const productList = products.map(p => `- ${p.name} (ID: ${p.id}, Category: ${p.category}, Style: ${p.styleKeywords.join(', ')})`).join('\n');
  
  const systemInstruction = `You are a world-class fashion stylist. Your goal is to help the user find the perfect outfit.
The user's measurements are: Height ${userProfile.height}cm, Weight ${userProfile.weight}kg, Chest ${userProfile.chest}cm, Waist ${userProfile.waist}cm, Hips ${userProfile.hips}cm.
The available clothing items are:
${productList}

Based on the user's request, recommend specific items from the list by name and provide styling advice. Be friendly, concise, and helpful. If you recommend an item, mention its name exactly as provided.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error getting fashion advice:", error);
    return "I'm sorry, I'm having trouble coming up with a recommendation right now. Please try again later.";
  }
};

export const getFitAnalysis = async (
  product: Product,
  userProfile: UserProfile
): Promise<{ size: string; analysis: string }> => {
  const prompt = `Analyze the fit for a user with these measurements:
- Height: ${userProfile.height} cm
- Weight: ${userProfile.weight} kg
- Chest: ${userProfile.chest} cm
- Waist: ${userProfile.waist} cm
- Hips: ${userProfile.hips} cm

The clothing item is:
- Name: ${product.name}
- Category: ${product.category}
- Style Keywords: ${product.styleKeywords.join(', ')}

Based on general sizing standards and the item's style, recommend a size (e.g., S, M, L, XL) and provide a brief, 1-2 sentence fit analysis. For example, "This will be a slim fit on the chest" or "The length should be perfect for your height."`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            size: {
              type: Type.STRING,
              description: 'The recommended clothing size (e.g., S, M, L, XL).'
            },
            analysis: {
              type: Type.STRING,
              description: 'A brief, 1-2 sentence analysis of how the item will fit.'
            }
          },
          required: ['size', 'analysis']
        }
      }
    });
    
    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);
    return result;
  } catch (error) {
    console.error("Error getting fit analysis:", error);
    return {
      size: "N/A",
      analysis: "Could not determine fit. Please refer to a standard size chart."
    };
  }
};


export const generateTryOnImage = async (
  baseUserImage: string, // must be base64 string
  clothingProduct: Product,
): Promise<string> => {
  try {
    const clothingImageBase64 = await urlToBase64(clothingProduct.imageUrl);

    const prompt = `Take the person in the first image and realistically dress them in the clothing item from the second image ('${clothingProduct.name}'). The clothing is a ${clothingProduct.category}. Ensure the fit looks natural and respects the person's body shape and pose. The background should be the same as the first image. The output should only be the final image of the person wearing the clothes.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: baseUserImage,
            },
          },
          {
            inlineData: {
                mimeType: 'image/jpeg',
                data: clothingImageBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error('No image was generated by the model.');

  } catch (error) {
    console.error("Error generating try-on image:", error);
    throw new Error("The AI stylist couldn't create the look. The item might not be suitable for this photo.");
  }
};
