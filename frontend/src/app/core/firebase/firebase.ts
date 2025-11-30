import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { environment } from '../config/environment';

let authInstance: Auth | null = null;
let initialised = false;

export function getFirebaseAuth(): Auth | null {
  if (authInstance) return authInstance;

  if (!environment.firebase.apiKey) {
    console.warn('[Firebase] Missing configuration. Update environment.firebase.*');
    return null;
  }

  if (!initialised) {
    const app = initializeApp(environment.firebase);
    initialised = true;

    if (typeof window !== 'undefined' && environment.firebase.measurementId) {
      import('firebase/analytics')
        .then(({ getAnalytics }) => getAnalytics(app))
        .catch((error) => console.warn('Analytics init failed', error));
    }
  }

  authInstance = getAuth();
  return authInstance;
}