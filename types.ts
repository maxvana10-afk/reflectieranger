
export enum Subject {
  Geography = 'Aardrijkskunde',
  History = 'Geschiedenis',
  Science = 'Natuur & Techniek',
  Citizenship = 'Burgerschap',
  Traffic = 'Verkeer',
  Arts = 'Kunst & Cultuur',
  Language = 'Taal',
  Math = 'Rekenen',
  SocialEmotional = 'Sociaal-Emotioneel',
  Other = 'Overig'
}

export interface User {
  id: string;
  name: string;
}

export interface ReflectionEntry {
  id: string;
  userId: string;
  timestamp: number;
  content: string;
  aiSuggestion?: string;
  photoBase64?: string;
  masteryLevel: number; // 1 to 4
}

export interface LearningGoal {
  id: string;
  subject: Subject;
  title: string;
  description: string;
  reflections: ReflectionEntry[];
}

export type ViewMode = 'STUDENT' | 'TEACHER';
