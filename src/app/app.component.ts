import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IEvent } from './pages/hook-a-left/hook-a-left.page';
import { filter } from 'rxjs/operators';
import { StatusBar, Style } from '@capacitor/status-bar';
import {
  IonApp,
  IonSplitPane,
  IonMenu,
  IonContent,
  IonList,
  IonListHeader,
  IonNote,
  IonMenuToggle,
  IonItem,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonRouterLink,
  IonAvatar,
  IonBadge,
  IonAccordionGroup,
  IonAccordion,
  IonButton,
  IonButtons,
} from '@ionic/angular/standalone';
import {
  ToastController,
  AlertController,
  LoadingController,
  ModalController,
  Platform,
  MenuController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import * as icons from 'ionicons/icons';
import { LogoComponent } from './components/logo/logo.component';
import { BackButtonService } from './services/back-button.service';
import { HelperService } from './services/helper.service';
import { ApiService } from './services/api.service';
import { ContentPage } from './pages/hook-a-left/content/content.page';
import { PersonalInfo } from './utils/personal_info';
import { ResourceUrls } from './utils/resource_urls';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [
    IonButtons,
    IonAccordionGroup,
    IonAccordion,
    RouterLink,
    RouterLinkActive,
    IonApp,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonLabel,
    IonRouterLink,
    IonRouterOutlet,
    IonAvatar,
    IonButton,
  ],
})
export class AppComponent {

  public appPages = [
    {
      title: 'Love Out Loud',
      url: '/landing',
      icon: '',
      img: '../../assets/icon/logo.png',
      subMenu: [],
    },
    {
      title: 'Plans',
      url: '/plans',
      icon: 'pricetags-outline',
      subMenu: [],
      img: '',
    },
    {
      title: 'Lessons',
      url: '/lessons',
      icon: 'reader-outline',
      subMenu: [
        { title: 'Lower Primary', url: '/lessons/0' },
        { title: 'Upper Primary', url: '/lessons/1' },
      ],
      img: '',
    },
    {
      title: 'Scope & Sequence',
      url: '/scope-and-sequence',
      icon: 'book-outline',
      subMenu: [
        { title: 'Lower Primary: Series 1', url: '/scope-and-sequence/0' },
        { title: 'Lower Primary: Series 2', url: '/scope-and-sequence/1' },
        { title: 'Upper Primary: Series 1', url: '/scope-and-sequence/2' },
        { title: 'Upper Primary: Series 2', url: '/scope-and-sequence/3' },
        { title: 'Upper Primary: Series 3', url: '/scope-and-sequence/4' },
      ],
      img: '',
    },
    // {
    //   title: 'Hook A Left',
    //   url: '/hook-a-left',
    //   icon: '',
    //   subMenu: [],
    //   img: '../../assets/icon/hook-a-left.png',
    // },
    // {
    //   title: 'Pricing',
    //   url: '/pricing',
    //   icon: 'wallet-outline',
    //   subMenu: [],
    //   img: '',
    // },
    // {
    //   title: 'Donate',
    //   url: '/donate',
    //   icon: 'gift-outline',
    //   subMenu: [],
    //   img: '',
    // },
    {
      title: 'Contact Us',
      url: '/contact-us',
      icon: 'mail-outline',
      subMenu: [],
      img: '',
    },
  ];

  public bottomPages = [
    {
      title: 'About Us',
      url: '/about-us',
      icon: 'information-circle',
      color: 'medium',
    },
    {
      title: 'Contact',
      url: '/contact-us',
      icon: 'mail',
      color: 'medium',
    },
  ];

  public hookMenuItems = [
    {
      title: 'Hook A Left : User Guide',
      icon: 'play-circle-outline',
      reqTitle: 'Hook A Left',
      subMenu: [],
    },
    {
      title: 'Pauls 3 Men',
      icon: 'document-text-outline',
      reqTitle: '',
      imgContentPath: ResourceUrls.Pauls3MenImg,
      subMenu: [],
    },
    {
      title: 'Sheep Dip - Love Out Loud',
      icon: 'document-text-outline',
      reqTitle: 'Sheep Dip',
      subMenu: [],
    },
    {
      title: 'Church Sermons',
      icon: 'home-outline',
      subMenu: [
        { title: 'To Natural Man – The Two Kingdoms', reqTitle: 'The Two Kingdoms' },
        { title: 'To Carnal Man – The Two Natures', reqTitle: 'The Two Natures' },
        { title: 'To Carnal Man – The Unmade Choice', reqTitle: 'The Unmade Choice' },
        { title: 'To Carnal Man – The First Wing', reqTitle: 'The First Wing' },
        { title: 'To Carnal Man – The Faith Project', reqTitle: 'The Faith Project' },
        { title: 'To Spiritual Man – The Spiritual Man', reqTitle: 'The Spiritual Man' },
        { title: 'To Spiritual Man – The Strategic Fisherman', reqTitle: 'The Strategic Fisherman' },
      ],
    },
  ];

  public sheepDipImages: string[] = [];

  readonly PersonalInfo = PersonalInfo;

  backButtonService = inject(BackButtonService);
  helper = inject(HelperService);
  router = inject(Router);
  menuCtrl = inject(MenuController);
  api = inject(ApiService);
  lastActiveItem: HTMLElement | null = null;
  activeAccordion: string | undefined = undefined;

  constructor() {
    this.sheepDipImages = Array.from({ length: 44 }, (_, i) => {
      const pageNumber = (i + 1).toString().padStart(4, '0');
      return `https://hookaleft.com/wp-content/gallery/sheep-dip-5/Sheep-Dip-Love-Out-Loud-Oz_page-${pageNumber}.jpg`;
    });

    addIcons({ ...icons }); // need this to load ion-icons
    this.helper.plt.ready().then(() => {
      console.log('plt ready');
      this.setDarkStatusBar()
      this.backButtonService.initializeBackButton();
    });

    // Global menu state logic based on route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;

      const isAuthRoute = url.includes('/login') || url.includes('/signup');
      const isHookALeft = url.includes('/hook-a-left');

      if (isAuthRoute) {
        // Disable both menus on auth/splash pages
        this.menuCtrl.enable(false, 'mainMenu');
        this.menuCtrl.enable(false, 'hookMenu');
      } else if (isHookALeft) {
        // Enable only hook menu on Hook A Left page
        this.menuCtrl.enable(false, 'mainMenu');
        this.menuCtrl.enable(true, 'hookMenu');
      } else {
        // Enable only main menu on all other app pages
        this.menuCtrl.enable(true, 'mainMenu');
        this.menuCtrl.enable(false, 'hookMenu');
      }
    });
  }
  // Set dark content (light icons) for iOS and Android
  async setDarkStatusBar() {
    try {
      // For iOS - dark content (light icons)
      await StatusBar.setStyle({ style: Style.Light });
      // For Android - light background with dark icons
      await StatusBar.setBackgroundColor({ color: '#ffffff' });
      await StatusBar.setOverlaysWebView({ overlay: false });
    } catch (e) {
      console.error('Status bar error:', e);
    }
  };
  toggleSubMenu(event: Event, item: any) {
    this.generateRandomColor(event.currentTarget as HTMLElement);
    event.stopPropagation();
    item.expanded = !item.expanded;
  }
  activateItem(event: Event) {
    const target = event.currentTarget as HTMLElement;
    if (this.lastActiveItem && this.lastActiveItem !== target) {
      this.lastActiveItem.style.removeProperty('--random-bg');
      this.lastActiveItem.style.setProperty('--background', 'transparent');
      this.lastActiveItem.style.removeProperty('--random-text');
    }
    this.generateRandomColor(target);
    this.lastActiveItem = target;
  }

  // comingSoon(){
  //   this.helper.alertController('This feature is coming soon!')
  // }

  generateRandomColor(element: HTMLElement) {
    const hue = Math.floor(Math.random() * 360);
    const bgColor = `hsl(${hue}, 80%, 90%)`;
    const textColor = `hsl(${hue}, 80%, 30%)`;

    element.style.setProperty('--random-bg', bgColor);
    element.style.setProperty('--random-text', textColor);
  }

  logout() {
    this.activeAccordion = undefined;
    localStorage.removeItem('user')
    localStorage.removeItem('uid')
    localStorage.removeItem('me')
    localStorage.removeItem('login-token')
    this.menuCtrl.close();
    this.router.navigate(['/login']);
  }

  async myProfile() {
    this.activeAccordion = undefined;
    await this.menuCtrl.close();
    this.helper.navigate('my-profile');
  }

  async viewHookContent(item: any) {
    console.log('viewHookContent clicked:', item);

    if (item.imgContentPath) {
      const modalData = {
        eventName: item.title,
        description: `<img src="${item.imgContentPath}" style="width: 100%; height: auto;">`,
        isImageOnly: true
      };
      await this.menuCtrl.close('hookMenu');
      await this.helper.presentModal(ContentPage, modalData);
      return;
    }

    if (item.reqTitle === 'Sheep Dip') {
      const modalData: IEvent = {
        eventId: 0,
        eventName: item.title,
        description: '',
        isActive: true,
        images: this.sheepDipImages,
        isImageOnly: true
      };
      await this.menuCtrl.close('hookMenu');
      await this.helper.presentModal(ContentPage, modalData);
      return;
    }

    if (!item?.reqTitle) {
      console.warn('Item has no reqTitle:', item);
      return;
    }

    await this.menuCtrl.close('hookMenu');
    await this.helper.presentLoading('Loading content...');

    try {
      console.log('Fetching content for:', item.reqTitle);
      const content = await this.api.fetchContentByTitle(item.reqTitle);
      console.log('Content fetched:', content);

      const modalData = {
        eventName: content.title,
        description: content.content
      };
      await this.helper.hideLoading();
      await this.helper.presentModal(ContentPage, modalData);
    } catch (err) {
      await this.helper.hideLoading();
      this.helper.alertController('Error: Could not load content. Please check your connection.');
      console.error('Hook content fetch error:', err);
    }
  }
}
