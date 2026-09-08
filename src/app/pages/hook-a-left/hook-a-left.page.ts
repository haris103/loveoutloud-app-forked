import { Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonButtons, IonLabel, IonList, IonItem, IonNote, IonSearchbar, IonMenuButton, MenuController, IonTitle } from '@ionic/angular/standalone';
import $ from 'jquery';
import { HelperService } from 'src/app/services/helper.service';
import { ApiService } from 'src/app/services/api.service';
import { ContentPage } from './content/content.page';
import * as Hammer from 'hammerjs';

@Component({
  selector: 'app-hook-a-left',
  templateUrl: './hook-a-left.page.html',
  styleUrls: ['./hook-a-left.page.scss'],
  standalone: true,
  imports: [IonSearchbar, IonNote, IonItem, IonList, IonLabel, IonButtons, IonContent, IonHeader, IonToolbar, IonMenuButton, FormsModule, IonTitle]
})
export class HookALeftPage implements OnInit, OnDestroy {
  events: IEvent[] = []
  // Enhanced zoom properties
  private scale = 1;
  private lastScale = 1;
  private posX = 0;
  private posY = 0;
  private lastPosX = 0;
  private lastPosY = 0;
  private maxScale = 5; // Increased max scale for better zoom
  private minScale = 1;
  private initialDistance = 0;
  private initialScale = 1;
  private initialCenterX = 0;
  private initialCenterY = 0;
  private transformString = '';

  @ViewChild('miniScreen') miniScreen!: ElementRef;
  @ViewChild('zoomImage') zoomImage!: ElementRef;
  private hammerManager!: HammerManager;

  isLoading: boolean = true;
  searchText: string = ''
  filteredKeys: IEvent[] = []

  // Add this to your component
  hotspots = [
    { x: 100, y: 50, width: 30, height: 30, eventName: "Spiritual Kingdom of God" },
    { x: 200, y: 120, width: 30, height: 30, eventName: "Garden of Eden" },
    { x: 300, y: 80, width: 30, height: 30, eventName: "Spiritual Man" },
    // Add all other hotspots with their coordinates
    // Measure these from your image editor
  ];

  constructor(public helper: HelperService,
    private api: ApiService,
    private renderer: Renderer2
  ) {
    // global side menu remains available on other pages; hook-specific menu is controlled locally
  }

  ngOnInit() {
    this.loadInitialData();
  }



  async loadInitialData() {
    try {
      this.isLoading = true;

      // Try to use existing token first
      let token = this.helper.getHalToken();

      // If no token exists, login first
      if (!token) {
        token = await this.handleLogin();
      }

      // Try to get events with current token
      try {
        this.events = await this.api.getAllEvents();
      } catch (error) {
        // If error might be due to expired token, try refreshing token once
        if (this.isTokenExpiredError(error)) {
          token = await this.handleLogin();
          this.events = await this.api.getAllEvents(); // Retry with new token
        } else {
          throw error; // Re-throw if it's not a token expiration error
        }
      }

    } catch (err: any) {
      this.helper.alertController(err);
    } finally {
      this.isLoading = false;
    }
  }

  private async handleLogin(): Promise<string> {
    try {
      const token: string = await this.api.loginHal() as string;
      this.helper.setHalToken(token); // Store the new token
      return token;
    } catch (err: any) {
      throw new Error('Login failed: ' + err.message);
    }
  }

  private isTokenExpiredError(error: any): boolean {
    // Check if error is due to expired token
    // This might need adjustment based on your actual API error responses
    return error.status === 401 ||
      error.message?.includes('token') ||
      error.message?.includes('unauthorized');
  }

  openExternal(url: string) {
    try {
      window.open(url, '_blank');
    } catch (err) {
      console.error('Unable to open URL', url, err);
    }
  }

  onSearch() {
    const searchText = this.searchText.trim().toLowerCase();
    this.filteredKeys = searchText
      ? this.events.filter(({ eventName }) => eventName.toLowerCase().includes(searchText))
      : [];
  }


  viewContent(item: any) {
    this.helper.presentModal(ContentPage, item)
  }

  viewPrivacyPolicy() {
    window.open('https://apps.loveoutloudoz.com/Home/PrivacyPolicy', '_blank')
  }

  handleImageClick(event: MouseEvent, param: any) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if click is within the specific area (395-400, 20-25)
    if (x >= 395 && x <= 400 && y >= 20 && y <= 25) {
      console.log(`Spiritual Kingdom of God clicked at (${x}, ${y})`);
      return; // Exit early since we handled the click
    }

    // Default image click behavior
    console.log(`Regular image click at (${x}, ${y})`);
    // ... other image click logic
  }

  handleHotspotClick(eventName: string) {
    const matchingEvent = this.events.find(e => e.eventName === eventName);
    console.log(`Hotspot clicked: ${eventName}`);
    if (matchingEvent) {
      this.viewContent(matchingEvent);
    }
  }

  ngAfterViewInit() {
    this.setupGestureControl()
  }

  private setupGestureControl() {
    const element = this.miniScreen.nativeElement;
    const imgElement = this.zoomImage.nativeElement;

    // Clear any existing Hammer instance
    if (this.hammerManager) {
      this.hammerManager.destroy();
    }

    // Create Hammer Manager with correct event names
    this.hammerManager = new Hammer.Manager(element);

    // Add recognizers with proper configuration
    const pan = new Hammer.Pan({
      direction: Hammer.DIRECTION_ALL,
      threshold: 0,
      pointers: 0
    });

    const pinch = new Hammer.Pinch({
      enable: true,
      threshold: 0.1
    });

    const doubleTap = new Hammer.Tap({
      event: 'doubletap',
      taps: 2,
      interval: 300,
      threshold: 9,
      posThreshold: 10
    });

    this.hammerManager.add([pan, pinch, doubleTap]);

    // Set recognizer dependencies
    pinch.recognizeWith(pan);
    pan.requireFailure(doubleTap);

    // Set initial styles
    this.renderer.setStyle(imgElement, 'transform', 'translate(0px, 0px) scale(1)');
    this.renderer.setStyle(imgElement, 'transform-origin', '0 0');
    this.renderer.setStyle(imgElement, 'will-change', 'transform');
    this.renderer.setStyle(imgElement, 'transition', 'transform 0.2s cubic-bezier(0.33, 1, 0.68, 1)');

    // State variables
    let isPinching = false;
    let initialFocalPoint = { x: 0, y: 0 };

    // Correct event names for pinch gestures
    this.hammerManager.on('pinchstart', (ev) => {
      isPinching = true;
      this.initialScale = this.scale;
      this.renderer.setStyle(imgElement, 'transition', 'none');

      const containerRect = element.getBoundingClientRect();
      const imgRect = imgElement.getBoundingClientRect();

      initialFocalPoint = {
        x: (ev.center.x - containerRect.left - imgRect.left) / this.scale,
        y: (ev.center.y - containerRect.top - imgRect.top) / this.scale
      };
    });

    this.hammerManager.on('pinchmove', (ev) => {
      const scaleFactor = Math.pow(ev.scale, 0.7);
      const newScale = Math.max(
        this.minScale,
        Math.min(this.initialScale * scaleFactor, this.maxScale)
      );

      const scaleChange = newScale / this.scale;

      if (Math.abs(newScale - this.scale) > 0.005) {
        this.scale = newScale;
        this.posX -= (initialFocalPoint.x * (scaleChange - 1)) * this.scale;
        this.posY -= (initialFocalPoint.y * (scaleChange - 1)) * this.scale;

        this.applyTransformWithBoundaries();
      }
    });

    // CORRECT EVENT NAMES:
    this.hammerManager.on('pinchend', () => {
      isPinching = false;
      this.finalizeGesture();
    });

    this.hammerManager.on('pinchcancel', () => {
      isPinching = false;
      this.finalizeGesture();
    });

    // Pan gesture handlers
    this.hammerManager.on('panstart', (ev) => {
      if (this.scale <= 1 || isPinching) return;
      this.renderer.setStyle(imgElement, 'transition', 'none');
    });

    this.hammerManager.on('panmove', (ev) => {
      if (this.scale <= 1 || isPinching) return;
      this.posX = this.lastPosX + ev.deltaX;
      this.posY = this.lastPosY + ev.deltaY;
      this.applyTransformWithBoundaries();
    });

    this.hammerManager.on('panend', () => {
      if (isPinching) return;
      this.finalizeGesture();
    });

    this.hammerManager.on('pancancel', () => {
      if (isPinching) return;
      this.finalizeGesture();
    });

    // Double tap handler
    this.hammerManager.on('doubletap', (ev) => {
      const containerRect = element.getBoundingClientRect();
      const imgRect = imgElement.getBoundingClientRect();

      const tapX = (ev.center.x - containerRect.left - imgRect.left) / this.scale;
      const tapY = (ev.center.y - containerRect.top - imgRect.top) / this.scale;

      if (this.scale > this.minScale) {
        this.resetImage();
      } else {
        this.scale = this.maxScale * 0.75;
        this.posX = (containerRect.width / 2 / this.scale) - tapX;
        this.posY = (containerRect.height / 2 / this.scale) - tapY;
        this.applyTransformWithBoundaries(true);
      }

      this.lastScale = this.scale;
      this.lastPosX = this.posX;
      this.lastPosY = this.posY;
    });
  }

  private finalizeGesture() {
    this.lastScale = this.scale;
    this.lastPosX = this.posX;
    this.lastPosY = this.posY;

    if (this.scale < this.minScale + 0.1) {
      this.resetImage();
    } else {
      this.applyTransformWithBoundaries(true);
    }
  }

  private applyTransformWithBoundaries(enableTransition = false) {
    const imgElement = this.zoomImage.nativeElement;
    const container = this.miniScreen.nativeElement;

    const containerRect = container.getBoundingClientRect();
    const imgRect = imgElement.getBoundingClientRect();

    // Calculate content dimensions
    const contentWidth = imgRect.width * this.scale;
    const contentHeight = imgRect.height * this.scale;

    // Calculate maximum pan values (with 10% buffer)
    const maxPanX = Math.max(0, (contentWidth - containerRect.width) / 2) * 1.1;
    const maxPanY = Math.max(0, (contentHeight - containerRect.height) / 2) * 1.1;

    // Apply boundaries with elastic effect
    this.posX = Math.max(-maxPanX, Math.min(maxPanX, this.posX));
    this.posY = Math.max(-maxPanY, Math.min(maxPanY, this.posY));

    // Apply transform with optional transition
    if (enableTransition) {
      this.renderer.setStyle(imgElement, 'transition', 'transform 0.2s cubic-bezier(0.33, 1, 0.68, 1)');
    }

    const transform = `translate(${this.posX}px, ${this.posY}px) scale(${this.scale})`;
    this.renderer.setStyle(imgElement, 'transform', transform);

    // Remove transition after it completes if it was enabled
    if (enableTransition) {
      setTimeout(() => {
        this.renderer.setStyle(imgElement, 'transition', 'none');
      }, 200);
    }
  }

  private resetImage() {
    this.scale = 1;
    this.posX = 0;
    this.posY = 0;
    this.lastScale = 1;
    this.lastPosX = 0;
    this.lastPosY = 0;

    const imgElement = this.zoomImage.nativeElement;
    this.renderer.setStyle(imgElement, 'transform', 'translate(0px, 0px) scale(1)');
    this.renderer.setStyle(imgElement, 'transition', 'transform 0.3s cubic-bezier(0.33, 1, 0.68, 1)');

    setTimeout(() => {
      this.renderer.setStyle(imgElement, 'transition', 'none');
    }, 300);
  }

  ngOnDestroy() {
    this.helper.menuCtrl.enable(true)
    if (this.hammerManager) {
      this.hammerManager.destroy();
    }
  }
}

export interface IEvent {
  eventId: number
  eventName: string
  description: string
  isActive: boolean
  isImageOnly?: boolean
  images?: string[]
}