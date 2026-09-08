import { Component, inject, OnInit, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonButtons, IonButton, IonIcon, IonFooter } from '@ionic/angular/standalone';
import { IEvent } from '../hook-a-left.page';
import { HelperService } from 'src/app/services/helper.service';
import { webModal, WebModalComponent } from 'src/app/components/web-modal/web-modal.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { swipperData, SwipperComponent } from 'src/app/components/swipper/swipper.component';

@Component({
  selector: 'app-content',
  templateUrl: './content.page.html',
  styleUrls: ['./content.page.scss'],
  standalone: true,
  imports: [IonIcon, SwipperComponent, IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, FormsModule]
})
export class ContentPage implements OnInit {

  data!: IEvent
  swipperData = signal<swipperData | null>(null);
  helper = inject(HelperService);
  sanitizedContent = signal<SafeHtml | null>(null)
  sanitizer = inject(DomSanitizer);
  constructor() {
    setTimeout(() => {
      if (this.data?.images?.length) {
        this.swipperData.set({
          contentType: 'image',
          content: this.data.images.map(img => ({
            media: img,
            title: this.data.eventName,
            description: ''
          }))
        });
      }

      if (this.data?.description) {
        this.sanitizedContent.set(this.safeHtmlWithIframes(this.data.description));
        setTimeout(() => {
          this.captureOriginalFontSizes();
        }, 200);
      }
    }, 500);
  }

  ngOnInit() {
  }

  /**
     * Sanitizes HTML while preserving safe iframes (YouTube/Vimeo).
     */
  safeHtmlWithIframes(html: string): SafeHtml {
    // Step 1: Use DOMParser to analyze HTML
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const iframes = doc.querySelectorAll('iframe');
    const imgs = doc.querySelectorAll('img');

    // Step 2: Validate iframe sources (allow only YouTube/Vimeo)
    iframes.forEach((iframe) => {
      const src = iframe.getAttribute('src') || '';
      if (
        src.includes('youtube.com/embed/') ||
        src.includes('youtu.be/') ||
        src.includes('player.vimeo.com/video/')
      ) {
        // Enhance iframe security
        iframe.setAttribute('src', src.replace('http://', 'https://') + '?rel=0');
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute(
          'allow',
          'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
        );

        iframe.setAttribute('width', '100% !important')
        iframe.setAttribute('max-height', '400px !important')
        iframe.setAttribute('height', 'auto !important')
        iframe.setAttribute('min-height', '400px !important')
      }
    });

    imgs.forEach((img) => {
      const src = img.getAttribute('src') || '';
      let newPath = src;
      
      if (!src.includes('hookaleft.com') && src.includes('/Media')) {
        newPath = `https://apps.loveoutloudoz.com/${src.substring(src.indexOf('/Media'))}`;
      }
      
      img.setAttribute('src', newPath);
      img.style.height = 'auto';
      img.style.width = '100%';
      console.log('Image path processed:', newPath);
    })

    // Step 3: Sanitize the modified HTML and mark it as trusted
    const cleanHtml = doc.body.innerHTML;
    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }

  closeModal() {
    this.helper.modalController.dismiss()
  }

  async handleContentClick(event: Event) {
    const target = event.target as HTMLElement;
    console.log(target.tagName)
    // Handle links
    if (target.tagName === 'A') {
      event.preventDefault();
      const url: string = target.getAttribute('href') as string;
      const title: string = target.innerText
      if (url) {

        this.openWebModal(url, title)
      }
    }
  }
  async openWebModal(url: string, title: string) {
    const data: webModal = {
      url: url,
      title: title
    }
    const modal = await this.helper.modalController.create({
      component: WebModalComponent,
      componentProps: { data },
      cssClass: 'fullscreen-modal'
    });
    await modal.present();
  }


  // Component Class
  fontScale = 1.0; // Track scale factor
  originalFontSizes = new Map<HTMLElement, string>(); // Store original sizes

  private captureOriginalFontSizes() {
    const contentElement = document.getElementById('content');
    if (!contentElement) return;

    this.originalFontSizes.clear();

    // Capture all elements with explicit font sizes
    const allElements = contentElement.querySelectorAll('*');
    allElements.forEach(el => {
      const computed = getComputedStyle(el);
      if (computed.fontSize !== '16px') { // Skip default sizes
        this.originalFontSizes.set(el as HTMLElement, computed.fontSize);
      }
    });
  }

  increaseFont() {
    this.fontScale = Math.min(this.fontScale * 1.2, 2.5); // Limit max scale
    this.applyFontScaling();
  }

  resetFont() {
    this.fontScale = 1.0;
    this.applyFontScaling();
  }

  decreaseFont() {
    this.fontScale = Math.max(this.fontScale / 1.2, 0.8); // Limit min scale
    this.applyFontScaling();
  }

  private applyFontScaling() {
    const contentElement = document.getElementById('content');
    if (!contentElement) return;

    // Apply base scaling
    contentElement.style.fontSize = `${16 * this.fontScale}px`;

    // Apply scaling to elements with original font sizes
    this.originalFontSizes.forEach((originalSize, element) => {
      const sizeValue = parseFloat(originalSize);
      const sizeUnit = originalSize.replace(/[0-9.]/g, '');
      element.style.fontSize = `${sizeValue * this.fontScale}${sizeUnit}`;
    });
  }

  // Image scaling state
  imgScale = 1.0;

  increaseImg() {
    this.imgScale = Math.min(this.imgScale * 1.2, 5.0); // Allow more zoom for images
    this.applyImgScaling();
  }

  resetImg() {
    this.imgScale = 1.0;
    this.applyImgScaling();
  }

  decreaseImg() {
    this.imgScale = Math.max(this.imgScale / 1.2, 0.5); // Prevent zooming out too much
    this.applyImgScaling();
  }

  private applyImgScaling() {
    const contentElement = document.getElementById('content');
    if (!contentElement) return;

    const imgs = contentElement.querySelectorAll('img');
    imgs.forEach(img => {
      const imgElement = img as HTMLImageElement;
      // Overwrite inline width and enforce auto height to keep aspect ratio
      imgElement.style.width = `${100 * this.imgScale}%`;
      imgElement.style.height = 'auto';
      imgElement.style.transition = 'width 0.2s ease-out';
      imgElement.style.maxWidth = 'none'; // Ensure max-width doesn't clip the zoom
    });
  }
}

