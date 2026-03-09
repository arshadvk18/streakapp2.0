import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QiblaService } from '../services/qibla.service';
import { NotificationService } from '../services/notification.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-qibla-finder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="qibla-root">

      <!-- Camera Feed -->
      <video
        #cameraFeed
        class="camera-feed"
        [class.active]="cameraAvailable"
        autoplay
        playsinline
        muted
      ></video>

      <!-- Atmospheric overlay layers -->
      <div class="overlay-gradient"></div>
      <div class="stars-layer" *ngIf="!cameraAvailable">
        <span *ngFor="let s of stars" class="star" [style]="s"></span>
      </div>

      <!-- Top HUD -->
      <header class="hud-top">
        <div class="hud-title">
          <span class="arabic">قِبْلَة</span>
          <span class="subtitle">QIBLA COMPASS</span>
        </div>
        <div class="hud-status">
          <span class="status-pill" [class.on]="hasCompass" [class.off]="!hasCompass">
            <i class="dot"></i>{{ hasCompass ? 'COMPASS' : 'NO COMPASS' }}
          </span>
          <span class="status-pill" [class.on]="cameraAvailable" [class.off]="!cameraAvailable">
            <i class="dot"></i>{{ cameraAvailable ? 'CAM ON' : 'CAM OFF' }}
          </span>
        </div>
      </header>

      <!-- Main compass area -->
      <main class="compass-stage">

        <!-- Outer glow ring -->
        <div class="glow-ring" [class.aligned]="isAligned"></div>

        <!-- Compass dial (rotates with device) -->
        <div class="compass-dial" [style.transform]="'rotate(' + compassRotation + 'deg)'">

          <!-- Tick marks -->
          <svg class="tick-svg" viewBox="0 0 320 320">
            <g *ngFor="let t of ticks">
              <line
                [attr.x1]="t.x1" [attr.y1]="t.y1"
                [attr.x2]="t.x2" [attr.y2]="t.y2"
                [attr.stroke]="t.major ? '#4ade80' : 'rgba(255,255,255,0.2)'"
                [attr.stroke-width]="t.major ? '2' : '1'"
              />
              <text *ngIf="t.label"
                [attr.x]="t.tx" [attr.y]="t.ty"
                [attr.fill]="t.label === 'N' ? '#4ade80' : 'rgba(255,255,255,0.6)'"
                text-anchor="middle" dominant-baseline="middle"
                font-size="11" font-family="'Courier New', monospace" font-weight="700"
                [attr.transform]="'rotate(' + (-t.angle) + ' ' + t.tx + ' ' + t.ty + ')'"
              >{{ t.label }}</text>
            </g>
          </svg>

          <!-- Cardinal letters on ring -->
          <div class="cardinal N">N</div>
          <div class="cardinal S">S</div>
          <div class="cardinal E">E</div>
          <div class="cardinal W">W</div>
        </div>

        <!-- Qibla pointer (independent rotation) -->
        <div class="qibla-pointer-wrap"
             [style.transform]="'rotate(' + (-compassRotation + qiblaAngle) + 'deg)'">
          <div class="qibla-needle">
            <div class="needle-glow"></div>
            <div class="needle-shaft"></div>
            <div class="needle-tip">
              <svg viewBox="0 0 24 36" fill="none">
                <path d="M12 0 L24 36 L12 28 L0 36 Z" fill="url(#ngrad)"/>
                <defs>
                  <linearGradient id="ngrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#c084fc"/>
                    <stop offset="100%" stop-color="#7c3aed"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div class="kaaba-icon">🕌</div>
          </div>
        </div>

        <!-- Center hub -->
        <div class="center-hub">
          <div class="hub-inner">
            <span class="hub-degree">{{ compassRotation | number:'1.0-0' }}°</span>
          </div>
        </div>

        <!-- Alignment arc -->
        <svg class="align-arc" viewBox="0 0 320 320" [class.aligned]="isAligned">
          <circle cx="160" cy="160" r="148"
            fill="none"
            stroke="url(#arcGrad)"
            stroke-width="3"
            stroke-dasharray="932"
            [attr.stroke-dashoffset]="arcDashOffset"
            stroke-linecap="round"
            transform="rotate(-90 160 160)"
          />
          <defs>
            <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#4ade80" stop-opacity="0"/>
              <stop offset="50%" stop-color="#4ade80"/>
              <stop offset="100%" stop-color="#a855f7"/>
            </linearGradient>
          </defs>
        </svg>

      </main>

      <!-- Info panel -->
      <div class="info-panel" [class.visible]="!!qiblaDirection">
        <div class="info-row">
          <div class="info-cell">
            <span class="info-label">BEARING</span>
            <span class="info-value bearing">{{ qiblaAngle | number:'1.1-1' }}<sup>°</sup></span>
          </div>
          <div class="info-divider"></div>
          <div class="info-cell">
            <span class="info-label">DIRECTION</span>
            <span class="info-value direction">{{ qiblaDirection?.direction || '—' }}</span>
          </div>
          <div class="info-divider"></div>
          <div class="info-cell">
            <span class="info-label">DEVIATION</span>
            <span class="info-value deviation" [class.low]="deviation < 5">{{ deviation | number:'1.1-1' }}<sup>°</sup></span>
          </div>
        </div>
        <p class="info-hint">
          <span class="hint-dot" [class.pulse]="isAligned"></span>
          {{ isAligned ? '✦ Aligned with Kaaba — Begin Prayer' : 'Rotate device to align with Qibla' }}
        </p>
      </div>

      <!-- Action bar -->
      <footer class="action-bar">
        <button class="btn-primary" (click)="requestPermissions()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
            <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/>
          </svg>
          Find Qibla
        </button>
        <button class="btn-secondary" (click)="toggleCamera()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 7l-7 5 7 5V7z"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
          {{ cameraAvailable ? 'Stop Cam' : 'AR Mode' }}
        </button>
      </footer>

      <!-- Permissions overlay -->
      <div class="permissions-overlay" *ngIf="needsPermissions" (click)="$event.stopPropagation()">
        <div class="permissions-card">
          <div class="perm-icon">🕌</div>
          <h2>Find Your Qibla</h2>
          <p>Grant the following to experience the full compass:</p>
          <ul>
            <li><span class="perm-check">✦</span> Location — precise Qibla angle</li>
            <li><span class="perm-check">✦</span> Motion — live compass heading</li>
            <li><span class="perm-check">✦</span> Camera — augmented reality mode</li>
          </ul>
          <button class="btn-grant" (click)="requestPermissions()">Grant Access</button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=IBM+Plex+Mono:wght@300;400;700&display=swap');

    :host { display: block; width: 100%; height: 100vh; }

    /* ─── Root ─── */
    .qibla-root {
      position: relative;
      width: 100%;
      height: 100vh;
      background: #030712;
      overflow: hidden;
      font-family: 'IBM Plex Mono', monospace;
      color: #fff;
    }

    /* ─── Camera ─── */
    .camera-feed {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 0.8s ease;
    }
    .camera-feed.active { opacity: 1; }

    /* ─── Overlays ─── */
    .overlay-gradient {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 80% 60% at 50% 110%, rgba(74,222,128,0.08) 0%, transparent 70%),
        radial-gradient(ellipse 60% 40% at 50% -10%, rgba(168,85,247,0.10) 0%, transparent 70%),
        linear-gradient(to bottom, rgba(3,7,18,0.7) 0%, rgba(3,7,18,0.3) 40%, rgba(3,7,18,0.85) 100%);
      pointer-events: none;
      z-index: 1;
    }

    /* Stars */
    .stars-layer {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }
    .star {
      position: absolute;
      border-radius: 50%;
      background: white;
      animation: twinkle var(--d, 3s) ease-in-out infinite var(--delay, 0s);
    }
    @keyframes twinkle {
      0%, 100% { opacity: var(--min-op, 0.1); transform: scale(1); }
      50% { opacity: var(--max-op, 0.8); transform: scale(1.3); }
    }

    /* ─── HUD Top ─── */
    .hud-top {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding: 20px 24px 0;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      z-index: 10;
    }
    .hud-title { display: flex; flex-direction: column; gap: 2px; }
    .arabic {
      font-size: 2.4rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      background: linear-gradient(135deg, #4ade80, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1;
    }
    .subtitle {
      font-family: 'Orbitron', sans-serif;
      font-size: 0.55rem;
      letter-spacing: 0.25em;
      color: rgba(255,255,255,0.35);
    }
    .hud-status { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; margin-top: 4px; }
    .status-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.6rem;
      letter-spacing: 0.12em;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(0,0,0,0.4);
      backdrop-filter: blur(8px);
    }
    .status-pill.on { border-color: rgba(74,222,128,0.4); color: #4ade80; }
    .status-pill.off { border-color: rgba(251,191,36,0.3); color: #fbbf24; }
    .dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: currentColor;
      display: inline-block;
    }
    .status-pill.on .dot { box-shadow: 0 0 6px currentColor; animation: blink 2s infinite; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

    /* ─── Compass Stage ─── */
    .compass-stage {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -54%);
      width: 320px;
      height: 320px;
      z-index: 5;
    }

    /* Glow ring */
    .glow-ring {
      position: absolute;
      inset: -12px;
      border-radius: 50%;
      border: 1px solid rgba(74,222,128,0.15);
      box-shadow:
        0 0 30px rgba(74,222,128,0.06),
        inset 0 0 30px rgba(74,222,128,0.04);
      transition: box-shadow 0.6s ease, border-color 0.6s ease;
    }
    .glow-ring.aligned {
      border-color: rgba(74,222,128,0.6);
      box-shadow:
        0 0 60px rgba(74,222,128,0.3),
        0 0 120px rgba(74,222,128,0.15),
        inset 0 0 40px rgba(74,222,128,0.1);
    }

    /* Compass dial */
    .compass-dial {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 1.5px solid rgba(255,255,255,0.08);
      background: radial-gradient(circle at 50% 50%,
        rgba(15,20,35,0.92) 0%,
        rgba(3,7,18,0.96) 100%);
      backdrop-filter: blur(20px);
      transition: transform 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      will-change: transform;
    }
    .tick-svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    /* Cardinal letters */
    .cardinal {
      position: absolute;
      font-family: 'Orbitron', sans-serif;
      font-size: 0.75rem;
      font-weight: 900;
      letter-spacing: 0.05em;
    }
    .cardinal.N { top: 14px; left: 50%; transform: translateX(-50%); color: #4ade80; text-shadow: 0 0 12px rgba(74,222,128,0.8); }
    .cardinal.S { bottom: 14px; left: 50%; transform: translateX(-50%); color: rgba(239,68,68,0.7); }
    .cardinal.E { right: 16px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.4); }
    .cardinal.W { left: 16px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.4); }

    /* Qibla pointer */
    .qibla-pointer-wrap {
      position: absolute;
      inset: 0;
      transition: transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      will-change: transform;
    }
    .qibla-needle {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translateX(-50%) translateY(-100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 50%;
      transform-origin: bottom center;
    }
    .needle-glow {
      position: absolute;
      inset: -10px;
      background: radial-gradient(ellipse 60% 100% at 50% 50%, rgba(192,132,252,0.25), transparent 70%);
      filter: blur(6px);
    }
    .needle-shaft {
      flex: 1;
      width: 2px;
      background: linear-gradient(to top, rgba(192,132,252,0.2), rgba(192,132,252,0.7));
      border-radius: 1px;
    }
    .needle-tip {
      width: 22px;
      height: 30px;
      filter: drop-shadow(0 0 8px rgba(192,132,252,0.9));
    }
    .needle-tip svg { width: 100%; height: 100%; }
    .kaaba-icon {
      position: absolute;
      bottom: -28px;
      font-size: 1.1rem;
      filter: drop-shadow(0 0 6px rgba(192,132,252,0.6));
      animation: floatIcon 3s ease-in-out infinite;
    }
    @keyframes floatIcon { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }

    /* Center hub */
    .center-hub {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 52px; height: 52px;
      border-radius: 50%;
      background: radial-gradient(circle, #0f1420 0%, #030712 100%);
      border: 1.5px solid rgba(74,222,128,0.3);
      box-shadow: 0 0 20px rgba(74,222,128,0.15), inset 0 0 10px rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20;
    }
    .hub-inner { text-align: center; }
    .hub-degree {
      font-family: 'Orbitron', sans-serif;
      font-size: 0.55rem;
      color: rgba(74,222,128,0.8);
      letter-spacing: 0;
      line-height: 1;
    }

    /* Alignment arc */
    .align-arc {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      transition: filter 0.6s ease;
    }
    .align-arc.aligned { filter: drop-shadow(0 0 8px rgba(74,222,128,0.6)); }

    /* ─── Info panel ─── */
    .info-panel {
      position: absolute;
      bottom: 90px;
      left: 16px;
      right: 16px;
      background: rgba(3,7,18,0.75);
      backdrop-filter: blur(24px);
      border: 1px solid rgba(74,222,128,0.15);
      border-radius: 16px;
      padding: 16px 20px 12px;
      opacity: 0;
      transform: translateY(16px);
      transition: opacity 0.5s ease, transform 0.5s ease;
      z-index: 10;
    }
    .info-panel.visible { opacity: 1; transform: translateY(0); }

    .info-row {
      display: flex;
      align-items: stretch;
      gap: 0;
    }
    .info-cell {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .info-divider {
      width: 1px;
      background: rgba(255,255,255,0.08);
      margin: 0 8px;
    }
    .info-label {
      font-size: 0.5rem;
      letter-spacing: 0.18em;
      color: rgba(255,255,255,0.35);
    }
    .info-value {
      font-family: 'Orbitron', sans-serif;
      font-size: 1.6rem;
      font-weight: 700;
      line-height: 1;
    }
    .info-value sup { font-size: 0.7rem; vertical-align: super; }
    .info-value.bearing { color: #a855f7; }
    .info-value.direction { color: #4ade80; font-size: 1.1rem; }
    .info-value.deviation { color: #fbbf24; }
    .info-value.deviation.low { color: #4ade80; }

    .info-hint {
      margin: 10px 0 0;
      padding-top: 10px;
      border-top: 1px solid rgba(255,255,255,0.06);
      font-size: 0.62rem;
      letter-spacing: 0.05em;
      color: rgba(255,255,255,0.45);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .hint-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: rgba(255,255,255,0.3);
      flex-shrink: 0;
    }
    .hint-dot.pulse {
      background: #4ade80;
      box-shadow: 0 0 8px #4ade80;
      animation: blink 1.2s infinite;
    }

    /* ─── Action bar ─── */
    .action-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 0 16px 28px;
      display: flex;
      gap: 10px;
      z-index: 10;
    }
    .btn-primary, .btn-secondary {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 16px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      font-family: 'Orbitron', sans-serif;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      transition: all 0.2s ease;
    }
    .btn-primary svg, .btn-secondary svg { width: 16px; height: 16px; }
    .btn-primary {
      background: linear-gradient(135deg, #16a34a, #4ade80);
      color: #030712;
      box-shadow: 0 4px 24px rgba(74,222,128,0.3);
    }
    .btn-primary:active { transform: scale(0.97); box-shadow: 0 2px 12px rgba(74,222,128,0.2); }
    .btn-secondary {
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.75);
      border: 1px solid rgba(255,255,255,0.1);
      backdrop-filter: blur(12px);
    }
    .btn-secondary:active { transform: scale(0.97); background: rgba(255,255,255,0.1); }

    /* ─── Permissions overlay ─── */
    .permissions-overlay {
      position: absolute;
      inset: 0;
      background: rgba(3,7,18,0.92);
      backdrop-filter: blur(20px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 24px;
    }
    .permissions-card {
      background: rgba(15,20,35,0.9);
      border: 1px solid rgba(74,222,128,0.2);
      border-radius: 24px;
      padding: 36px 28px;
      text-align: center;
      max-width: 320px;
      width: 100%;
      box-shadow: 0 0 80px rgba(74,222,128,0.08);
    }
    .perm-icon { font-size: 3rem; margin-bottom: 16px; display: block; }
    .permissions-card h2 {
      font-family: 'Orbitron', sans-serif;
      font-size: 1.15rem;
      font-weight: 900;
      margin: 0 0 10px;
      background: linear-gradient(135deg, #4ade80, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .permissions-card p {
      font-size: 0.72rem;
      color: rgba(255,255,255,0.45);
      margin: 0 0 20px;
      letter-spacing: 0.04em;
    }
    .permissions-card ul {
      list-style: none;
      margin: 0 0 24px;
      padding: 0;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .permissions-card li {
      font-size: 0.72rem;
      color: rgba(255,255,255,0.6);
      display: flex;
      align-items: center;
      gap: 10px;
      border-left: 1px solid rgba(74,222,128,0.2);
      padding-left: 12px;
    }
    .perm-check { color: #4ade80; font-size: 0.8rem; }
    .btn-grant {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #16a34a, #4ade80);
      border: none;
      border-radius: 12px;
      color: #030712;
      font-family: 'Orbitron', sans-serif;
      font-size: 0.7rem;
      font-weight: 900;
      letter-spacing: 0.1em;
      cursor: pointer;
      box-shadow: 0 4px 24px rgba(74,222,128,0.35);
      transition: all 0.2s ease;
    }
    .btn-grant:active { transform: scale(0.98); }
  `]
})
export class QiblaFinderComponent implements OnInit, OnDestroy {
  @ViewChild('cameraFeed') cameraFeed!: ElementRef<HTMLVideoElement>;

  private qiblaService = inject(QiblaService);
  private notificationService = inject(NotificationService);
  private ngZone = inject(NgZone);
  private destroy$ = new Subject<void>();

  qiblaDirection: any = null;
  qiblaAngle = 0;
  compassRotation = 0;
  hasCompass = false;
  cameraAvailable = false;
  needsPermissions = true;

  get deviation(): number {
    const diff = Math.abs(((this.compassRotation - this.qiblaAngle) % 360 + 360) % 360);
    return diff > 180 ? 360 - diff : diff;
  }

  get isAligned(): boolean {
    return this.deviation < 5 && !!this.qiblaDirection;
  }

  get arcDashOffset(): number {
    // Progress arc based on how far off alignment we are (max offset = 932 = full circle)
    const pct = Math.min(this.deviation / 180, 1);
    return 932 * pct;
  }

  // Pre-computed tick marks for the SVG
  ticks: any[] = [];
  stars: string[] = [];

  private mediaStream: MediaStream | null = null;

  ngOnInit(): void {
    this.buildTicks();
    this.buildStars();

    this.qiblaService.getQiblaDirection()
      .pipe(takeUntil(this.destroy$))
      .subscribe(direction => {
        this.qiblaDirection = direction;
        if (direction) this.qiblaAngle = direction.angle;
      });

    this.initializeCompass();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopCamera();
    window.removeEventListener('deviceorientation', this.onOrientation);
  }

  private buildTicks(): void {
    const cx = 160, cy = 160, outerR = 148, innerMajor = 134, innerMinor = 140;
    const labels: Record<number, string> = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };

    for (let deg = 0; deg < 360; deg += 5) {
      const rad = (deg - 90) * Math.PI / 180;
      const major = deg % 30 === 0;
      const inner = major ? innerMajor : innerMinor;
      this.ticks.push({
        x1: cx + outerR * Math.cos(rad),
        y1: cy + outerR * Math.sin(rad),
        x2: cx + inner * Math.cos(rad),
        y2: cy + inner * Math.sin(rad),
        major,
        label: labels[deg] || null,
        angle: deg,
        tx: cx + (inner - 14) * Math.cos(rad),
        ty: cy + (inner - 14) * Math.sin(rad),
      });
    }
  }

  private buildStars(): void {
    this.stars = Array.from({ length: 80 }, () => {
      const size = Math.random() * 2 + 0.5;
      const delay = -(Math.random() * 4);
      const dur = 2 + Math.random() * 3;
      const minOp = 0.05 + Math.random() * 0.1;
      const maxOp = 0.4 + Math.random() * 0.5;
      return `left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${size}px;height:${size}px;--d:${dur}s;--delay:${delay}s;--min-op:${minOp};--max-op:${maxOp}`;
    });
  }

  private onOrientation = (event: DeviceOrientationEvent) => {
    if (event.alpha !== null) {
      this.ngZone.run(() => {
        this.hasCompass = true;
        this.compassRotation = Math.round(360 - (event.alpha || 0));
      });
    }
  };

  private initializeCompass(): void {
    if ('DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', this.onOrientation, { passive: true });
    }

    if ('requestPermission' in (window as any).DeviceOrientationEvent) {
      this.needsPermissions = true;
    } else {
      this.needsPermissions = false;
      this.requestLocationAndQibla();
    }
  }

  async requestPermissions(): Promise<void> {
    try {
      if ('requestPermission' in (window as any).DeviceOrientationEvent) {
        const perm = await (window.DeviceOrientationEvent as any).requestPermission();
        if (perm === 'granted') {
          this.needsPermissions = false;
          this.requestLocationAndQibla();
        }
      } else {
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
      this.notificationService.success('✦ Qibla direction found');
    } catch (error: any) {
      this.notificationService.error(error?.message || 'Location access denied');
    }
  }

  async toggleCamera(): Promise<void> {
    this.cameraAvailable ? this.stopCamera() : await this.startCamera();
  }

  private async startCamera(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      if (this.cameraFeed?.nativeElement) {
        this.cameraFeed.nativeElement.srcObject = this.mediaStream;
        await this.cameraFeed.nativeElement.play();
        this.cameraAvailable = true;
      }
    } catch (error: any) {
      this.notificationService.error(`Camera denied: ${error?.message}`);
      this.cameraAvailable = false;
    }
  }

  private stopCamera(): void {
    this.mediaStream?.getTracks().forEach(t => t.stop());
    this.mediaStream = null;
    this.cameraAvailable = false;
  }
}