
import { GoogleGenAI } from "@google/genai";
import { Subject } from "../types";

export interface MasteryLevelGuidance {
  level: number;
  guidance: string; // De uitleg voor het ECHTE doel
  example: string;  // Het voorbeeld van het ANDERE doel
}

export interface MasteryGuidanceResponse {
  referenceGoal: string; // De naam van het doel dat als voorbeeld wordt gebruikt
  levels: MasteryLevelGuidance[];
}

const getLocalFeedback = (draft: string): string => {
  const text = draft.toLowerCase();
  const hasExample = text.includes('bijvoorbeeld') || text.includes('zoals') || text.includes('bijv') || text.includes('voorbeeld');
  const hasEvidence = text.includes('ik kan') || text.includes('ik weet') || text.includes('snap') || text.includes('begrijp') || text.includes('bewijs');
  const isShort = draft.length < 40;

  if (isShort) {
    return "Je bent goed op weg! Probeer eens wat meer te vertellen over wat je precies hebt gedaan tijdens de les.";
  }
  if (!hasExample && !hasEvidence) {
    return "Goed geschreven! Kun je ook een voorbeeld geven van wat je hebt geleerd? En hoe laat je zien dat je het doel hebt behaald?";
  }
  return "Wauw, wat een complete reflectie! Je geeft goede voorbeelden en laat echt zien wat je hebt geleerd. Super gedaan!";
};

/**
 * Genereert uitleg voor het huidige doel, maar illustreert de niveaus met voorbeelden van een ANDER doel.
 * Dit voorkomt dat kinderen de tekst letterlijk overnemen.
 */
export const getMasteryGuidance = async (
  goalTitle: string,
  goalDescription: string
): Promise<MasteryGuidanceResponse> => {
  const defaultResponse: MasteryGuidanceResponse = {
    referenceGoal: "Een band plakken",
    levels: [
      { level: 1, guidance: "Ik vind dit doel nog erg lastig.", example: "Ik schrijf alleen op dat ik hulp nodig had van de meester." },
      { level: 2, guidance: "Ik begrijp kleine stukjes.", example: "Ik vertel één ding dat ik nu weet, zoals hoe de lijm heet, maar de rest weet ik niet meer." },
      { level: 3, guidance: "Ik kan dit doel meestal zelfstandig.", example: "Ik leg uit hoe ik de band heb geplakt. Ik noem de stappen die ik heb gedaan en vertel dat de band nu weer hard is." },
      { level: 4, guidance: "Ik kan dit zelfs aan een ander uitleggen!", example: "Ik gebruik de goede woorden zoals 'ventiel' en 'solutie'. Ik leg precies uit waarom je moet wachten tot de lijm droog is en hoe ik dit aan een ander zou leren." }
    ]
  };

  if (typeof navigator !== 'undefined' && !navigator.onLine) return defaultResponse;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const prompt = `
    HET ECHTE DOEL: "${goalTitle}: ${goalDescription}"
    
    TAAK:
    1. Bedenk een totaal ANDER lesdoel of een vaardigheid (bijv. "Leren zwemmen", "De Romeinen", "Een taart bakken"). Dit noemen we het REFERENTIEDOEL.
    2. Voor de 4 beheersingsniveaus schrijf je:
       - Een korte uitleg ('Ik-kan'-zin) die past bij HET ECHTE DOEL.
       - Een voorbeeld-reflectie die past bij HET REFERENTIEDOEL.
    
    WAAROM? Kinderen mogen de tekst niet kunnen overtypen. Ze moeten de 'kwaliteit' van het voorbeeld zien op een ander onderwerp.
    
    ANTWOORD IN DIT JSON FORMAT:
    {
      "referenceGoal": "Naam van het referentiedoel",
      "levels": [
        {"level": 1, "guidance": "Uitleg voor ECHTE doel", "example": "Voorbeeld voor REFERENTIEDOEL"},
        ... (voor 4 niveaus)
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const parsed = JSON.parse(response.text || '{}');
    return parsed.referenceGoal ? parsed : defaultResponse;
  } catch (error) {
    return defaultResponse;
  }
};

export const getAIFeedback = async (
  subject: Subject,
  goalTitle: string,
  goalDescription: string,
  currentDraft: string
): Promise<string> => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return getLocalFeedback(currentDraft);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const prompt = `
    Je bent 'Reflectie-Ranger'. Help een kind (8-12j) hun reflectie op "${goalTitle}" te verbeteren.
    Huidige tekst: "${currentDraft}"
    Geef korte (max 3 zinnen), positieve feedback in het Nederlands. Focus op het toevoegen van voorbeelden en bewijs.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || getLocalFeedback(currentDraft);
  } catch (error) {
    return getLocalFeedback(currentDraft);
  }
};
