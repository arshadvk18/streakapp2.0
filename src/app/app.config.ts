import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp, getApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAIX1Pb9rSrbMstiqjkWrSjTutv_eb6OiY",
  authDomain: "islamicstreak-d7373.firebaseapp.com",
  projectId: "islamicstreak-d7373",
  storageBucket: "islamicstreak-d7373.firebasestorage.app",
  messagingSenderId: "450649406305",
  appId: "1:450649406305:web:6ef9b810d8e9e1af45e320",
  measurementId: "G-YXCSMWZ8SN"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideFirebaseApp(() => {
      const app = initializeApp(firebaseConfig);
      console.log('Firebase app initialized:', app.name);
      return app;
    }),
    provideAuth(() => {
      try {
        const auth = getAuth(getApp());
        console.log('Firebase Auth initialized');
        return auth;
      } catch (error) {
        console.error('Failed to initialize Firebase Auth:', error);
        throw error;
      }
    }),
    provideFirestore(() => {
      try {
        const firestore = getFirestore(getApp());
        console.log('Firestore initialized');
        return firestore;
      } catch (error) {
        console.error('Failed to initialize Firestore:', error);
        throw error;
      }
    }),
    provideRouter(routes)
  ]
};
