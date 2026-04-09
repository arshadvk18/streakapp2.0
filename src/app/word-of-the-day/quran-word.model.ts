/* ─────────────────────────────────────────
   Qur'anic Word Data Model
───────────────────────────────────────── */

export interface QuranWord {
  id: number;
  word: string;            // Arabic script
  transliteration: string;
  root: string;            // Root letters (Arabic)
  meaning: string;
  frequency: number;       // Occurrences in Qur'an
  forms: WordForm[];
  occurrences: WordOccurrence[];
}

export interface WordForm {
  word: string;            // Arabic script
  meaning: string;
}

export interface WordOccurrence {
  surah: number;
  ayah: number;
  text?: string;           // Short Arabic snippet
}

/* ─── Learning & Progress ─── */

export interface LearnedWord {
  wordId: number;
  learnedDate: string;     // ISO date string
  revisionDates: string[]; // Dates when revised
  nextRevision: string;    // Next scheduled revision date
  revisionLevel: number;   // 0=new, 1=1day, 2=3days, 3=7days, 4=mastered
  quizScore: number;       // Last quiz score (0 or 1)
}

export interface WordProgress {
  totalLearned: number;
  currentStreak: number;
  lastLearnedDate: string; // ISO date string
  learnedWords: LearnedWord[];
  totalFrequencyWeight: number; // Sum of frequencies of learned words
}

export interface QuizOption {
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  wordId: number;
  word: string;
  question: string;
  options: QuizOption[];
}

export interface RevisionWord {
  word: QuranWord;
  learnedInfo: LearnedWord;
  daysSinceLearned: number;
}
