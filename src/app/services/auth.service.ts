import { Injectable, PLATFORM_ID, NgZone, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { 
  Auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile
} from '@angular/fire/auth';
import { 
  Firestore, 
  setDoc, 
  doc, 
  serverTimestamp 
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser$ = new BehaviorSubject<User | null>(null);
  private isLoggedIn$ = new BehaviorSubject<boolean>(false);
  private isBrowser: boolean;
  private initialized = false;

  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  private ngZone: NgZone = inject(NgZone);
  private platformId: object = inject(PLATFORM_ID);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser && !this.initialized) {
      this.initialized = true;
      this.initializeAuth();
    }
  }

  private initializeAuth() {
    try {
      this.ngZone.runOutsideAngular(() => {
        onAuthStateChanged(this.auth, (user) => {
          this.ngZone.run(() => {
            this.currentUser$.next(user);
            this.isLoggedIn$.next(!!user);
          });
        });
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  // Observables for components
  getCurrentUser(): Observable<User | null> {
    return this.currentUser$.asObservable();
  }

  getIsLoggedIn(): Observable<boolean> {
    return this.isLoggedIn$.asObservable();
  }

  getCurrentUserValue(): User | null {
    return this.currentUser$.value;
  }

  // Register new user
  async register(email: string, password: string, displayName: string): Promise<void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      
      if (user) {
        // Update profile with display name
        await updateProfile(user, { displayName });
        
        // Save user data to Firestore
        await setDoc(doc(this.firestore, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: displayName,
          createdAt: serverTimestamp(),
          photoURL: user.photoURL || null
        });
        
        console.log('User registered and saved to Firestore:', user.uid);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Login user
  async login(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Handle Firebase auth errors
  private handleAuthError(error: any): string {
    let message = 'An error occurred';

    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'Email already in use';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email format';
        break;
      case 'auth/weak-password':
        message = 'Password too weak (min 6 characters)';
        break;
      case 'auth/user-not-found':
        message = 'User not found';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/too-many-login-attempts':
        message = 'Too many login attempts. Try again later';
        break;
    }

    return message;
  }
}