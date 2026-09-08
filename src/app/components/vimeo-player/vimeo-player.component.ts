import { 
  afterNextRender, 
  booleanAttribute, 
  ChangeDetectorRef,
  Component, 
  effect, 
  ElementRef, 
  EventEmitter, 
  input, 
  OnDestroy, 
  OnInit, 
  Output, 
  signal, 
  ViewChild 
} from '@angular/core';
import Player from '@vimeo/player';

@Component({
  selector: 'app-vimeo-player',
  templateUrl: './vimeo-player.component.html',
  styleUrls: ['./vimeo-player.component.scss'],
})
export class VimeoPlayerComponent implements OnDestroy {
  @ViewChild('videoContainer') videoContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;

  // Inputs
  readonly source = input.required<string>();
  readonly poster = input<string | undefined>();
  readonly autoplay = input(false, { transform: booleanAttribute });
  readonly loop = input(false, { transform: booleanAttribute });
  readonly muted = input(false, { transform: booleanAttribute });
  readonly preload = input<'auto' | 'metadata' | 'none'>('auto');
  readonly fit = input<'contain' | 'cover'>('cover');
  readonly showControls = input(true, { transform: booleanAttribute });
  readonly disableControls = input(false, { transform: booleanAttribute });
  readonly disableClickEvents = input(false, { transform: booleanAttribute });
  readonly disableDoubleClick = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly playerOptions = input<any>({
    responsive: true,
    quality: 'auto',
    playsinline: true
  });

  // Outputs
  @Output() play = new EventEmitter<void>();
  @Output() pause = new EventEmitter<void>();
  @Output() ended = new EventEmitter<void>();
  @Output() timeUpdate = new EventEmitter<Event>();
  @Output() volumeChange = new EventEmitter<Event>();
  @Output() error = new EventEmitter<Event>();
  @Output() clickEvent = new EventEmitter<void>();
  @Output() doubleClickEvent = new EventEmitter<void>();
  @Output() ready = new EventEmitter<void>();

  // State signals
  readonly isVimeoUrl = signal(true);
  readonly isPlaying = signal(false);
  readonly currentTime = signal(0);
  readonly duration = signal(0);
  readonly isFullscreen = signal(false);
  readonly isMuted = signal(false);
  readonly height = signal<string>('250px');
  readonly width = signal<string>('100%');

  // Private state
  private vimeoVideoId = signal<string | null>(null);
  private player: Player | null = null;
  private isInitialized = signal(false);
  private lastInitializedSource = signal<string | null>(null);
  private intersectionObserver: IntersectionObserver | null = null;

  constructor(private cdr: ChangeDetectorRef) {
    // Initialize only when component is visible
    afterNextRender(() => {
      this.setupIntersectionObserver();
    });

    // Watch for source changes
    effect(() => {
      const source = this.source();
      if (source !== this.lastInitializedSource() && this.isInitialized()) {
        this.initializePlayer();
      }
    }, { allowSignalWrites: true });
  }

  private setupIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined') {
      this.initializePlayer();
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !this.isInitialized()) {
          this.initializePlayer();
          this.intersectionObserver?.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (this.videoContainer?.nativeElement) {
      this.intersectionObserver.observe(this.videoContainer.nativeElement);
    }
  }

  private initializePlayer(): void {
    const source = this.source();
    if (!source) return;

    this.lastInitializedSource.set(source);
    this.destroyPlayer();

    const vimeoId = this.extractVimeoId(source);
    this.vimeoVideoId.set(vimeoId);
    this.isVimeoUrl.set(!!vimeoId);

    if (vimeoId) {
      this.initializeVimeoPlayer();
    } else if (this.videoElement?.nativeElement) {
      this.initializeHtml5Video();
    }

    this.isInitialized.set(true);
    this.cdr.markForCheck();
  }

  private extractVimeoId(url: string): string | null {
    if (!url) return null;
    const vimeoRegex = /(?:vimeo\.com\/(?:video\/)?)(\d+)/i;
    const match = url.match(vimeoRegex);
    return match ? match[1] : null;
  }

  private initializeVimeoPlayer(): void {
    const vimeoId = this.vimeoVideoId();
    if (!vimeoId || !this.videoContainer?.nativeElement) return;

    try {
      const options = {
        id: parseInt(vimeoId, 10),
        width: '100%',
        height: this.height(),
        autoplay: this.autoplay(),
        loop: this.loop(),
        muted: this.muted(),
        controls: this.showControls() && !this.disableControls(),
        ...this.playerOptions()
      };

      this.player = new Player(this.videoContainer.nativeElement, options);

      this.player.on('play', () => {
        this.isPlaying.set(true);
        this.play.emit();
        this.cdr.detectChanges();
      });

      this.player.on('pause', () => {
        this.isPlaying.set(false);
        this.pause.emit();
        this.cdr.detectChanges();
      });

      this.player.on('ended', () => {
        this.isPlaying.set(false);
        this.ended.emit();
        this.cdr.detectChanges();
      });

      this.player.on('timeupdate', (data: { seconds: number; duration: number }) => {
        this.currentTime.set(data.seconds);
        this.duration.set(data.duration);
        this.timeUpdate.emit(new Event('timeupdate'));
        this.cdr.detectChanges();
      });

      this.player.on('volumechange', (data: { volume: number }) => {
        this.isMuted.set(data.volume === 0);
        this.volumeChange.emit(new Event('volumechange'));
        this.cdr.detectChanges();
      });

      this.player.on('error', (error: any) => {
        console.error('Vimeo player error:', error);
        this.error.emit(new Event('error'));
        this.cdr.detectChanges();
      });

      this.player.on('loaded', () => {
        this.ready.emit();
        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error('Failed to initialize Vimeo player:', error);
      this.error.emit(new Event('error'));
      this.cdr.detectChanges();
    }
  }

  private initializeHtml5Video(): void {
    const video = this.videoElement?.nativeElement;
    if (!video) return;

    video.preload = this.preload();
    if (this.autoplay()) {
      video.muted = true;
      this.isMuted.set(true);
      this.attemptAutoplay(video);
    }

    this.ready.emit();
  }

  private async attemptAutoplay(video: HTMLVideoElement): Promise<void> {
    try {
      await video.play();
    } catch (err) {
      console.warn('Autoplay prevented:', err);
      video.muted = true;
      try {
        await video.play();
      } catch (secondErr) {
        console.warn('Autoplay with mute prevented:', secondErr);
      }
    }
  }

  private destroyPlayer(): void {
    if (this.player) {
      try {
        this.player.off('play');
        this.player.off('pause');
        this.player.off('ended');
        this.player.off('timeupdate');
        this.player.off('volumechange');
        this.player.off('error');
        this.player.destroy();
      } catch (error) {
        console.error('Error destroying Vimeo player:', error);
      } finally {
        this.player = null;
      }
    }

    if (this.videoElement?.nativeElement) {
      const video = this.videoElement.nativeElement;
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
  }

  updateTime(event: Event): void {
    const video = event.target as HTMLVideoElement;
    this.currentTime.set(video.currentTime);
    this.duration.set(video.duration || 0);
    this.timeUpdate.emit(event);
    this.cdr.detectChanges();
  }

  async togglePlay(): Promise<void> {
    if (this.disabled()) return;

    if (this.isVimeoUrl()) {
      try {
        if (this.isPlaying()) {
          await this.player?.pause();
        } else {
          await this.player?.play();
        }
      } catch (error) {
        console.error('Error toggling Vimeo player:', error);
        this.error.emit(new Event('error'));
        this.cdr.detectChanges();
      }
    } else if (this.videoElement?.nativeElement) {
      const video = this.videoElement.nativeElement;
      try {
        if (video.paused) {
          await video.play();
        } else {
          video.pause();
        }
      } catch (error) {
        console.error('Error toggling HTML5 video:', error);
        this.error.emit(new Event('error'));
        this.cdr.detectChanges();
      }
    }
  }

  seek(event: Event): void {
    if (this.disabled()) return;

    const target = event.target as HTMLInputElement;
    const time = parseFloat(target.value);

    if (this.isVimeoUrl()) {
      this.player?.setCurrentTime(time).catch(error => {
        console.error('Error seeking Vimeo player:', error);
        this.error.emit(new Event('error'));
        this.cdr.detectChanges();
      });
    } else if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.currentTime = time;
    }
  }

  toggleMute(): void {
    if (this.disabled()) return;

    if (this.isVimeoUrl()) {
      this.player?.getVolume().then(volume => {
        const newVolume = volume > 0 ? 0 : 1;
        this.player?.setVolume(newVolume).catch(error => {
          console.error('Error muting Vimeo player:', error);
          this.error.emit(new Event('error'));
          this.cdr.detectChanges();
        });
      });
    } else if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.muted = !this.videoElement.nativeElement.muted;
    }
  }

  toggleFullscreen(): void {
    if (this.disabled()) return;

    const element = this.videoContainer?.nativeElement || this.videoElement?.nativeElement;
    if (!element) return;

    if (!document.fullscreenElement) {
      element.requestFullscreen().catch(e => console.error('Error entering fullscreen:', e));
    } else {
      document.exitFullscreen();
    }
    this.isFullscreen.set(!!document.fullscreenElement);
    this.cdr.detectChanges();
  }

  handleVideoClick(): void {
    if (this.disableClickEvents()) return;
    this.clickEvent.emit();
  }

  handleDoubleClick(): void {
    if (this.disableDoubleClick()) return;
    this.doubleClickEvent.emit();
    this.toggleFullscreen();
  }

  ngOnDestroy(): void {
    this.intersectionObserver?.disconnect();
    this.destroyPlayer();
  }
}