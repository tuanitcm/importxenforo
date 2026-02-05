import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateTagLine = async (title: string, description: string): Promise<string> => {
  if (!apiKey) return description.substring(0, 99); // Fallback if no API key

  try {
    const prompt = `
      You are an expert copywriter for a software forum. 
      Create a catchy, short "Tag Line" (max 90 characters) for a resource based on this info:
      Title: ${title}
      Description: ${description}
      
      Return ONLY the tagline string. No quotes.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return description.substring(0, 99); // Fallback
  }
};

export const enhanceDescription = async (rawDescription: string): Promise<string> => {
    if (!apiKey) return rawDescription;
    
    try {
        const prompt = `
          Format and improve the following resource description for a XenForo forum using BBCode or Markdown.
          Make it sound professional and exciting. Keep the core information intact.
          
          Raw Description:
          ${rawDescription}
        `;
    
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
    
        return response.text.trim();
      } catch (error) {
        return rawDescription;
      }
};