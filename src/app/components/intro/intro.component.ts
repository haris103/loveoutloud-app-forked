import { Component, computed, signal } from '@angular/core';
import { LogoComponent } from '../logo/logo.component';


@Component({
  selector: 'app-intro',
  standalone: true,
  imports: [LogoComponent],
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss']
})
export class IntroComponent {
  readonly introText = `Love Out Loud is a Christian not-for-profit charity established to provide Christian Video Scripture Lessons to children in Australian schools and beyond.`;
  
  // Responsive logo size
  readonly isMobile = signal(false);
  readonly logoSize = computed(() => this.isMobile() ? 'large' : 'xx-large');
  
  constructor() {
    this.checkViewport();
    window.addEventListener('resize', () => this.checkViewport());
  }

  private checkViewport() {
    this.isMobile.set(window.innerWidth < 768);
  }
}