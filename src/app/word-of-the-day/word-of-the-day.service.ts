import { Injectable } from '@angular/core';
import { QuranWord, LearnedWord, WordProgress, QuizQuestion, QuizOption, RevisionWord } from './quran-word.model';
import { QURAN_WORDS, TOTAL_QURAN_WORD_FREQUENCY } from './quran-words.data';

const STORAGE_KEY = 'wotd_progress';
const REVISION_INTERVALS = [1, 3, 7]; // days

@Injectable({ providedIn: 'root' })
export class WordOfTheDayService {

  private progress: WordProgress;

  constructor() {
    this.progress = this.loadProgress();
  }

  /* ════════════════════════════════
     Word of the Day
  ════════════════════════════════ */
  getWordOfTheDay(): QuranWord {
    const today = this.todayStr();
    const seed = this.dateSeed(today);
    const index = seed % QURAN_WORDS.length;
    return QURAN_WORDS[index];
  }

  getAllWords(): QuranWord[] {
    return QURAN_WORDS;
  }

  getWordById(id: number): QuranWord | undefined {
    return QURAN_WORDS.find(w => w.id === id);
  }

  /* ════════════════════════════════
     Learning & Streak
  ════════════════════════════════ */
  markAsLearned(wordId: number): void {
    const today = this.todayStr();
    const existing = this.progress.learnedWords.find(w => w.wordId === wordId);
    if (existing) return; // Already learned

    const word = this.getWordById(wordId);
    if (!word) return;

    const learned: LearnedWord = {
      wordId,
      learnedDate: today,
      revisionDates: [],
      nextRevision: this.addDays(today, REVISION_INTERVALS[0]),
      revisionLevel: 0,
      quizScore: 0,
    };

    this.progress.learnedWords.push(learned);
    this.progress.totalLearned = this.progress.learnedWords.length;
    this.progress.totalFrequencyWeight += word.frequency;

    // Update streak
    const yesterday = this.addDays(today, -1);
    if (this.progress.lastLearnedDate === yesterday) {
      this.progress.currentStreak++;
    } else if (this.progress.lastLearnedDate !== today) {
      this.progress.currentStreak = 1;
    }
    this.progress.lastLearnedDate = today;

    this.saveProgress();
  }

  isWordLearned(wordId: number): boolean {
    return this.progress.learnedWords.some(w => w.wordId === wordId);
  }

  /* ════════════════════════════════
     Quiz System
  ════════════════════════════════ */
  generateQuiz(wordId: number): QuizQuestion | null {
    const word = this.getWordById(wordId);
    if (!word) return null;

    const otherWords = QURAN_WORDS.filter(w => w.id !== wordId);
    const shuffled = this.shuffleArray([...otherWords]);
    const wrongOptions = shuffled.slice(0, 3).map(w => ({
      text: w.meaning, isCorrect: false
    }));

    const options: QuizOption[] = this.shuffleArray([
      { text: word.meaning, isCorrect: true },
      ...wrongOptions,
    ]);

    return {
      wordId: word.id,
      word: word.word,
      question: `What does "${word.transliteration}" (${word.word}) mean?`,
      options,
    };
  }

  recordQuizResult(wordId: number, correct: boolean): void {
    const learned = this.progress.learnedWords.find(w => w.wordId === wordId);
    if (learned) {
      learned.quizScore = correct ? 1 : 0;
      this.saveProgress();
    }
  }

  /* ════════════════════════════════
     Spaced Repetition
  ════════════════════════════════ */
  getWordsForRevision(): RevisionWord[] {
    const today = this.todayStr();
    const results: RevisionWord[] = [];

    for (const lw of this.progress.learnedWords) {
      if (lw.revisionLevel >= REVISION_INTERVALS.length) continue;
      if (lw.nextRevision <= today) {
        const word = this.getWordById(lw.wordId);
        if (!word) continue;
        const daysSince = this.daysBetween(lw.learnedDate, today);
        results.push({ word, learnedInfo: lw, daysSinceLearned: daysSince });
      }
    }
    return results;
  }

  markRevisionDone(wordId: number, remembered: boolean): void {
    const today = this.todayStr();
    const learned = this.progress.learnedWords.find(w => w.wordId === wordId);
    if (!learned) return;

    learned.revisionDates.push(today);

    if (remembered) {
      learned.revisionLevel++;
      if (learned.revisionLevel < REVISION_INTERVALS.length) {
        learned.nextRevision = this.addDays(today, REVISION_INTERVALS[learned.revisionLevel]);
      } else {
        learned.nextRevision = '9999-12-31'; // Mastered
      }
    } else {
      learned.revisionLevel = 0;
      learned.nextRevision = this.addDays(today, REVISION_INTERVALS[0]);
    }

    this.saveProgress();
  }

  /* ════════════════════════════════
     Progress & Stats
  ════════════════════════════════ */
  getProgress(): WordProgress {
    // Recalculate streak on access
    const today = this.todayStr();
    const yesterday = this.addDays(today, -1);
    if (this.progress.lastLearnedDate !== today && this.progress.lastLearnedDate !== yesterday) {
      this.progress.currentStreak = 0;
    }
    return { ...this.progress };
  }

  getUnderstandingPercentage(): number {
    if (!this.progress.totalFrequencyWeight) return 0;
    return Math.min(
      Math.round((this.progress.totalFrequencyWeight / TOTAL_QURAN_WORD_FREQUENCY) * 100),
      100
    );
  }

  /* ════════════════════════════════
     Private Helpers
  ════════════════════════════════ */
  private loadProgress(): WordProgress {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* noop */ }
    return {
      totalLearned: 0,
      currentStreak: 0,
      lastLearnedDate: '',
      learnedWords: [],
      totalFrequencyWeight: 0,
    };
  }

  private saveProgress(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
  }

  private todayStr(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private dateSeed(dateStr: string): number {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  private addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  private daysBetween(a: string, b: string): number {
    const da = new Date(a).getTime();
    const db = new Date(b).getTime();
    return Math.floor((db - da) / 86400000);
  }

  private shuffleArray<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
