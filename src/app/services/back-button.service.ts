import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Platform, AlertController, NavController, ModalController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class BackButtonService {
  private platform = inject(Platform);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private navCtrl = inject(NavController);
  private modalCtrl = inject(ModalController);

  // Routes where we should show exit confirmation
  private readonly exitRoutes = [
    '/landing',
    '/signup',
    '/login',
    '/plans',
    '/scope-and-sequence',
    '/pricing',
    '/donate',
    '/contact-us'
  ];

  initializeBackButton() {
    this.platform.backButton.subscribeWithPriority(100, async () => {
      // First check if any modal is open
      const modal = await this.modalCtrl.getTop();
      if (modal) {
        await this.modalCtrl.dismiss();
        return;
      }

      // Get current route path without parameters
      const currentRoute = this.getCurrentRoutePath();
      
      // Check if we're on a route that should show exit confirmation
      if (this.shouldShowExitConfirm(currentRoute)) {
        await this.showExitConfirm();
      } else {
        // For other routes, navigate back
        this.navCtrl.back();
      }
    });
  }

  private getCurrentRoutePath(): string {
    const urlTree = this.router.parseUrl(this.router.url);
    return urlTree.root.children['primary']?.segments.map(s => s.path).join('/') || '';
  }

  private shouldShowExitConfirm(currentRoute: string): boolean {
    // Check if any exit route matches the beginning of current route
    // (handles routes with parameters like '/scope-and-sequence/:id')
    return this.exitRoutes.some(route => 
      currentRoute === route || 
      currentRoute.startsWith(route + '/')
    );
  }

  private async showExitConfirm(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Exit App',
      message: 'Do you want to exit the app?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Exit',
          handler: () => {
            (navigator as any)['app']?.exitApp();
          }
        }
      ]
    });

    await alert.present();
  }
}