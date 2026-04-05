import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Coordinates } from 'adhan';

export interface QiblaDirection {
  angle: number;
  direction: string;
  distance?: number;
}

export interface GeolocationOptions {
  timeout?: number;
  enableHighAccuracy?: boolean;
  maximumAge?: number;
}

@Injectable({
  providedIn: 'root'
})
export class QiblaService {
  private qiblaDirection$ = new BehaviorSubject<QiblaDirection | null>(null);
  private loading$ = new BehaviorSubject<boolean>(false);
  private error$ = new BehaviorSubject<string | null>(null);
  private userLocation$ = new BehaviorSubject<{latitude: number; longitude: number} | null>(null);

  // Kaaba coordinates (accurate to high precision)
  private readonly KAABA_LAT = 21.422487;
  private readonly KAABA_LNG = 39.826194;

  getQiblaDirection(): Observable<QiblaDirection | null> {
    return this.qiblaDirection$.asObservable();
  }

  getLoading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  getError(): Observable<string | null> {
    return this.error$.asObservable();
  }

  getUserLocation(): Observable<{latitude: number; longitude: number} | null> {
    return this.userLocation$.asObservable();
  }

  /**
   * Calculate Qibla direction using accurate spherical trigonometry (Haversine formula)
   * Based on Adhan.js formula for maximum accuracy
   */
  calculateQibla(latitude: number, longitude: number): void {
    this.loading$.next(true);
    this.error$.next(null);

    try {
      // Store user location
      this.userLocation$.next({ latitude, longitude });

      // Calculate bearing using improved spherical trigonometry
      const bearing = this.calculateQiblaBearing(latitude, longitude);
      const direction = this.getCompassDirection(bearing);
      const distance = this.calculateDistance(latitude, longitude);

      this.qiblaDirection$.next({
        angle: bearing,
        direction: direction,
        distance: distance
      });

      this.loading$.next(false);
    } catch (error) {
      this.error$.next('Failed to calculate Qibla direction');
      this.loading$.next(false);
      console.error('Qibla calculation error:', error);
    }
  }

  /**
   * Calculate bearing to Kaaba using accurate spherical trigonometry
   * Formula: atan2(sin(Δλ)cos(φ2), cos(φ1)sin(φ2)−sin(φ1)cos(φ2)cos(Δλ))
   */
  private calculateQiblaBearing(latitude: number, longitude: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    const lat1 = toRad(latitude);
    const lat2 = toRad(this.KAABA_LAT);
    const dLon = toRad(this.KAABA_LNG - longitude);

    // Accurate bearing formula
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - 
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    
    let bearing = toDeg(Math.atan2(y, x));
    
    // Normalize to 0-360
    bearing = (bearing + 360) % 360;
    
    return Math.round(bearing * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate great-circle distance to Kaaba using Haversine formula
   * Returns distance in kilometers
   */
  private calculateDistance(latitude: number, longitude: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371; // Earth's radius in kilometers

    const lat1 = toRad(latitude);
    const lat2 = toRad(this.KAABA_LAT);
    const dLat = toRad(this.KAABA_LAT - latitude);
    const dLon = toRad(this.KAABA_LNG - longitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return Math.round(R * c);
  }

  /**
   * Convert bearing angle to compass direction (with 16-point precision)
   */
  private getCompassDirection(bearing: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(((bearing % 360) + 360) / 22.5) % 16;
    return directions[index];
  }

  /**
   * Request user location with timeout and high accuracy options
   * Includes automatic fallback after timeout
   */
  requestLocation(options: GeolocationOptions = {}): Promise<{latitude: number; longitude: number}> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation not supported on this browser'));
        return;
      }

      const timeoutMs = options.timeout || 15000; // 15 second default timeout
      const enableHighAccuracy = options.enableHighAccuracy !== false; // Default true
      const maximumAge = options.maximumAge || 300000; // 5 minutes cache

      let timeoutId: number;
      let completed = false;

      timeoutId = setTimeout(() => {
        if (!completed) {
          completed = true;
          reject(new Error(`Geolocation timeout after ${timeoutMs}ms. Please check location services.`));
        }
      }, timeoutMs);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!completed) {
            completed = true;
            clearTimeout(timeoutId);
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          }
        },
        (error) => {
          if (!completed) {
            completed = true;
            clearTimeout(timeoutId);
            
            // Provide helpful error messages based on error code
            let errorMsg = 'Location access denied';
            if (error.code === 1) {
              errorMsg = 'Permission denied. Enable location in settings.';
            } else if (error.code === 2) {
              errorMsg = 'Position unavailable. Try moving to open area.';
            } else if (error.code === 3) {
              errorMsg = 'Location request timeout. Please try again.';
            }
            
            reject(new Error(errorMsg));
          }
        },
        {
          enableHighAccuracy: enableHighAccuracy,
          timeout: timeoutMs,
          maximumAge: maximumAge
        }
      );
    });
  }

  /**
   * Validate and verify coordinates are within valid range
   */
  isValidCoordinate(latitude: number, longitude: number): boolean {
    return (
      typeof latitude === 'number' && 
      typeof longitude === 'number' &&
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180 &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    );
  }

  /**
   * Clear cached direction and error
   */
  clearCache(): void {
    this.qiblaDirection$.next(null);
    this.error$.next(null);
    this.userLocation$.next(null);
  }
}
