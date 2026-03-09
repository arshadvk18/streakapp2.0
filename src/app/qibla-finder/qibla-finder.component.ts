import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QiblaService } from '../services/qibla.service';
import { NotificationService } from '../services/notification.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-qibla-finder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full h-screen bg-black text-white">
      <!-- Camera Feed -->
      <video 
        #cameraFeed 
        class="absolute w-full h-full object-cover"
        [style.display]="cameraAvailable ? 'block' : 'none'"
      ></video>

      <!-- Fallback Background -->
      <div 
        *ngIf="!cameraAvailable"
        class="absolute w-full h-full bg-gradient-to-b from-gray-900 via-gray-800 to-black"
      ></div>

      <!-- Dark Overlay -->
      <div class="absolute w-full h-full bg-black/30"></div>

      <!-- Main Content -->
      <div class="relative w-full h-full flex flex-col items-center justify-center p-4">
        <!-- Header -->
        <div class="absolute top-6 left-6 right-6 z-10">
          <h1 class="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">قبلة</h1>
          <p class="text-sm text-gray-300">Qibla Finder</p>
        </div>

        <!-- Status Info -->
        <div class="absolute top-6 right-6 text-right text-sm text-gray-300 drop-shadow-lg">
          <p *ngIf="hasCompass" class="text-green-400">🧭 Compass: ON</p>
          <p *ngIf="!hasCompass" class="text-yellow-400">⚠️ No Compass</p>
          <p *ngIf="cameraAvailable" class="text-green-400">📷 Camera: ON</p>
          <p *ngIf="!cameraAvailable" class="text-yellow-400">📷 Camera: OFF</p>
        </div>

        <!-- Main Compass Circle -->
        <div class="relative flex items-center justify-center">
          <!-- Compass Container -->
          <div class="relative w-80 h-80 rounded-full border-4 border-green-500 shadow-2xl"
               [style.transform]="'rotate(' + compassRotation + 'deg)'"
               [class.opacity-70]="!hasCompass">
            
            <!-- Compass Background -->
            <div class="absolute inset-0 rounded-full bg-black/60 backdrop-blur-sm"></div>

            <!-- Cardinal Points -->
            <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-2xl font-bold text-green-400">N</div>
            <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-2xl font-bold text-red-500">S</div>
            <div class="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl font-bold text-gray-400">W</div>
            <div class="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl font-bold text-gray-400">E</div>

            <!-- Degree Marks -->
            <div *ngFor="let mark of [0,30,60,90,120,150,180,210,240,270,300,330]"
                 class="absolute w-0.5 h-2 bg-gray-400 left-1/2 top-2 origin-bottom"
                 [style.transform]="'translateX(-50%) rotate(' + mark + 'deg)'">
            </div>

            <!-- Qibla Pointer (counter-rotate to stay fixed) -->
            <div class="absolute left-1/2 top-1/2 flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2"
                 [style.transform]="'translateX(-50%) translateY(-50%) rotate(' + (-compassRotation + qiblaAngle) + 'deg)'">
              <!-- Arrow to Qibla -->
              <div class="w-1 h-32 bg-gradient-to-t from-fuchsia-500 to-fuchsia-400 rounded-full shadow-lg drop-shadow-2xl"></div>
              <!-- Qibla Icon -->
              <div class="text-3xl mb-2 animate-pulse">🕌</div>
            </div>

            <!-- Center Point -->
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-green-400 rounded-full shadow-lg"></div>
          </div>

          <!-- User Position Indicator -->
          <div class="absolute bottom-20 text-center">
            <div class="text-red-500 text-2xl animate-bounce">📍</div>
            <p class="text-sm text-gray-300 mt-2">You are here</p>
          </div>
        </div>

        <!-- Qibla Info Panel -->
        <div *ngIf="qiblaDirection" class="absolute bottom-6 left-6 right-6 bg-black/70 backdrop-blur-md rounded-lg p-4 border border-green-500">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs text-gray-400 mb-1">Direction</p>
              <p class="text-2xl font-bold text-green-400">{{ qiblaDirection.direction }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400 mb-1">Bearing</p>
              <p class="text-2xl font-bold text-fuchsia-400">{{ qiblaAngle | number : '1.0-1' }}°</p>
            </div>
          </div>
          <div class="mt-3 text-xs text-gray-300 border-t border-gray-600 pt-2">
            <p>📍 Face {{ qiblaDirection.direction }} to pray towards the Kaaba</p>
          </div>
        </div>

        <!-- Controls -->
        <div class="absolute top-24 left-6 right-6 flex gap-2">
          <button 
            (click)="requestPermissions()"
            class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
          >
            📍 Find Qibla
          </button>
          <button 
            (click)="toggleCamera()"
            [class]="'px-4 py-2 rounded-lg font-semibold transition ' + (cameraAvailable ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700')"
          >
            {{ cameraAvailable ? '🎥 Stop' : '📷 Start' }}
          </button>
        </div>

        <!-- No Compass Warning -->
        <div *ngIf="!hasCompass" class="absolute top-1/3 text-center px-4">
          <p class="text-yellow-400 text-lg font-semibold mb-2">⚠️ Compass Not Available</p>
          <p class="text-gray-300 text-sm">Your device doesn't have a compass sensor. Using static mode.</p>
        </div>

        <!-- Permissions Needed -->
        <div *ngIf="needsPermissions" class="absolute inset-0 bg-black/80 flex items-center justify-center z-50 rounded-lg">
          <div class="bg-gray-900 border border-green-500 rounded-2xl p-8 text-center max-w-sm">
            <p class="text-xl font-bold mb-4">📍 Permissions Required</p>
            <p class="text-gray-300 mb-6">This app needs access to:</p>
            <ul class="text-left text-sm text-gray-300 mb-6 space-y-2">
              <li>✅ Location (for accurate Qibla direction)</li>
              <li>✅ Device Motion (for compass)</li>
              <li>✅ Camera (optional, for immersive experience)</li>
            </ul>
            <button 
              (click)="requestPermissions()"
              class="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
            >
              ✅ Grant Permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      width: 100%;
      overflow: hidden;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  `]
})
export class QiblaFinderComponent implements OnInit, OnDestroy {
  @ViewChild('cameraFeed') cameraFeed!: ElementRef<HTMLVideoElement>;

  private qiblaService = inject(QiblaService);
  private notificationService = inject(NotificationService);
  private destroy$ = new Subject<void>();

  qiblaDirection: any = null;
  qiblaAngle = 0;
  compassRotation = 0;
  hasCompass = false;
  cameraAvailable = false;
  needsPermissions = true;
  
  private mediaStream: MediaStream | null = null;

  ngOnInit(): void {
    this.qiblaService.getQiblaDirection()
      .pipe(takeUntil(this.destroy$))
      .subscribe(direction => {
        this.qiblaDirection = direction;
        if (direction) {
          this.qiblaAngle = direction.angle;
        }
      });

    this.initializeCompass();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopCamera();
  }

  private initializeCompass(): void {
    // Check for device orientation support
    if ('DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', (event: DeviceOrientationEvent) => {
        if (event.alpha !== null) {
          this.hasCompass = true;
          this.compassRotation = 360 - (event.alpha || 0);
        }
      });
    }

    // Request permission for iOS 13+
    if ('requestPermission' in window.DeviceOrientationEvent) {
      this.needsPermissions = true;
    } else {
      this.needsPermissions = false;
      this.requestLocationAndQibla();
    }
  }

  async requestPermissions(): Promise<void> {
    try {
      // Request device orientation permission (iOS 13+)
      if ('requestPermission' in window.DeviceOrientationEvent) {
        const permission = await (window.DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          this.needsPermissions = false;
          this.requestLocationAndQibla();
        }
      } else {
        // Non-iOS devices
        this.needsPermissions = false;
        this.requestLocationAndQibla();
      }
    } catch (error) {
      console.error('Permission error:', error);
      this.notificationService.error('Permission denied');
    }
  }

  private async requestLocationAndQibla(): Promise<void> {
    try {
      const location = await this.qiblaService.requestLocation();
      this.qiblaService.calculateQibla(location.latitude, location.longitude);
      this.notificationService.success('✅ Qibla direction found!');
    } catch (error: any) {
      this.notificationService.error(`❌ ${error?.message || 'Location access denied'}`);
    }
  }

  async toggleCamera(): Promise<void> {
    if (this.cameraAvailable) {
      this.stopCamera();
    } else {
      await this.startCamera();
    }
  }

  private async startCamera(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (this.cameraFeed) {
        this.cameraFeed.nativeElement.srcObject = this.mediaStream;
        this.cameraAvailable = true;
        this.notificationService.success('📷 Camera enabled');
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      this.notificationService.error(`📷 Camera access denied: ${error?.message}`);
      this.cameraAvailable = false;
    }
  }

  private stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
      this.cameraAvailable = false;
      this.notificationService.info('📷 Camera stopped');
    }
  }
}

