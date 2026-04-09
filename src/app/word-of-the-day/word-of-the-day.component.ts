import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WordOfTheDayService } from './word-of-the-day.service';
import { QuranWord, QuizQuestion, RevisionWord, WordProgress } from './quran-word.model';

type ViewState = 'word' | 'quiz' | 'revision' | 'progress';

@Component({
  selector: 'app-word-of-the-day',
  standalone: true,
  imports: [CommonModule],
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
  selectedAnswer: number | null = null;
  quizAnswered = false;
  quizCorrect = false;

  /* Revision */
  revisionWords: RevisionWord[] = [];
  currentRevisionIndex = 0;
  revisionRevealed = false;

  constructor(public wotdService: WordOfTheDayService) {}

  ngOnInit(): void {
    this.todayWord = this.wotdService.getWordOfTheDay();
    this.refreshProgress();
    this.isWordLearned = this.wotdService.isWordLearned(this.todayWord.id);
    this.revisionWords = this.wotdService.getWordsForRevision();
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
  }

  /* ════════════════════════════════
     Mark as Learned
  ════════════════════════════════ */
  markLearned(): void {
    this.wotdService.markAsLearned(this.todayWord.id);
    this.isWordLearned = true;
    this.refreshProgress();
    this.startQuiz();
  }

  /* ════════════════════════════════
     Quiz
  ════════════════════════════════ */
  startQuiz(): void {
    this.quiz = this.wotdService.generateQuiz(this.todayWord.id);
    this.selectedAnswer = null;
    this.quizAnswered = false;
    this.quizCorrect = false;
    this.viewState = 'quiz';
  }

  selectAnswer(index: number): void {
    if (this.quizAnswered) return;
    this.selectedAnswer = index;
    this.quizAnswered = true;
    this.quizCorrect = this.quiz?.options[index]?.isCorrect ?? false;
    this.wotdService.recordQuizResult(this.todayWord.id, this.quizCorrect);
    this.refreshProgress();
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
    this.refreshProgress();
    if (this.currentRevisionIndex >= this.revisionWords.length) {
      this.revisionWords = this.wotdService.getWordsForRevision();
    }
  }

  /* ════════════════════════════════
     Progress
  ════════════════════════════════ */
  private refreshProgress(): void {
    this.progress = this.wotdService.getProgress();
    this.understandingPct = this.wotdService.getUnderstandingPercentage();
  }
}
