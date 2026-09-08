import { Injectable, computed, inject, signal } from '@angular/core';
import { Router, NavigationExtras, ActivatedRoute } from '@angular/router';
import {
  ToastController,
  AlertController,
  LoadingController,
  ModalController,
  Platform,
  MenuController,
} from '@ionic/angular/standalone';
import { registerClassOnWindow } from '../utils/global';
import { DomSanitizer } from '@angular/platform-browser';
import { ME, WP_User } from './api.service';
import { ILesson, ILessonData, IParsedLessonCode } from '../pages/lessons/lessons.page';

@Injectable({
  providedIn: 'root'
})
export class HelperService {
  lessons = signal<ILesson[]>([]);
  currentUser = signal<WP_User | null>(null);

  fullname = signal<string>('')
  // Services
  private toast = inject(ToastController);
  alertCtlr = inject(AlertController);
  private loadingController = inject(LoadingController);
  activatedRoute = inject(ActivatedRoute)
  modalController = inject(ModalController);
  router = inject(Router);
  plt = inject(Platform);
  menuCtrl = inject(MenuController);
  sanitize = inject(DomSanitizer)
  // State
  currentModal = signal<HTMLIonModalElement | null>(null);
  isLoading = signal(false);

  constructor() {
    registerClassOnWindow('HelperService', this);
  }

  openMap(lat: number, long: number) {
    if (lat === 0 && long === 0) {
      this.createToast('Location is not provided!');
      return;
    }


    const googleMapsUrl = `https://www.google.com/maps?q=${lat},${long}`;
    const appleMapsUrl = `http://maps.apple.com/?q=${lat},${long}`;
    const url = this.plt.is('ios') ? appleMapsUrl : googleMapsUrl;
    window.open(url, '_blank');
  }

  onImgError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = '../../../assets/banner1.png';
  }


  getLessonDataByLevel(level: 'Lower Primary' | 'Upper Primary'): ILessonData {
  try {
    // 1. Input validation
    if (!['Lower Primary', 'Upper Primary'].includes(level)) {
      throw new Error(`Invalid level: ${level}. Must be 'Lower Primary' or 'Upper Primary'`);
    }

    const prefix = level === 'Lower Primary' ? 'LP' : 'UP';
    const lessons = this.lessons();

    // 2. Validate lessons array
    if (!Array.isArray(lessons)) {
      throw new Error('Lessons data is not an array');
    }

    // 3. Group lessons by series with validation
    const seriesMap = new Map<string, ILesson[]>();
    const invalidLessonCodes: string[] = [];

    lessons.forEach(lesson => {
      try {
        // Skip if not matching our level prefix
        if (!lesson.lessonCode?.startsWith(prefix)) return;

        // Validate lesson code structure
        const parts = lesson.lessonCode.split('-');
        if (parts.length < 2) {
          invalidLessonCodes.push(lesson.lessonCode);
          return;
        }

        // Validate series format (S followed by number)
        if (!/^S\d+$/.test(parts[1])) {
          invalidLessonCodes.push(lesson.lessonCode);
          return;
        }

        const seriesCode = parts.slice(0, 2).join('-'); // e.g., "UP-S2"

        // Validate episode format (optional, only log if invalid)
        let isValidEpisode = true;
        if (parts.length >= 3) {
          const episodePart = parts[2];
          if (!/^EP\d+$/.test(episodePart) && !/^EP-0*\d+$/.test(episodePart)) {
            // console.warn(`Invalid episode format for lesson code: ${lesson.lessonCode}`);
            isValidEpisode = false;
          }
        } else {
          console.warn(`Missing episode part for lesson code: ${lesson.lessonCode}`);
          isValidEpisode = false;
        }

        // Add to series map even if episode is invalid
        if (!seriesMap.has(seriesCode)) {
          seriesMap.set(seriesCode, []);
        }
        seriesMap.get(seriesCode)?.push(lesson);
      } catch (error) {
        console.error(`Error processing lesson ${lesson.id}:`, error);
        invalidLessonCodes.push(lesson.lessonCode);
      }
    });

    // 4. Log warnings for invalid lesson codes
    if (invalidLessonCodes.length > 0) {
      console.warn(`Skipped ${invalidLessonCodes.length} lessons with invalid codes:`, invalidLessonCodes);
    }

    // 5. Sort and transform data
    const seriesArray = Array.from(seriesMap.entries()).map(([code, episodes]) => {
      const seriesNumber = code.split('-')[1].replace('S', '');

      return {
        title: `Series ${seriesNumber}`,
        code,
        episodes: episodes.sort((a, b) => {
          try {
            const getNum = (code: string) => {
              const match = code.match(/(\d+)$/);
              return match ? parseInt(match[0], 10) : 0;
            };
            return getNum(a.lessonCode) - getNum(b.lessonCode);
          } catch (error) {
            console.error('Error sorting episodes:', error);
            return 0;
          }
        })
      };
    }).sort((a, b) => {
      try {
        const getNum = (code: string) => {
          const match = code.match(/S(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        };
        return getNum(a.code) - getNum(b.code);
      } catch (error) {
        console.error('Error sorting series:', error);
        return 0;
      }
    });

    // 6. Validate we have data
    if (seriesArray.length === 0) {
      console.warn(`No valid lessons found for ${level}`);
    }

    return {
      title: level,
      series: seriesArray
    };

  } catch (error) {
    console.error('Failed to process lesson data:', error);
    return {
      title: level,
      series: []
    };
  }
}

  parseLessonCode(lessonCode: string): IParsedLessonCode {
    // Validate basic structure
    const parts = lessonCode.split('-');
    if (parts.length < 3 || parts.length > 4) {
      throw new Error(`Invalid lesson code format: ${lessonCode}`);
    }

    // Handle both formats (EP026 and EP-026)
    const [level, seriesStr, epPrefix, epNum] = parts;
    const episodePart = parts.length === 3 ? parts[2] : `${parts[2]}${parts[3]}`;

    // Parse level
    const title =
      level === 'LP' ? 'Lower Primary' :
        level === 'UP' ? 'Upper Primary' :
          (() => { throw new Error(`Unknown level code: ${level}`) })();

    // Parse series (S1 -> 1)
    const seriesMatch = seriesStr.match(/^S(\d+)$/);
    if (!seriesMatch) throw new Error(`Invalid series format: ${seriesStr}`);
    const series = parseInt(seriesMatch[1], 10);
    if (series < 1 || series > 5) throw new Error(`Series ${series} out of range (1-5)`);

    // Parse episode (EP026 or EP-026 -> 26)
    const episodeMatch = episodePart.match(/^EP-?(\d+)$/);
    if (!episodeMatch) throw new Error(`Invalid episode format: ${episodePart}`);
    const episode = parseInt(episodeMatch[1], 10);

    return { title, series, episode };
  }

  setHalToken(token: string) {
    localStorage.setItem('halToken', token);
  }
  getHalToken(): string | null {
    return localStorage.getItem('halToken');
  }
  comingSoon() {
    this.createToast('The feature is coming soon!');
  }

  cal(amount: number) {
    const str = Number(amount) * 0.2;
    return str.toFixed(1);
  }

  async presentModal(page: any, data?: any) {
    const modal = await this.modalController.create({
      component: page,
      // mode: 'ios',
      // presentingElement: document.querySelector('ion-router-outlet') as HTMLElement,
      componentProps: { data },
      backdropDismiss: true,
      canDismiss: true,
      showBackdrop: true,
    });
    this.currentModal.set(modal);
    return await modal.present();
  }

  toISOString(dateInput: unknown): string | null {
    if (!dateInput) return null;

    let date: Date;

    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else {
      return null;
    }

    return isNaN(date.getTime()) ? null : date.toISOString();
  }

  toggleMenu() {
    this.menuCtrl.isOpen().then(isOpen => {
      isOpen ? this.menuCtrl.close() : this.menuCtrl.open();
    }).catch(err => console.error(err));
  }

  convertToISOString(monthYearString: string): string {
    const [month, year] = monthYearString.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
  }

  formatDate(_date: string): string {
    if (/^\d{1,2}\/\d{4}$/.test(_date)) {
      return _date;
    }

    const date = new Date(_date);
    if (!isNaN(date.getTime())) {
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString();
      return `${month}/${year}`;
    }
    return _date;
  }

  exportToCsv(filename: string, rows: Array<any>, headers?: string[]) {
    if (!rows?.length) return;

    const separator = ",";
    const keys = Object.keys(rows[0]);
    const columHearders = headers ?? keys;

    const csvContent =
      "sep=,\n" +
      columHearders.join(separator) +
      '\n' +
      rows.map(row => {
        return keys.map(k => {
          let cell = row[k] ?? '';
          cell = cell instanceof Date
            ? cell.toLocaleString()
            : cell.toString().replace(/"/g, '""');

          return cell.search(/("|,|\n)/g) >= 0 ? `"${cell}"` : cell;
        }).join(separator);
      }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  exitApp() {
    localStorage.clear();
    this.navigate('/welcome');

    if (this.plt.is('cordova')) {
      (navigator as any).app.exitApp();
    } else {
      console.log('Exit app functionality is supported only in Cordova.');
      window.close();
    }
  }

  generateRandomString(length: number): string {
    const characters = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
  }

  async createToast(msg: string, duration: number = 2000) {
    const toast = await this.toast.create({
      message: msg,
      duration,
      position: 'bottom',
      color: 'dark',
    });
    toast.present();
  }

  calculateMinimumDate() {
    const currentDate = new Date();
    return currentDate.getFullYear() - 16;
  }

  async alertController(msg: string) {
    const alert = await this.alertCtlr.create({
      message: msg,
      mode: 'ios',
      buttons: [{ text: 'Ok', role: 'cancel' }],
    });
    await alert.present();
  }

  async appErrorAlert(msg: string) {
    const alert = await this.alertCtlr.create({
      message: msg,
      cssClass: 'app-alert',
      header: 'eTraffic',
      buttons: [{ text: 'Ok', role: 'cancel' }],
    });
    await alert.present();
  }

  // async presentModal(page: any, data?: any) {
  //   const modal = await this.modalController.create({
  //     component: page,
  //     mode: 'ios',
  //     componentProps: { data },
  //     backdropDismiss: true,
  //     canDismiss: true,
  //     showBackdrop: true,
  //   });

  //   this.currentModal.set(modal);
  //   await modal.present();
  // }

  async startLoad() {
    this.isLoading.set(true);
    const loader = await this.loadingController.create({
      duration: 9000,
      message: '',
    });

    await loader.present();
    if (!this.isLoading()) {
      await loader.dismiss();
    }
  }

  async dismissLoader() {
    this.isLoading.set(false);
    await this.loadingController.dismiss();
  }

  async presentLoading(msg: string, duration: number = 1000) {
    const check = await this.loadingController.getTop();
    if (check) await this.loadingController.dismiss();

    const loading = await this.loadingController.create({
      message: msg,
      cssClass: 'loader-dir',
      spinner: 'crescent',
      mode: 'ios',
      duration: duration > 1000 ? duration : undefined
    });

    await loading.present();
  }

  async hideLoading() {
    await this.loadingController.dismiss();
  }

  async timeoutHide(time: number) {
    setTimeout(async () => {
      const check = await this.loadingController.getTop();
      if (check) await this.loadingController.dismiss();
    }, time);
  }

  navigate(route: string, replaceUrl: boolean = false) {
    this.router.navigate([route], { replaceUrl });
  }

  navigateWithExtras(route: string, extras: NavigationExtras) {
    this.router.navigate([route], extras);
  }

  async presentToast(message: string, duration: number, position: any) {
    const toast = await this.toast.create({
      mode: 'ios',
      message,
      duration,
      position
    });
    await toast.present();
  }

  // async presentModalWithCallBack2(
  //   page: any,
  //   data: any,
  //   breakPoints: number,
  //   custom_class: string
  // ): Promise<HTMLIonModalElement> {
  //   const modal = await this.modalController.create({
  //     component: page,
  //     mode: 'ios',
  //     componentProps: { data },
  //     canDismiss: true,
  //     initialBreakpoint: breakPoints,
  //     breakpoints: [breakPoints, 0.2, 0.3, 0.6, 1],
  //     cssClass: custom_class
  //   });

  //   await modal.present();
  //   return modal;
  // }

  // async presentModalWithCallBack(
  //   page: any,
  //   data: any,
  //   clss: string
  // ): Promise<HTMLIonModalElement> {
  //   const modal = await this.modalController.create({
  //     component: page,
  //     mode: 'ios',
  //     componentProps: { data },
  //     canDismiss: true,
  //     keyboardClose: false,
  //     cssClass: clss,
  //   });

  //   await modal.present();
  //   return modal;
  // }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('login-token');
  }

  setUser(user: WP_User): void {
    this.currentUser.set(user);
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    this.fullname.set(fullName);
    localStorage.setItem('user', JSON.stringify({ user }));
    localStorage.setItem('uid', user.id?.toString() ?? '');
  }

  getUser(): WP_User | null {
    if (this.currentUser()) {
      return this.currentUser();
    }

    const raw = localStorage.getItem('user');
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (parsed?.user) {
        this.currentUser.set(parsed.user);
        return parsed.user;
      }
      this.currentUser.set(parsed);
      return parsed;
    } catch (err) {
      console.error('Failed to parse user from localStorage:', err);
      return null;
    }
  }

  getId(): string | null {
    return localStorage.getItem('uid');
  }

  getMpUser(): ME | null {
    const user = localStorage.getItem('me');
    if (user) {
      return JSON.parse(user);
    }
    return null;
  }
}

export interface ModalOptions {
  component: any;
  componentProps?: any;
  cssClass?: string;
  breakpoints?: number[];
  initialBreakpoint?: number;
}