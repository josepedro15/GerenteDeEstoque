import { google } from '@ai-sdk/google';

// Reliable model versions
export const GEMINI_2_5_PRO = 'gemini-2.5-pro';
export const GEMINI_3_0_FLASH = 'gemini-3.0-flash';
export const GEMINI_2_5_FLASH = 'gemini-2.5-flash';

// Fallback list
const MODEL_PRIORITY = [
    GEMINI_2_5_FLASH,
    GEMINI_2_5_PRO,
    GEMINI_3_0_FLASH
];

export function getGeminiModel(modelName: string = GEMINI_2_5_PRO) {
    // Return the model instance directly
    return google(modelName);
}

export const fallbackModels = MODEL_PRIORITY;
