
import { GoogleGenAI, Type } from "@google/genai";
import { DiscoveryResponse, ApiCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const discoverNewApis = async (category: string = 'General'): Promise<DiscoveryResponse> => {
  try {
    const prompt = `Discover 10 legitimate, active public APIs for the category: "${category}". 
    Focus on well-documented and useful APIs for developers.
    For each API, provide:
    - name: The official name
    - website: The direct URL to their documentation or homepage
    - description: A short, 1-sentence explanation of what it does
    - category: Choose the best fit from: [${Object.values(ApiCategory).join(', ')}]
    - auth_required: boolean (true if an API key/OAuth is needed, false if public/open)
    - source: "Google Search"
    
    Ensure the response is a strict JSON object with an "apis" array.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            apis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  website: { type: Type.STRING },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING },
                  auth_required: { type: Type.BOOLEAN },
                  source: { type: Type.STRING }
                },
                required: ["name", "website", "description", "category", "auth_required", "source"]
              }
            }
          }
        }
      },
    });

    const jsonStr = response.text.trim();
    const data = JSON.parse(jsonStr);
    
    // Extract sources from grounding metadata if available
    const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || 'External Source',
      uri: chunk.web?.uri || ''
    })) || [];

    return {
      apis: data.apis,
      sources: groundingSources
    };
  } catch (error) {
    console.error("Discovery error:", error);
    throw error;
  }
};

export const summarizeApi = async (name: string, description: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a concise, 2-sentence developer-focused summary of the following API. 
      Name: ${name}
      Description: ${description}
      Focus on the unique value proposition and primary use case.`,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Summarization error:", error);
    return description;
  }
};
