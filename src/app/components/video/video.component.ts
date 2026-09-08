import { afterNextRender, booleanAttribute, Component, effect, ElementRef, EventEmitter, input, OnInit, Output, signal, ViewChild, AfterViewInit, inject } from '@angular/core';
import Player from '@vimeo/player';
import { HelperService } from 'src/app/services/helper.service';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss'],
})
export class VideoComponent {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  // Video source and attributes
  readonly source = input.required<string>();
  readonly poster = input<string | undefined>(undefined);
  readonly autoplay = input(false, { transform: booleanAttribute });
  readonly loop = input(false, { transform: booleanAttribute });
  readonly muted = input(false, { transform: booleanAttribute });
  readonly preload = input<'auto' | 'metadata' | 'none'>('auto');
  isVimeoUrl = signal(false);


  // Controls configuration
  readonly fit = input<'contain' | 'cover'>('cover');
  readonly showControls = input(true, { transform: booleanAttribute });
  readonly disableControls = input(false, { transform: booleanAttribute });
  readonly disableClickEvents = input(false, { transform: booleanAttribute });
  readonly disableDoubleClick = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  // State
  readonly isPlaying = signal(false);
  readonly currentTime = signal(0);
  readonly duration = signal(0);
  readonly isFullscreen = signal(false);
  readonly isMuted = signal(false);

  //styles
  height = signal<string>('250px');
  width = signal<string>('100%');

  // Events
  @Output() play = new EventEmitter<void>();
  @Output() pause = new EventEmitter<void>();
  @Output() ended = new EventEmitter<void>();
  @Output() timeUpdate = new EventEmitter<Event>();
  @Output() volumeChange = new EventEmitter<Event>();
  @Output() error = new EventEmitter<Event>();
  @Output() clickEvent = new EventEmitter<void>();
  @Output() doubleClickEvent = new EventEmitter<void>();

  helper = inject(HelperService)


  @ViewChild('videoContainer') videoContainer!: ElementRef<HTMLDivElement>;

  // Add these new signals
  private vimeoVideoId = signal<string | null>(null);
  private player!: Player;

  // Add player options input
  readonly playerOptions = input<any>({
    responsive: true,
    quality: 'auto',
    playsinline: true
  });

  // Add ready event
  @Output() ready = new EventEmitter<void>();

  constructor() {
    // Detect iOS platform
    // Use afterNextRender to ensure DOM is ready
    afterNextRender(() => {
      this.initializeVideo()
    });
    effect(() => {
      if (this.disableControls()) {
        // Handle disable controls logic
        this.disableIosFullscreen()
      }
    });
  }
  private disableIosFullscreen(): void {
    if (!this.helper.plt.is('ios')) return;

    const video = this.videoElement.nativeElement;

    // Prevent default fullscreen behavior
    video.addEventListener('webkitbeginfullscreen', (e) => {
      e.preventDefault();
      return false;
    });

    video.addEventListener('webkitendfullscreen', (e) => {
      e.preventDefault();
      return false;
    });

    // Disable pinch-to-zoom
    video.style.touchAction = 'none';
  }

  private initializeVideo(): void {
    const video = this.videoElement.nativeElement;
    video.preload = this.preload();

    // Set muted if autoplay is requested (browser requirement)
    if (this.autoplay()) {
      video.muted = true;
      this.isMuted.set(true);
    }

    // Add event listeners
    video.addEventListener('timeupdate', () => {
      this.currentTime.set(video.currentTime);
      this.duration.set(video.duration || 0);
      this.timeUpdate.emit(new Event('timeupdate'));
    });

    video.addEventListener('play', () => {
      this.isPlaying.set(true);
      this.play.emit();
    });

    video.addEventListener('pause', () => {
      this.isPlaying.set(false);
      this.pause.emit();
    });

    video.addEventListener('ended', () => {
      this.isPlaying.set(false);
      this.ended.emit();
    });

    video.addEventListener('volumechange', () => {
      this.isMuted.set(video.muted);
      this.volumeChange.emit(new Event('volumechange'));
    });

    video.addEventListener('error', (e) => this.error.emit(e));

    // Attempt autoplay if requested
    if (this.autoplay()) {
      this.attemptAutoplay();
    }
  }

  private async attemptAutoplay(): Promise<void> {
    try {
      const video = this.videoElement.nativeElement;
      await video.play();
    } catch (err) {
      console.warn('Autoplay was prevented:', err);
      // Fallback: mute and try again
      this.videoElement.nativeElement.muted = true;
      try {
        await this.videoElement.nativeElement.play();
      } catch (secondErr) {
        console.warn('Autoplay with mute also prevented:', secondErr);
      }
    }
  }

  // Public methods
  async togglePlay(): Promise<void> {
    if (this.disabled()) return;

    if (this.isVimeoUrl()) {  // Checking if Vimeo
      if (this.isPlaying()) {
        await this.player.pause();
      } else {
        await this.player.play();
      }
    } else {
      const video = this.videoElement.nativeElement;
      if (video.paused) {
        video.play().catch(e => this.error.emit(e));
      } else {
        video.pause();
      }
    }
  }

  seek(event: Event): void {
    if (this.disabled()) return;

    const video = this.videoElement.nativeElement;
    const target = event.target as HTMLInputElement;
    video.currentTime = parseFloat(target.value);
  }

  toggleMute(): void {
    if (this.disabled()) return;

    const video = this.videoElement.nativeElement;
    video.muted = !video.muted;
    this.isMuted.set(video.muted);
  }

  toggleFullscreen(): void {
    if (this.disabled()) return;

    const video = this.videoElement.nativeElement;
    if (!document.fullscreenElement) {
      video.requestFullscreen().catch(e => console.error(e));
    } else {
      document.exitFullscreen();
    }
  }

  // Event handlers
  handleVideoClick(): void {
    if (this.disableClickEvents()) return;

    this.clickEvent.emit();
  }

  handleDoubleClick(): void {
    if (this.disableDoubleClick()) return;

    this.doubleClickEvent.emit();
    this.toggleFullscreen();
  }

  private detectVideoSource(): void {
    const source = this.source();
    const vimeoRegex = /(?:vimeo\.com\/(?:video\/)?)(\d+)/i;
    const match = source.match(vimeoRegex);

    if (match && match[1]) {
      this.isVimeoUrl.set(true);
      this.vimeoVideoId.set(match[1]);
      this.initializeVimeoPlayer();
    } else {
      this.isVimeoUrl.set(false);
      this.initializeVideo();
    }
    console.log('Video source detected:', this.isVimeoUrl() ? 'Vimeo' : 'HTML5');
  }

  private initializeVimeoPlayer(): void {
    if (!this.vimeoVideoId() || !this.videoContainer) return;

    const options = {
      id: parseInt(this.vimeoVideoId()!, 10),
      width: this.width(),
      height: this.height(),
      autoplay: this.autoplay(),
      loop: this.loop(),
      muted: this.muted(),
      controls: this.showControls() && !this.disableControls(),
      ...this.playerOptions()
    };

    this.player = new Player(this.videoContainer.nativeElement, options);

    // Event listeners setup
    this.player.on('play', () => {
      this.isPlaying.set(true);
      this.play.emit();
    });

    // Other event listeners...
  }

  ngOnDestroy(): void {
    if (this.player) {
      this.player.destroy();
    }
  }
}