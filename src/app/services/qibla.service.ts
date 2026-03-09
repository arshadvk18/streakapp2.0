import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface QiblaDirection {
  angle: number;
  direction: string;
}

@Injectable({
  providedIn: 'root'
})
export class QiblaService {
  private qiblaDirection$ = new BehaviorSubject<QiblaDirection | null>(null);
  private loading$ = new BehaviorSubject<boolean>(false);
  private error$ = new BehaviorSubject<string | null>(null);

  getQiblaDirection(): Observable<QiblaDirection | null> {
    return this.qiblaDirection$.asObservable();
  }

  getLoading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  getError(): Observable<string | null> {
    return this.error$.asObservable();
  }

  calculateQibla(latitude: number, longitude: number): void {
    this.loading$.next(true);
    this.error$.next(null);

    try {
      // Qibla coordinates (Kaaba in Mecca)
      const qiblaLat = 21.4225; // Latitude of Kaaba
      const qiblaLng = 39.8262; // Longitude of Kaaba

      // Calculate bearing from user location to Qibla
      const bearing = this.calculateBearing(latitude, longitude, qiblaLat, qiblaLng);
      const direction = this.getCompassDirection(bearing);

      this.qiblaDirection$.next({
        angle: bearing,
        direction: direction
      });

      this.loading$.next(false);
    } catch (error) {
      this.error$.next('Failed to calculate Qibla direction');
      this.loading$.next(false);
    }
  }

  private calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    const dLon = toRad(lon2 - lon1);
    const lat1Rad = toRad(lat1);
    const lat2Rad = toRad(lat2);

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    const bearing = toDeg(Math.atan2(y, x));

    return (bearing + 360) % 360;
  }

  private getCompassDirection(bearing: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round((bearing % 360) / 22.5);
    return directions[index % 16];
  }

  requestLocation(): Promise<{latitude: number; longitude: number}> {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
            reject(error);
          }
        );
      } else {
        reject(new Error('Geolocation not supported'));
      }
    });
  }
}
