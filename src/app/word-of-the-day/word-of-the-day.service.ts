import { Injectable } from '@angular/core';
import {
  QuranWord, LearnedWord, WordProgress,
  QuizQuestion, QuizOption, RevisionWord, DailyStats,
} from './quran-word.model';
import { QuranApiService } from './quran-api.service';

const STORAGE_KEY = 'wotd_progress_v2';
const REVISION_INTERVALS = [1, 3, 7] as const;   // days

@Injectable({ providedIn: 'root' })
export class WordOfTheDayService {

  private progress: WordProgress;

  constructor(private quranApi: QuranApiService) {
    this.progress = this.loadProgress();
  }

  /* ════════════════════════════════
     Initialization
  ════════════════════════════════ */

  /** Must be awaited once at component init. */
  async initialize(): Promise<void> {
    await this.quranApi.initialize();
  }

  /* ════════════════════════════════
     Word access
  ════════════════════════════════ */

  getWordOfTheDay(): QuranWord | null { return this.quranApi.getWordOfTheDay(); }
  getAllWords(): QuranWord[] { return this.quranApi.getAllWords(); }
  getWordById(id: number): QuranWord | undefined { return this.quranApi.getWordById(id); }
  getTotalAvailable(): number { return this.quranApi.totalAvailable; }
  getUnlearnedWords(): QuranWord[] {
    const ids = new Set(this.progress.learnedWords.map(w => w.wordId));
    return this.quranApi.getUnlearnedWords(ids);
  }

  getWordsLearnedToday(): number {
    return this.progress.dailyHistory.find(d => d.date === this.todayStr())?.wordsLearned ?? 0;
  }

  async loadMoreWords(count = 20): Promise<number> {
    return this.quranApi.fetchMoreWords(count);
  }

  /* ════════════════════════════════
     Learning & streak
  ════════════════════════════════ */

  markAsLearned(wordId: number): void {
    if (this.isWordLearned(wordId)) return;

    const word = this.getWordById(wordId);
    if (!word) return;

    const today = this.todayStr();

    this.progress.learnedWords.push({
      wordId,
      learnedDate: today,
      revisionDates: [],
      nextRevision: this.addDays(today, REVISION_INTERVALS[0]),
      revisionLevel: 0,
      quizScore: 0,
    });
    this.progress.totalLearned = this.progress.learnedWords.length;
    this.progress.totalFrequencyWeight += word.frequency;

    let daily = this.progress.dailyHistory.find(d => d.date === today);
    if (!daily) {
      daily = { date: today, wordsLearned: 0, wordIds: [] };
      this.progress.dailyHistory.push(daily);
    }
    daily.wordsLearned++;
    daily.wordIds.push(wordId);

    const yesterday = this.addDays(today, -1);
    if (this.progress.lastLearnedDate === yesterday) this.progress.currentStreak++;
    else if (this.progress.lastLearnedDate !== today) this.progress.currentStreak = 1;

    this.progress.lastLearnedDate = today;
    if (this.progress.currentStreak > this.progress.bestStreak) {
      this.progress.bestStreak = this.progress.currentStreak;
    }

    this.saveProgress();
  }

  isWordLearned(wordId: number): boolean {
    return this.progress.learnedWords.some(w => w.wordId === wordId);
  }

  /* ════════════════════════════════
     Quiz
  ════════════════════════════════ */

  generateQuiz(wordId: number): QuizQuestion | null {
    const word = this.getWordById(wordId);
    if (!word) return null;

    const distractors: QuizOption[] = this.quranApi.getAllWords()
      .filter(w => w.id !== wordId)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => ({ text: w.meaning, isCorrect: false }));

    return {
      wordId: word.id,
      word: word.word,
      question: `What does "${word.transliteration}" (${word.word}) mean?`,
      options: this.shuffle([{ text: word.meaning, isCorrect: true }, ...distractors]),
    };
  }

  recordQuizResult(wordId: number, correct: boolean): void {
    const lw = this.progress.learnedWords.find(w => w.wordId === wordId);
    if (lw) lw.quizScore = correct ? 1 : 0;
    this.progress.quizAttempted++;
    if (correct) this.progress.quizCorrect++;
    this.saveProgress();
  }

  /* ════════════════════════════════
     Spaced repetition
  ════════════════════════════════ */

  getWordsForRevision(): RevisionWord[] {
    const today = this.todayStr();
    return this.progress.learnedWords
      .filter(lw => lw.revisionLevel < REVISION_INTERVALS.length && lw.nextRevision <= today)
      .reduce<RevisionWord[]>((acc, lw) => {
        const word = this.getWordById(lw.wordId);
        if (word) acc.push({ word, learnedInfo: lw, daysSinceLearned: this.daysBetween(lw.learnedDate, today) });
        return acc;
      }, []);
  }

  markRevisionDone(wordId: number, remembered: boolean): void {
    const today = this.todayStr();
    const lw = this.progress.learnedWords.find(w => w.wordId === wordId);
    if (!lw) return;

    lw.revisionDates.push(today);
    if (remembered) {
      lw.revisionLevel++;
      lw.nextRevision = lw.revisionLevel < REVISION_INTERVALS.length
        ? this.addDays(today, REVISION_INTERVALS[lw.revisionLevel])
        : '9999-12-31';
    } else {
      lw.revisionLevel = 0;
      lw.nextRevision = this.addDays(today, REVISION_INTERVALS[0]);
    }
    this.saveProgress();
  }

  /* ════════════════════════════════
     Stats
  ════════════════════════════════ */

  getProgress(): WordProgress {
    const today = this.todayStr();
    const yesterday = this.addDays(today, -1);
    const last = this.progress.lastLearnedDate;
    if (last && last !== today && last !== yesterday) this.progress.currentStreak = 0;
    return { ...this.progress };
  }

  getUnderstandingPercentage(): number {
    const total = this.quranApi.totalAvailable;
    return total ? Math.min(Math.round((this.progress.totalLearned / total) * 100), 100) : 0;
  }

  getMasteredCount(): number {
    return this.progress.learnedWords.filter(w => w.revisionLevel >= REVISION_INTERVALS.length).length;
  }

  getQuizAccuracy(): number {
    return this.progress.quizAttempted
      ? Math.round((this.progress.quizCorrect / this.progress.quizAttempted) * 100)
      : 0;
  }

  getDailyAverage(): number {
    const h = this.progress.dailyHistory;
    if (!h.length) return 0;
    return Math.round((h.reduce((s, d) => s + d.wordsLearned, 0) / h.length) * 10) / 10;
  }

  getActiveDaysCount(): number { return this.progress.dailyHistory.length; }

  getRecentHistory(days = 7): DailyStats[] {
    const today = this.todayStr();
    return Array.from({ length: days }, (_, i) => {
      const date = this.addDays(today, -(days - 1 - i));
      return this.progress.dailyHistory.find(d => d.date === date)
        ?? { date, wordsLearned: 0, wordIds: [] };
    });
  }

  /* ════════════════════════════════
     Private helpers
  ════════════════════════════════ */

  private loadProgress(): WordProgress {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        return {
          totalLearned: p.totalLearned ?? 0,
          currentStreak: p.currentStreak ?? 0,
          bestStreak: p.bestStreak ?? 0,
          lastLearnedDate: p.lastLearnedDate ?? '',
          learnedWords: p.learnedWords ?? [],
          totalFrequencyWeight: p.totalFrequencyWeight ?? 0,
          dailyHistory: p.dailyHistory ?? [],
          quizCorrect: p.quizCorrect ?? 0,
          quizAttempted: p.quizAttempted ?? 0,
        };
      }
    } catch { /* noop */ }
    return {
      totalLearned: 0, currentStreak: 0, bestStreak: 0,
      lastLearnedDate: '', learnedWords: [],
      totalFrequencyWeight: 0, dailyHistory: [],
      quizCorrect: 0, quizAttempted: 0,
    };
  }

  private saveProgress(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress)); }
    catch { /* quota exceeded */ }
  }

  private todayStr(): string { return new Date().toISOString().slice(0, 10); }
  private addDays(d: string, n: number): string {
    const dt = new Date(d); dt.setDate(dt.getDate() + n);
    return dt.toISOString().slice(0, 10);
  }
  private daysBetween(a: string, b: string): number {
    return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
  }
  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}