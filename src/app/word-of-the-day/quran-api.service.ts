import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { QuranWord, WordForm } from './quran-word.model';
import { firstValueFrom } from 'rxjs';

const API_BASE = 'https://api.quran.com/api/v4';
const AUDIO_BASE = 'https://audio.qurancdn.com/';
const CACHE_KEY = 'quran_api_words_v5';   // bumped — static root map
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Root lookup loaded from /quran-roots.json — a static file built from
 * the open-source Quranic Arabic Corpus (github.com/mustafa0x/quran-morphology).
 *
 * Keys are "surah:verse:wordPosition" → Arabic root letters, e.g. "رحم".
 * Covers all 114 surahs (~50 000 entries, ~793 KB, loaded once lazily).
 */
const ROOTS_URL = '/quran-roots.json';

/* ── API response shapes ── */
interface ApiTranslation { text: string; }

interface ApiWord {
  id: number;
  position: number;
  char_type_name: string;
  text_uthmani: string;
  text: string;
  audio_url: string | null;
  translation: ApiTranslation;
  transliteration: ApiTranslation;
}

interface ApiVerse {
  id: number;
  verse_number: number;
  verse_key: string;
  words: ApiWord[];
}

interface ApiVersesResponse {
  verses: ApiVerse[];
  pagination: { next_page: number | null; total_pages: number };
}

interface ApiChapter {
  id: number;
  name_simple: string;
  verses_count: number;
}
interface ApiChaptersResponse { chapters: ApiChapter[]; }

interface WordCache { timestamp: number; words: QuranWord[]; }

/* Starter surahs — iconic + short for good vocabulary variety */
const STARTER_SURAHS = [1, 2, 3, 36, 55, 56, 67, 73, 78, 87, 93, 94, 95, 96, 112, 113, 114];

@Injectable({ providedIn: 'root' })
export class QuranApiService {

  private chapters: ApiChapter[] = [];
  private chaptersOk = false;

  private wordPool: QuranWord[] = [];
  private dedupMap = new Map<string, number>();
  private nextId = 1;

  /** Root lookup: "surah:verse:wordPos" → Arabic root letters */
  private rootMap: Record<string, string> = {};
  private rootsLoaded = false;

  private initPromise: Promise<void> | null = null;

  constructor(private http: HttpClient) {}

  /* ════════════════════════════════
     Public API
  ════════════════════════════════ */

  get totalAvailable(): number { return this.wordPool.length; }

  getAllWords(): QuranWord[] { return [...this.wordPool]; }
  getWordById(id: number): QuranWord | undefined { return this.wordPool.find(w => w.id === id); }
  getUnlearnedWords(ids: Set<number>): QuranWord[] { return this.wordPool.filter(w => !ids.has(w.id)); }

  getWordOfTheDay(): QuranWord | null {
    if (!this.wordPool.length) return null;
    const seed = this.dateSeed(new Date().toISOString().slice(0, 10));
    return this.wordPool[seed % this.wordPool.length];
  }

  async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.doInit();
    return this.initPromise;
  }

  async fetchMoreWords(targetNew = 20): Promise<number> {
    await this.ensureChapters();
    await this.ensureRoots();

    let added = 0, tries = 0;
    while (added < targetNew && tries < 12) {
      tries++;
      const ch = this.chapters[Math.floor(Math.random() * this.chapters.length)];
      const page = Math.floor(Math.random() * Math.ceil(ch.verses_count / 10)) + 1;
      try {
        const before = this.wordPool.length;
        await this.fetchSurahPage(ch.id, page, 10);
        added += this.wordPool.length - before;
      } catch { /* try another surah */ }
    }

    this.applyRoots();
    this.rebuildForms();
    this.saveCache();
    return this.wordPool.length;
  }

  /* ════════════════════════════════
     Init
  ════════════════════════════════ */

  private async doInit(): Promise<void> {
    if (this.tryRestoreCache()) return;

    // Load roots + chapters in parallel
    await Promise.all([
      this.ensureChapters(),
      this.ensureRoots(),
    ]);

    // Fetch starter surahs in parallel
    await Promise.allSettled(
      STARTER_SURAHS.map(s => this.fetchSurahPage(s, 1, 7))
    );

    if (!this.wordPool.length) {
      throw new Error('No words could be loaded from the Quran.com API.');
    }

    // Apply roots from static lookup (instant, no API calls)
    this.applyRoots();
    this.rebuildForms();
    this.saveCache();
  }

  /* ════════════════════════════════
     Root Map (static JSON)
  ════════════════════════════════ */

  private async ensureRoots(): Promise<void> {
    if (this.rootsLoaded) return;
    try {
      this.rootMap = await firstValueFrom(
        this.http.get<Record<string, string>>(ROOTS_URL)
      );
      this.rootsLoaded = true;
      console.log(`[QuranApiService] Root map loaded: ${Object.keys(this.rootMap).length} entries`);
    } catch (err) {
      console.warn('[QuranApiService] Could not load root map:', err);
      this.rootMap = {};
      this.rootsLoaded = true; // don't retry on failure
    }
  }

  /**
   * Apply roots from the static root map to all words in the pool.
   * Key format: "surah:verse:wordPosition" → Arabic root.
   */
  private applyRoots(): void {
    for (const word of this.wordPool) {
      if (word.root) continue; // already has a root

      // Try looking up the root using the word's verse key + position
      if (word.verseKey && word.wordPosition) {
        const [surah, verse] = word.verseKey.split(':');
        const key = `${surah}:${verse}:${word.wordPosition}`;
        const root = this.rootMap[key];
        if (root) {
          word.root = root;
        }
      }
    }
  }

  /* ════════════════════════════════
     Chapters
  ════════════════════════════════ */

  private async ensureChapters(): Promise<void> {
    if (this.chaptersOk) return;
    try {
      const res = await firstValueFrom(
        this.http.get<ApiChaptersResponse>(`${API_BASE}/chapters?language=en`)
      );
      this.chapters = res.chapters;
    } catch {
      this.chapters = Array.from({ length: 114 }, (_, i) => ({
        id: i + 1, name_simple: `Surah ${i + 1}`, verses_count: 10,
      }));
    }
    this.chaptersOk = true;
  }

  /* ════════════════════════════════
     Fetch verses / words
  ════════════════════════════════ */

  private async fetchSurahPage(
    surahNum: number, page: number, perPage: number,
  ): Promise<void> {
    const url =
      `${API_BASE}/verses/by_chapter/${surahNum}` +
      `?language=en&words=true` +
      `&word_fields=text_uthmani,text_imlaei` +
      `&per_page=${perPage}&page=${page}`;

    const res = await firstValueFrom(this.http.get<ApiVersesResponse>(url));

    for (const verse of res.verses) {
      const verseText = verse.words
        .filter(w => w.char_type_name === 'word')
        .map(w => w.text_uthmani || w.text)
        .join(' ');

      for (const apiWord of verse.words) {
        if (apiWord.char_type_name !== 'word') continue;

        const arabicText = (apiWord.text_uthmani || apiWord.text || '').trim();
        const meaning = this.cleanMeaning(apiWord.translation?.text?.trim() ?? '');
        const translit = this.cleanTranslit(apiWord.transliteration?.text?.trim() ?? '');

        if (!arabicText || !meaning || !translit) continue;
        if (meaning.length < 3) continue;
        if (/^\d+$/.test(meaning)) continue;

        const key = this.dedupKey(meaning);

        if (this.dedupMap.has(key)) {
          const idx = this.dedupMap.get(key)!;
          const existing = this.wordPool[idx];
          const occKey = `${surahNum}:${verse.verse_number}`;
          if (!existing.occurrences.some(o => `${o.surah}:${o.ayah}` === occKey)) {
            existing.occurrences.push({ surah: surahNum, ayah: verse.verse_number, text: verseText });
            existing.frequency = existing.occurrences.length;
          }
          continue;
        }

        // Look up root immediately from static map
        const [s, v] = verse.verse_key.split(':');
        const rootKey = `${s}:${v}:${apiWord.position}`;
        const root = this.rootMap[rootKey] ?? '';

        const word: QuranWord = {
          id: this.nextId++,
          word: arabicText,
          transliteration: translit,
          root,
          meaning,
          frequency: 1,
          forms: [],
          occurrences: [{ surah: surahNum, ayah: verse.verse_number, text: verseText }],
          audioUrl: apiWord.audio_url ? `${AUDIO_BASE}${apiWord.audio_url}` : undefined,
          verseKey: verse.verse_key,
          wordPosition: apiWord.position,
        };

        this.dedupMap.set(key, this.wordPool.length);
        this.wordPool.push(word);
      }
    }
  }

  /* ════════════════════════════════
     Word forms — built from root siblings
  ════════════════════════════════ */

  private rebuildForms(): void {
    const rootMap = new Map<string, QuranWord[]>();

    for (const word of this.wordPool) {
      if (!word.root) continue;
      const list = rootMap.get(word.root) ?? [];
      list.push(word);
      rootMap.set(word.root, list);
    }

    for (const word of this.wordPool) {
      if (!word.root) { word.forms = []; continue; }
      word.forms = (rootMap.get(word.root) ?? [])
        .filter(s => s.id !== word.id)
        .slice(0, 6)
        .map((s): WordForm => ({ word: s.word, meaning: s.meaning }));
    }
  }

  /* ════════════════════════════════
     Helpers
  ════════════════════════════════ */

  private dedupKey(meaning: string): string {
    return meaning.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  }

  private cleanMeaning(raw: string): string {
    return raw.replace(/^\(+/, '').replace(/\)+$/, '').replace(/\s+/g, ' ').trim();
  }

  private cleanTranslit(raw: string): string {
    return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : '';
  }

  private dateSeed(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    return Math.abs(h);
  }

  /* ════════════════════════════════
     Cache
  ════════════════════════════════ */

  private tryRestoreCache(): boolean {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return false;
      const cache: WordCache = JSON.parse(raw);
      if (!cache.words?.length) return false;
      if (Date.now() - cache.timestamp > CACHE_TTL_MS) return false;

      this.wordPool = cache.words;
      this.nextId = Math.max(...cache.words.map(w => w.id)) + 1;
      cache.words.forEach((w, i) => this.dedupMap.set(this.dedupKey(w.meaning), i));
      this.rebuildForms();
      return true;
    } catch {
      return false;
    }
  }

  private saveCache(): void {
    const payload: WordCache = { timestamp: Date.now(), words: this.wordPool };
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch {
      try {
        localStorage.removeItem(CACHE_KEY);
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          ...payload, words: this.wordPool.slice(0, 300),
        }));
      } catch { /* quota exhausted */ }
    }
  }
}