import { GoogleGenAI } from "@google/genai";

export async function simulateCodeExecution(code: string, language: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey ) {
    return `Simulation Error: Gemini API key is missing. For local development, please set GEMINI_API_KEY in your .env file. You can get a free key from https://aistudio.google.com/app/apikey`;
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Simulate the execution of the following ${language} code. Provide ONLY the output that would be printed to the console/terminal. If there are errors, provide the error message. Do not include any explanations or markdown formatting, just the raw output.

Code:
${code}`,
    });

    return response.text || "No output generated.";
  } catch (error: any) {
    console.error("Gemini Simulation Error:", error);
    if (error.message?.includes("API key not valid")) {
      return "Simulation Error: Invalid Gemini API key. Please check your .env file.";
    }
    return `Simulation Error: ${error.message}`;
  }
}
