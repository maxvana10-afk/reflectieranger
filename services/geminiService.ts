
import { GoogleGenAI, Type } from "@google/genai";
import { Subject } from "../types";

export interface MasteryLevelGuidance {
  level: number;
  guidance: string; 
  example: string;  
}

export interface MasteryGuidanceResponse {
  referenceGoal: string; 
  levels: MasteryLevelGuidance[];
}

/**
 * Uitgebreide offline feedback logica (De "Offline Ranger").
 * Geeft specifieke tips op basis van tekstlengte, structuur en trefwoorden.
 */
const getLocalFeedback = (draft: string, subject: Subject): string => {
  const text = draft.trim().toLowerCase();
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  const checks = {
    explanation: ['omdat', 'want', 'daarom', 'reden', 'waardoor', 'gevolg'],
    process: ['eerst', 'toen', 'daarna', 'stap', 'begon', 'eindigde'],
    content: ['geleerd', 'begrijp', 'snap', 'moeilijk', 'makkelijk', 'vond', 'ontdekt'],
    evidence: ['bijvoorbeeld', 'zoals', 'bijv', 'voorbeeld', 'gezien', 'gedaan'],
    subjectSpecific: {
      [Subject.Geography]: ['kaart', 'land', 'klimaat', 'natuur', 'rivier', 'stad', 'wereld'],
      [Subject.History]: ['vroeger', 'tijd', 'eeuw', 'jaartal', 'oorlog', 'koning', 'ridders'],
      [Subject.Science]: ['proefje', 'onderzoek', 'waarneming', 'test', 'machine', 'natuur'],
    }
  };

  const hasExplanation = checks.explanation.some(w => text.includes(w));
  const hasProcess = checks.process.some(w => text.includes(w));
  const hasContent = checks.content.some(w => text.includes(w));
  const hasEvidence = checks.evidence.some(w => text.includes(w));
  
  const subjectWords = (checks.subjectSpecific as any)[subject] || [];
  const hasSubjectWords = subjectWords.length > 0 ? subjectWords.some((w: string) => text.includes(w)) : true;

  if (wordCount < 6) {
    return "Dat is een kort maar krachtig begin! Kun je iets meer vertellen over wat je precies hebt gedaan tijdens de les?";
  }

  if (!hasExplanation && wordCount < 25) {
    return "Mooi! Gebruik eens woorden als 'omdat' of 'want' om uit te leggen *waarom* je dit nu beter begrijpt.";
  }

  if (!hasEvidence) {
    return "Je bent goed op weg. Kun je een concreet voorbeeld geven van iets dat je hebt gezien of gedaan in de les?";
  }

  if (!hasSubjectWords && wordCount > 15) {
    return `Je schrijft al veel, goed zo! Kun je ook wat woorden uit de les over ${subject} gebruiken in je tekst?`;
  }

  if (!hasProcess && wordCount < 30) {
    return "Goede uitleg! Vertel ook eens hoe je het hebt aangepakt. Wat deed je als eerste?";
  }

  if (!hasContent) {
    return "Ik zie wat je hebt gedaan, maar wat *vond* je ervan? Was het moeilijk of juist makkelijk voor je?";
  }
  
  if (wordCount >= 30 && hasExplanation && hasEvidence) {
    return "Wauw, Meester-Ranger! Je geeft uitleg, voorbeelden en gebruikt veel woorden. Dit is een super sterke reflectie!";
  }

  return "Je reflectie ziet er goed uit. Heb je alles verteld wat je wilde vertellen, of schiet je nog iets te binnen?";
};

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

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    HET ECHTE DOEL: "${goalTitle}: ${goalDescription}"
    TAAK: Bedenk een totaal ANDER lesdoel als voorbeeld (bijv. "Een taart bakken"). 
    Schrijf voor 4 niveaus:
    1. Een korte uitleg ('Ik-kan'-zin) die past bij HET ECHTE DOEL.
    2. Een voorbeeld-reflectie die past bij HET REFERENTIEDOEL.
    
    ANTWOORD IN JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            referenceGoal: { type: Type.STRING },
            levels: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  level: { type: Type.NUMBER },
                  guidance: { type: Type.STRING },
                  example: { type: Type.STRING },
                },
                required: ["level", "guidance", "example"]
              },
            },
          },
          required: ["referenceGoal", "levels"]
        }
      }
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
): Promise<{ text: string; isOffline: boolean }> => {
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  
  if (isOffline) {
    return { text: getLocalFeedback(currentDraft, subject), isOffline: true };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Rol: Reflectie-Ranger, een bemoedigende coach voor kinderen (8-12 jaar).
    Vak: ${subject}
    Lesdoel: "${goalTitle}" (${goalDescription})
    Tekst van kind: "${currentDraft}"
    
    Opdracht: Geef korte (max 3 zinnen), positieve feedback in het Nederlands. 
    - Noem een specifiek sterk punt uit de tekst van het kind.
    - Stel één concrete vraag om meer detail of bewijs toe te voegen (bijv: "Hoe zag dat eruit?", "Wat was het belangrijkste dat je ontdekte?").
    - Houd het taalgebruik simpel en enthousiast.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return { text: response.text || getLocalFeedback(currentDraft, subject), isOffline: false };
  } catch (error) {
    return { text: getLocalFeedback(currentDraft, subject), isOffline: true };
  }
};
