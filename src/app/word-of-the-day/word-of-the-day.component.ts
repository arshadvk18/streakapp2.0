import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WordOfTheDayService } from './word-of-the-day.service';
import { QuranWord, QuizQuestion, RevisionWord, WordProgress, DailyStats } from './quran-word.model';

type ViewState = 'word' | 'explore' | 'quiz' | 'revision' | 'progress';

@Component({
  selector: 'app-word-of-the-day',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './word-of-the-day.component.html',
  styleUrls: ['./word-of-the-day.component.css'],
})
export class WordOfTheDayComponent implements OnInit {

  Math = Math;

  /* ─── State ─── */
  viewState: ViewState = 'word';
  todayWord!: QuranWord;
  progress!: WordProgress;
  understandingPct = 0;

  /* Word detail */
  isWordLearned = false;
  showOccurrences = false;
  expandedOccurrence: number | null = null;

  /* Quiz */
  quiz: QuizQuestion | null = null;
  quizWordRef: QuranWord | null = null;  // Which word the quiz is about
  selectedAnswer: number | null = null;
  quizAnswered = false;
  quizCorrect = false;

  /* Revision */
  revisionWords: RevisionWord[] = [];;
  currentRevisionIndex = 0;
  revisionRevealed = false;

  /* Explore */
  unlearnedWords: QuranWord[] = [];
  selectedExploreWord: QuranWord | null = null;
  exploreSearch = '';
  wordsLearnedToday = 0;

  /* Stats */
  masteredCount = 0;
  quizAccuracy = 0;
  dailyAverage = 0;
  activeDays = 0;
  recentHistory: DailyStats[] = [];

  constructor(public wotdService: WordOfTheDayService) {}

  ngOnInit(): void {
    this.todayWord = this.wotdService.getWordOfTheDay();
    this.refreshAll();
  }

  /* ════════════════════════════════
     Refresh helpers
  ════════════════════════════════ */
  private refreshAll(): void {
    this.progress = this.wotdService.getProgress();
    this.understandingPct = this.wotdService.getUnderstandingPercentage();
    this.isWordLearned = this.wotdService.isWordLearned(this.todayWord.id);
    this.revisionWords = this.wotdService.getWordsForRevision();
    this.unlearnedWords = this.wotdService.getUnlearnedWords();
    this.wordsLearnedToday = this.wotdService.getWordsLearnedToday();
    this.masteredCount = this.wotdService.getMasteredCount();
    this.quizAccuracy = this.wotdService.getQuizAccuracy();
    this.dailyAverage = this.wotdService.getDailyAverage();
    this.activeDays = this.wotdService.getActiveDaysCount();
    this.recentHistory = this.wotdService.getRecentHistory(7);
  }

  /* ════════════════════════════════
     View Navigation
  ════════════════════════════════ */
  setView(view: ViewState): void {
    this.viewState = view;
    if (view === 'revision') {
      this.revisionWords = this.wotdService.getWordsForRevision();
      this.currentRevisionIndex = 0;
      this.revisionRevealed = false;
    }
    if (view === 'explore') {
      this.unlearnedWords = this.wotdService.getUnlearnedWords();
      this.selectedExploreWord = null;
      this.exploreSearch = '';
    }
    if (view === 'progress') {
      this.refreshAll();
    }
  }

  /* ════════════════════════════════
     Mark as Learned (Word of the Day)
  ════════════════════════════════ */
  markLearned(): void {
    this.wotdService.markAsLearned(this.todayWord.id);
    this.isWordLearned = true;
    this.quizWordRef = this.todayWord;
    this.refreshAll();
    this.startQuiz(this.todayWord);
  }

  /* ════════════════════════════════
     Explore — Learn More Words
  ════════════════════════════════ */
  get filteredExploreWords(): QuranWord[] {
    if (!this.exploreSearch.trim()) return this.unlearnedWords;
    const q = this.exploreSearch.toLowerCase();
    return this.unlearnedWords.filter(w =>
      w.transliteration.toLowerCase().includes(q) ||
      w.meaning.toLowerCase().includes(q) ||
      w.word.includes(this.exploreSearch)
    );
  }

  selectExploreWord(word: QuranWord): void {
    this.selectedExploreWord = word;
  }

  learnExploreWord(): void {
    if (!this.selectedExploreWord) return;
    this.wotdService.markAsLearned(this.selectedExploreWord.id);
    this.quizWordRef = this.selectedExploreWord;
    this.refreshAll();
    this.startQuiz(this.selectedExploreWord);
  }

  backToExplore(): void {
    this.selectedExploreWord = null;
    this.refreshAll();
    this.viewState = 'explore';
  }

  /* ════════════════════════════════
     Quiz
  ════════════════════════════════ */
  startQuiz(word: QuranWord): void {
    this.quiz = this.wotdService.generateQuiz(word.id);
    this.quizWordRef = word;
    this.selectedAnswer = null;
    this.quizAnswered = false;
    this.quizCorrect = false;
    this.viewState = 'quiz';
  }

  selectAnswer(index: number): void {
    if (this.quizAnswered || !this.quiz || !this.quizWordRef) return;
    this.selectedAnswer = index;
    this.quizAnswered = true;
    this.quizCorrect = this.quiz.options[index]?.isCorrect ?? false;
    this.wotdService.recordQuizResult(this.quizWordRef.id, this.quizCorrect);
    this.refreshAll();
  }

  backToWord(): void {
    this.viewState = 'word';
  }

  /* ════════════════════════════════
     Occurrences
  ════════════════════════════════ */
  toggleOccurrences(): void {
    this.showOccurrences = !this.showOccurrences;
  }

  toggleOccurrenceDetail(index: number): void {
    this.expandedOccurrence = this.expandedOccurrence === index ? null : index;
  }

  /* ════════════════════════════════
     Revision
  ════════════════════════════════ */
  get currentRevision(): RevisionWord | null {
    return this.revisionWords[this.currentRevisionIndex] ?? null;
  }

  revealRevision(): void {
    this.revisionRevealed = true;
  }

  answerRevision(remembered: boolean): void {
    const rev = this.currentRevision;
    if (!rev) return;
    this.wotdService.markRevisionDone(rev.word.id, remembered);
    this.revisionRevealed = false;
    this.currentRevisionIndex++;
    this.refreshAll();
    if (this.currentRevisionIndex >= this.revisionWords.length) {
      this.revisionWords = this.wotdService.getWordsForRevision();
    }
  }

  /* ════════════════════════════════
     Helpers for template
  ════════════════════════════════ */
  getShortDay(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en', { weekday: 'short' });
  }

  getMaxHistoryWords(): number {
    return Math.max(1, ...this.recentHistory.map(d => d.wordsLearned));
  }
}
