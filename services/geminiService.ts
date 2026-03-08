
import { GoogleGenAI } from "@google/genai";

// Initialize the GoogleGenAI client using the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateOracleMessage = async (score: number, coins: number): Promise<string> => {
  try {
    // Using systemInstruction for persona and instructions, and contents for dynamic data.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The thief is at ${score} meters with ${coins} coins.`,
      config: {
        systemInstruction: `You are the Ancient Oracle of the Sun Temple. A thief is running for their life after stealing the Golden Idol. 
        Provide a very short (max 15 words) mysterious warning, curse, or bit of wisdom in an ominous tone. 
        Examples: "The shadows grow long, mortal.", "The idol's heat will consume your soul.", "Speed is but an illusion in this labyrinth."`,
        temperature: 1.0,
        topP: 0.95,
      }
    });

    // Directly access the .text property as per guidelines.
    return response.text?.trim() || "The temple never forgets...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Darkness approaches...";
  }
};