/* ─────────────────────────────────────────
   quran-word.model.ts
───────────────────────────────────────── */

export interface QuranWord {
  id: number;
  word: string;        // Arabic script (text_uthmani from API)
  transliteration: string;
  root: string;        // Arabic root letters, e.g. "ر ح م" — from corpus/morphology
  meaning: string;
  frequency: number;        // Count of occurrences in loaded pool
  forms: WordForm[];    // Other words sharing the same root — built by rebuildForms()
  occurrences: WordOccurrence[];
  audioUrl?: string;        // https://audio.qurancdn.com/...
  verseKey?: string;        // "2:255"
  wordPosition?: number;        // 1-based position of this word within its verse
  // Required to call the corpus/morphology endpoint correctly
}

export interface WordForm {
  word: string;   // Arabic script
  meaning: string;
}

export interface WordOccurrence {
  surah: number;
  ayah: number;
  text?: string;     // Full verse Arabic text snippet
}

/* ─── Learning & Progress ─── */

export interface LearnedWord {
  wordId: number;
  learnedDate: string;     // "2025-04-10"
  revisionDates: string[];
  nextRevision: string;
  revisionLevel: number;     // 0=new · 1=1d · 2=3d · 3=7d · 4=mastered
  quizScore: number;     // 0 or 1
}

export interface DailyStats {
  date: string;
  wordsLearned: number;
  wordIds: number[];
}

export interface WordProgress {
  totalLearned: number;
  currentStreak: number;
  bestStreak: number;
  lastLearnedDate: string;
  learnedWords: LearnedWord[];
  totalFrequencyWeight: number;
  dailyHistory: DailyStats[];
  quizCorrect: number;
  quizAttempted: number;
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