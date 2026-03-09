import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  onSnapshot,
  Unsubscribe,
  writeBatch,
  setDoc,
  serverTimestamp
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Streak {
  id?: string;
  name: string;
  count: number;
  duration?: number;
  isIndefinite: boolean;
  badge?: string;
  createdAt?: Date;
  updatedAt?: Date;
  userId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private streaks$ = new BehaviorSubject<Streak[]>([]);
  private isBrowser: boolean;
  private unsubscribe: Unsubscribe | null = null;

  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);
  private platformId: object = inject(PLATFORM_ID);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // Get streaks as observable
  getStreaks(): Observable<Streak[]> {
    return this.streaks$.asObservable();
  }

  // Load streaks from Firestore for current user
  loadStreaks(): void {
    const user = this.auth.currentUser;
    if (!user || !this.isBrowser) return;

    if (this.unsubscribe) {
      this.unsubscribe();
    }

    const q = query(
      collection(this.firestore, 'streaks'),
      where('userId', '==', user.uid)
    );

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      const streaksList: Streak[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        streaksList.push({
          id: doc.id,
          ...data,
          createdAt: data['createdAt']?.toDate(),
          updatedAt: data['updatedAt']?.toDate()
        } as Streak);
      });
      this.streaks$.next(streaksList);
    });
  }

  // Add new streak
  async addStreak(streak: Streak): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      // Remove undefined fields before saving
      const streakData: any = {
        name: streak.name,
        count: streak.count || 0,
        isIndefinite: streak.isIndefinite || false,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Only include optional fields if they have values
      if (streak.duration !== undefined) {
        streakData.duration = streak.duration;
      }
      if (streak.badge !== undefined) {
        streakData.badge = streak.badge;
      }

      await addDoc(collection(this.firestore, 'streaks'), streakData);
      console.log('Streak added to Firestore');
    } catch (error) {
      console.error('Error adding streak:', error);
      throw error;
    }
  }

  // Update streak
  async updateStreak(id: string, streak: Partial<Streak>): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      // Remove undefined fields
      const updateData: any = { updatedAt: serverTimestamp() };
      
      if (streak.count !== undefined) updateData.count = streak.count;
      if (streak.name !== undefined) updateData.name = streak.name;
      if (streak.duration !== undefined) updateData.duration = streak.duration;
      if (streak.isIndefinite !== undefined) updateData.isIndefinite = streak.isIndefinite;
      if (streak.badge !== undefined) updateData.badge = streak.badge;

      const streakRef = doc(this.firestore, 'streaks', id);
      await updateDoc(streakRef, updateData);
    } catch (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  }

  // Delete streak
  async deleteStreak(id: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      await deleteDoc(doc(this.firestore, 'streaks', id));
    } catch (error) {
      console.error('Error deleting streak:', error);
      throw error;
    }
  }

  // Sync local streaks to Firestore (for migration from localStorage)
  async syncLocalStreaksToFirebase(localStreaks: Streak[]): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      const batch = writeBatch(this.firestore);

      for (const streak of localStreaks) {
        const docRef = doc(collection(this.firestore, 'streaks'));
        batch.set(docRef, {
          ...streak,
          userId: user.uid,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error syncing streaks:', error);
      throw error;
    }
  }

  // Save user profile data
  async saveUserProfile(displayName: string, photoURL?: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      const userRef = doc(this.firestore, 'users', user.uid);
      await setDoc(userRef, {
        displayName,
        photoURL: photoURL || '',
        email: user.email,
        createdAt: user.metadata.creationTime,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  }

  // Get user profile
  async getUserProfile() {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      const snapshot = await getDocs(
        query(collection(this.firestore, 'users'), where('__name__', '==', user.uid))
      );
      return snapshot.docs[0]?.data();
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Save quote to Firestore
  async saveQuote(quote: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      const userDocRef = doc(this.firestore, 'users', user.uid);
      const userSnapshot = await getDoc(userDocRef);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const existingQuotes = userData['savedQuotes'] || [];
        
        if (!existingQuotes.includes(quote)) {
          const updatedQuotes = [...existingQuotes, quote];
          await updateDoc(userDocRef, { savedQuotes: updatedQuotes });
        }
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      throw error;
    }
  }

  // Add savedQuotes array field with new quote
  async addSavedQuote(quote: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      const userDocRef = doc(this.firestore, 'users', user.uid);
      const userSnapshot = await getDocs(
        query(collection(this.firestore, 'users'), where('__name__', '==', user.uid))
      );

      if (userSnapshot.docs.length > 0) {
        const userData = userSnapshot.docs[0].data();
        const existingQuotes = userData['savedQuotes'] || [];
        
        if (!existingQuotes.includes(quote)) {
          const updatedQuotes = [...existingQuotes, quote];
          await updateDoc(userDocRef, { savedQuotes: updatedQuotes });
        }
      }
    } catch (error) {
      console.error('Error adding saved quote:', error);
      throw error;
    }
  }

  // Get saved quotes from Firestore
  async getSavedQuotes(): Promise<string[]> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      const userSnapshot = await getDocs(
        query(collection(this.firestore, 'users'), where('__name__', '==', user.uid))
      );

      if (userSnapshot.docs.length > 0) {
        const userData = userSnapshot.docs[0].data();
        return userData['savedQuotes'] || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting saved quotes:', error);
      throw error;
    }
  }

  // Delete saved quote from Firestore
  async deleteSavedQuote(quote: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      const userDocRef = doc(this.firestore, 'users', user.uid);
      const userSnapshot = await getDocs(
        query(collection(this.firestore, 'users'), where('__name__', '==', user.uid))
      );

      if (userSnapshot.docs.length > 0) {
        const userData = userSnapshot.docs[0].data();
        const existingQuotes = userData['savedQuotes'] || [];
        const updatedQuotes = existingQuotes.filter((q: string) => q !== quote);
        await updateDoc(userDocRef, { savedQuotes: updatedQuotes });
      }
    } catch (error) {
      console.error('Error deleting saved quote:', error);
      throw error;
    }
  }

  // Cleanup on logout
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.streaks$.next([]);
  }
}