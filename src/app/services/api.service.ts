import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, map, catchError, throwError } from 'rxjs';
import { Platform } from '@ionic/angular/standalone';
import { DONOR_ENDPOINTS, ENDPOINTS } from '../utils/endpoints.enum';
import { IEvent } from '../pages/hook-a-left/hook-a-left.page';
import { environment } from 'src/environments/environment';
import { HelperService } from './helper.service';
import { ILesson } from '../pages/lessons/lessons.page';
import { Preferences } from '@capacitor/preferences';

interface LoginResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.baseUrl;
  private readonly halBaseUrl = environment.halBaseUrl;
  private readonly wpBaseUrl = environment.wpBaseUrl;
  private readonly wpUpdateUrl = environment.wpUpdateUrl;
  private readonly wpRegBaseUrl = environment.wpRegBaseUrl;
  private readonly mpBaseUrl = environment.mpBaseUrl;
  private readonly giveBaseUrl = 'https://loveoutloudoz.com/wp-json/give-api/v2';
  private readonly supportApiUrl = environment.supportApiUrl;
  private readonly http = inject(HttpClient);

  private readonly LESSONS_CACHE_KEY = 'cached_lessons';
  private readonly CACHE_EXPIRY_DAYS = 1;
  private readonly CONTENT_CACHE_PREFIX = 'cached_content_';
  private isNativePlatform = false;

  private readonly plt = inject(Platform);
  helper = inject(HelperService);

  constructor() {
    this.isNativePlatform = this.plt.is('capacitor') || this.plt.is('cordova');
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      accept: 'text/plain',
      Authorization: `Bearer ${this.helper.getHalToken() || ''}`,
    });
  }
  private getMpHeaders(): HttpHeaders {
    return new HttpHeaders({
      'accept': '*/*',
      'MEMBERPRESS-API-KEY': environment.MEMBERPRESS_API_KEY,
    });
  }

  private getLoginHeaders(): HttpHeaders {
    return new HttpHeaders({
      accept: '*/*',
      'Content-Type': 'application/json'
    });
  }

  contactUs(

    data: any): Observable<any> {
    // const apiUrl = 'https://loveoutloudoz.com/wp-json/gf/v2/forms/2';
    const apiUrl = '/contactForm';


    const headers = new HttpHeaders({
      'Content-Type': 'multipart/form-data',
    });

    let fd = new FormData();
    fd.append('input_1', data.name);
    fd.append('input_3', data.email);
    fd.append('input_4', data.phone);
    fd.append('input_5', data.message);
    fd.append('g-recaptcha-response', data.recaptchaToken);
    return this.http.post(apiUrl + '/submissions', fd, { headers });
  }

  async fetchContentByTitle(title: string): Promise<ContentByTitleData> {
    try {
      const cacheKey = `${this.CONTENT_CACHE_PREFIX}${title.replace(/\s+/g, '_').toLowerCase()}`;

      const cachedContent = await this.getCachedContent(cacheKey);
      if (cachedContent) {
        // Return cached content immediately, then update in background
        this.syncContentInBackground(title, cacheKey);
        return cachedContent;
      }

      // No cache: fetch from API
      const liveContent = await this.fetchContentFromAPI(title);
      await this.cacheContent(cacheKey, liveContent);
      return liveContent;
    } catch (error) {
      console.error('Error in fetchContentByTitle:', error);
      throw error;
    }
  }

  private async syncContentInBackground(title: string, cacheKey: string): Promise<void> {
    try {
      const liveContent = await this.fetchContentFromAPI(title);
      const cachedData = await this.getCachedContent(cacheKey);

      if (JSON.stringify(liveContent) !== JSON.stringify(cachedData)) {
        await this.cacheContent(cacheKey, liveContent);
        console.log(`Background sync: Content updated for ${title}`);
      }
    } catch (err) {
      console.warn(`Background sync failed for ${title}:`, err);
    }
  }

  private async fetchContentFromAPI(title: string): Promise<ContentByTitleData> {
    return new Promise((resolve, reject) => {
      const body = new URLSearchParams();
      body.set('action', 'get_post_by_title');
      body.set('title', title);

      this.http.post<ContentByTitleRes>(this.halBaseUrl, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }).subscribe({
        next: (res) => {
          if (res.success) {
            resolve(res.data);
          } else {
            reject(new Error('API returned success: false'));
          }
        },
        error: (err) => reject(err)
      });
    });
  }
  getWpHeaders() {
    return {
      Authorization: `Bearer ${this.loginToken}`,
      'Content-Type': 'application/json'
    };
  }

  private async getCachedContent(key: string): Promise<ContentByTitleData | null> {
    try {
      let cachedData: string | null;
      if (this.isNativePlatform) {
        const { value } = await Preferences.get({ key });
        cachedData = value;
      } else {
        cachedData = localStorage.getItem(key);
      }

      if (!cachedData) return null;

      const { timestamp, data } = JSON.parse(cachedData);
      return data; // Return even if "expired" for stale-while-revalidate
    } catch (error) {
      return null;
    }
  }

  private async cacheContent(key: string, data: ContentByTitleData): Promise<void> {
    const cacheData = {
      timestamp: new Date().getTime(),
      data: data
    };
    try {
      const value = JSON.stringify(cacheData);
      if (this.isNativePlatform) {
        await Preferences.set({ key, value });
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error caching content:', error);
    }
  }

  loginHal() {
    return new Promise((resolve, reject) => {
      let body = {
        "email": "superadmin@admin.com",
        "password": "Qwaszx123$"
      }
      this.http.post<LoginResponse>(this.baseUrl + ENDPOINTS.LOGIN, body, { headers: this.getLoginHeaders() }).subscribe({
        next: ((res: any) => {
          console.log(res.token)
          this.helper.setHalToken(res.token);
          resolve(res.token)
        }), error: (err => {
          reject(err)
          console.log('Login Error:', err)
        })
      })
    })
  }
  getBasicAuthHeader() {
    let username = 'habib.usman@live.com'
    let password = 'Xx06 iabX PJgc jgQt oNq0 4PGU';
    // Encode credentials to Base64
    const credentials = btoa(`${username}:${password}`);
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json'
    };
  }

  deleteUserData(id: number | string) {
    return new Promise((resolve, reject) => {
      this.http.delete(`https://loveoutloudoz.com/wp-json/wp/v2/users/${id}?force=true&reassign=1`, { headers: this.getBasicAuthHeader() }).subscribe({
        next: ((res: any) => {
          console.log('User deleted', res)
          resolve(res)
        }), error: (err => {
          reject(err)
          console.log('Login Error:', err)
        })
      })
    })
  }



  private async ensureHalToken(): Promise<void> {
    const token = this.helper.getHalToken();
    if (!token) {
      await this.loginHal();
    }
  }

  getAllEvents(): Promise<IEvent[]> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.ensureHalToken();
        this.http.get(this.baseUrl + ENDPOINTS.GET_ALL_EVENTS, { headers: this.getHeaders() }
        ).subscribe({
          next: ((res: any) => {
            let eventNames = res.map((event: IEvent) => {
              return {
                eventName: event.eventName,
              }
            })
            console.log(res)
            resolve(res)
          }), error: (err => {
            reject(err)
            console.log('Login Error:', err)
          })
        })
      } catch (err) {
        reject(err);
      }
    })
  }

  private lessonsInMemory: ILesson[] | null = null;

  // Updated getAllLessons with caching and backend sync
  async getAllLessons(): Promise<ILesson[]> {
    try {
      if (this.lessonsInMemory?.length) {
        // Immediately return what we already have in memory, then sync in background.
        this.syncLessonsInBackground();
        return this.lessonsInMemory;
      }

      const cachedLessons = await this.getCachedLessons();
      if (cachedLessons?.length) {
        this.lessonsInMemory = cachedLessons;
        this.syncLessonsInBackground();
        return cachedLessons;
      }

      // No cache: fetch from backend and cache.
      const liveLessons = await this.fetchLessonsFromAPI();
      this.lessonsInMemory = liveLessons;
      await this.cacheLessons(liveLessons);
      return liveLessons;
    } catch (error) {
      console.error('Error in getAllLessons:', error);

      // Fallback to stale cache if available
      const staleCache = await this.getStaleCache();
      if (staleCache?.length) {
        this.lessonsInMemory = staleCache;
        return staleCache;
      }

      throw error;
    }
  }

  private async syncLessonsInBackground(): Promise<void> {
    try {
      const liveLessons = await this.fetchLessonsFromAPI();

      if (this.areLessonsDifferent(this.lessonsInMemory || [], liveLessons)) {
        this.lessonsInMemory = liveLessons;
        await this.cacheLessons(liveLessons);

        // If app is already using helper signal, update it too.
        try {
          this.helper.lessons.set(liveLessons);
        } catch (err) {
          console.warn('Could not update helper lessons signal:', err);
        }
      }
    } catch (err) {
      console.warn('Background lessons sync failed (continuing with cached data):', err);
    }
  }

  private areLessonsDifferent(currentLessons: ILesson[], newLessons: ILesson[]): boolean {
    if (currentLessons.length !== newLessons.length) return true;

    const normalize = (lessons: ILesson[]) => [...lessons].sort((a, b) => {
      if (a.id !== b.id) return a.id - b.id;
      return a.lessonCode.localeCompare(b.lessonCode);
    });

    const current = normalize(currentLessons);
    const fresh = normalize(newLessons);

    return JSON.stringify(current) !== JSON.stringify(fresh);
  }

  private async fetchLessonsFromAPI(): Promise<ILesson[]> {
    await this.ensureHalToken();

    return new Promise((resolve, reject) => {
      this.http.get(this.baseUrl + ENDPOINTS.GET_ALL_LESSONS, {
        headers: this.getHeaders()
      }).subscribe({
        next: (res) => resolve(res as ILesson[]),
        error: (err) => {
          console.error('API Error:', err);
          reject(err);
        }
      });
    });
  }

  async getCachedLessons(): Promise<ILesson[] | null> {
    try {
      let cachedData: string | null;

      if (this.isNativePlatform) {
        const { value } = await Preferences.get({ key: this.LESSONS_CACHE_KEY });
        cachedData = value;
      } else {
        cachedData = localStorage.getItem(this.LESSONS_CACHE_KEY);
      }

      if (!cachedData) return null;

      const { timestamp, data } = JSON.parse(cachedData);
      const now = new Date().getTime();
      const isExpired = (now - timestamp) > (this.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      return isExpired ? null : data;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }

  private async getStaleCache(): Promise<ILesson[] | null> {
    try {
      let cachedData: string | null;

      if (this.isNativePlatform) {
        const { value } = await Preferences.get({ key: this.LESSONS_CACHE_KEY });
        cachedData = value;
      } else {
        cachedData = localStorage.getItem(this.LESSONS_CACHE_KEY);
      }

      return cachedData ? JSON.parse(cachedData).data : null;
    } catch (error) {
      console.error('Error reading stale cache:', error);
      return null;
    }
  }

  private async cacheLessons(lessons: ILesson[]): Promise<void> {
    const cacheData = {
      timestamp: new Date().getTime(),
      data: lessons
    };

    try {
      if (this.isNativePlatform) {
        await Preferences.set({
          key: this.LESSONS_CACHE_KEY,
          value: JSON.stringify(cacheData)
        });
      } else {
        localStorage.setItem(this.LESSONS_CACHE_KEY, JSON.stringify(cacheData));
      }
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  // getAllLessons(): Promise<ILesson[]> {
  //   return new Promise((resolve, reject) => {
  //     this.http.get(this.baseUrl + ENDPOINTS.GET_ALL_LESSONS, { headers: this.getHeaders() }
  //     ).subscribe({
  //       next: ((res) => {
  //         resolve(res as ILesson[])
  //       }), error: (err => {
  //         reject(err)
  //         console.log('Login Error:', err)
  //       })
  //     })
  //   })
  // }


  replySupportEmail(email: string, name: string) {
    return new Promise((resolve, reject) => {
      let emailBody = `<!DOCTYPE html><html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<!--[if mso]>
<xml><w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word"><w:DontUseAdvancedTypographyReadingMail/></w:WordDocument>
<o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml>
<![endif]-->
<!--[if !mso]>
<!--><!--<![endif]--><style>
*{box-sizing:border-box}body{margin:0;padding:0}a[x-apple-data-detectors]{color:inherit!important;text-decoration:inherit!important}#MessageViewBody a{color:inherit;text-decoration:none}p{line-height:inherit}.desktop_hide,.desktop_hide table{mso-hide:all;display:none;max-height:0;overflow:hidden}.image_block img+div{display:none}sub,sup{font-size:75%;line-height:0} @media (max-width:620px){.mobile_hide{display:none}.row-content{width:100%!important}.stack .column{width:100%;display:block}.mobile_hide{min-height:0;max-height:0;max-width:0;overflow:hidden;font-size:0}.desktop_hide,.desktop_hide table{display:table!important;max-height:none!important}}
</style>
<!--[if mso ]>
<style>sup, sub { font-size: 100% !important; } sup { mso-text-raise:10% } sub { mso-text-raise:-10% }</style> <![endif]--><link href="https://fonts.googleapis.com/css2?family=Alegreya+Sans:ital,wght@0,100;0,300;0,400;0,500;0,700;0,800;0,900;1,100;1,300;1,400;1,500;1,700;1,800;1,900" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Anonymous+Pro:ital,wght@0,400;0,700;1,400;1,700" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Arvo:ital,wght@0,400;0,700;1,400;1,700" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Bitter:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Cabin:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Cardo:ital,wght@0,400;0,700;1,400" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Chivo:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Corben:wght@400;700" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Eczar:wght@400;500;600;700;800" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Fira+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Hind:wght@300;400;500;600;700" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Karla:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,200;1,300;1,400;1,500;1,600;1,700;1,800" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Proza+Libre:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700;1,800" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700;1,900" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Source+Serif+Pro:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700;1,900" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700" rel="stylesheet" type="text/css"/><link href="https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900" rel="stylesheet" type="text/css"/><style type="text/css">
span, h1, h2, h3, h4, h5, h6, p {
	margin: 0;
	padding: 0;
	border: 0;
	font-size: 100%;
	font: inherit;
}
a {
color: inherit;
}
</style></head><body class="body" style="background-color:#fff;margin:0;padding:0;-webkit-text-size-adjust:none;text-size-adjust:none"><table class="nl-container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#fff"><tbody><tr><td><table class="row row-1" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#fff"><tbody><tr><td><table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;color:#000;width:600px;margin:0 auto" width="600"><tbody><tr><td class="column column-1" width="100%" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;padding-bottom:5px;padding-left:5px;padding-right:5px;padding-top:20px;vertical-align:top"><table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0"><tbody><tr><td class="pad" style="width:100%;padding-right:0;padding-left:0"><div class="alignment" align="center"><div style="max-width:118px">
<a href="https://loveoutloudoz.com" target="_blank"><img src="https://m.autopilotapp.com/loveoutloud/logo/l_0e828655-d4f1-4754-96e2-9154daccb7ab.png" style="display:block;height:auto;border:0;width:100%" width="118" alt="Love Out Loud Oz Incorporated" title="Love Out Loud Oz Incorporated" height="auto"/></a></div></div></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table><table class="row row-2" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#fff"><tbody><tr><td><table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;border-radius:0;color:#000;width:600px;margin:0 auto" width="600"><tbody><tr><td class="column column-1" width="100%" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;padding-bottom:35px;padding-left:5px;padding-right:5px;padding-top:35px;vertical-align:top"><table class="text_block block-1" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;word-break:break-word"><tbody><tr><td class="pad"><div style="font-family:Arial,sans-serif"><div class="" style="font-size:12px;color:#231f20;font-weight:400;font-style:normal;font-family:Arial,sans-serif;mso-line-height-alt:14.399999999999999px;line-height:1.2"><p style="margin:0;font-size:12px;color:#231f20;font-weight:400;font-style:normal;mso-line-height-alt:14.399999999999999px">Thank you for contacting Love Out Loud. Your request is now in our queue, and we’ll respond within 72 hours.</p><p style="margin:0;font-size:12px;color:#231f20;font-weight:400;font-style:normal;mso-line-height-alt:14.399999999999999px"> </p><p style="margin:0;font-size:12px;color:#231f20;font-weight:400;font-style:normal;mso-line-height-alt:14.399999999999999px">Best regards,</p><p style="margin:0;font-size:12px;color:#231f20;font-weight:400;font-style:normal;mso-line-height-alt:14.399999999999999px"> </p><p style="margin:0;font-size:12px;color:#231f20;font-weight:400;font-style:normal;mso-line-height-alt:14.399999999999999px">Love out Loud Support Team</p></div></div></td></tr></tbody></table><table class="text_block block-2" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;word-break:break-word"><tbody><tr><td class="pad"><div style="font-family:Arial,sans-serif"><div class="" style="font-size:12px;font-family:Arial,sans-serif;mso-line-height-alt:14.399999999999999px;color:#231f20;line-height:1.2"><p style="margin:0;font-size:12px;mso-line-height-alt:14.399999999999999px"> </p></div></div></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table><table class="row row-3" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#fff"><tbody><tr><td><table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;border-radius:0;color:#000;width:600px;margin:0 auto" width="600"><tbody><tr><td class="column column-1" width="100%" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;padding-bottom:30px;padding-left:5px;padding-right:5px;padding-top:30px;vertical-align:top"><table class="html_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0"><tbody><tr><td class="pad"><div style="font-family:Arial,Helvetica Neue,Helvetica,sans-serif;text-align:center" align="center">
<div id="637be9b66b37b5b980720da3-before-preview"></div>
<div id="before-ap-footer"></div> <table class="nl-container" style="table-layout: fixed; vertical-align: top; min-width: 280px; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: transparent; font-family: Arial; width: 100%;" cellpadding="0" cellspacing="0" role="presentation" width="100%" bgcolor="transparent" valign="top"> <tbody> <tr style="vertical-align: top;" valign="top"> <td style="word-break: break-word; vertical-align: top;" valign="top"> <div style="background-color:transparent;"> <div class="block-grid " style="min-width: 280px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;"> <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;"> <div class="col num12" style="min-width: 280px; max-width: 680px; display: table-cell; vertical-align: top; width: 680px;"> <div class="col_cont" style="width:100% !important;"> <div style="font-size:16px;text-align:center;font-family:Arial, Helvetica Neue, Helvetica, sans-serif"> <table class="s_icons" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;"> <tbody> <tr style="vertical-align: top;" valign="top"> <td style="word-break: break-word; vertical-align: top; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px;" valign="top"> <table class="r_table" align="center" cellpadding="0" cellspacing="0" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-tspace: 0; mso-table-rspace: 0; mso-table-bspace: 0; mso-table-lspace: 0;"> <tbody> <tr style="vertical-align: top; display: inline-block; text-align: center;" align="center" valign="top"> <td style="word-break: break-word; vertical-align: top; padding-bottom: 0; padding-right: 10px; padding-left: 10px;" valign="top"> <a href="https://www.facebook.com/Love-Out-Loud-113665606860206/" target="_blank" style="pointer-events: none;"> <img width="24" height="24" src="https://ic.autopilotapp.com/s/1-5C70FF-48-48.png" alt="Facebook" title="Facebook" style="text-decoration: none; -ms-interpolation-mode: bicubic; height: auto; border: 0; display: block;"/> </a> </td> <td style="word-break: break-word; vertical-align: top; padding-bottom: 0; padding-right: 10px; padding-left: 10px;" valign="top"> <a href="https://instagram.com/loveoutloudoz/" target="_blank" style="pointer-events: none;"> <img width="24" height="24" src="https://ic.autopilotapp.com/s/17-5C70FF-48-48.png" alt="Instagram" title="Instagram" style="text-decoration: none; -ms-interpolation-mode: bicubic; height: auto; border: 0; display: block;"/> </a> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </div> <table class="divider" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" role="presentation" valign="top"> <tbody> <tr style="vertical-align: top;" valign="top"> <td class="divider_inner" style="word-break: break-word; vertical-align: top; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; padding-top: 16px; padding-right: 16px; padding-bottom: 16px; padding-left: 16px;" valign="top"> <table class="divider_content" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-top: 0px solid transparent; height: 0px; width: 100%;" align="center" role="presentation" height="0" valign="top"> <tbody> <tr style="vertical-align: top;" valign="top"> <td style="word-break: break-word; vertical-align: top; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" height="0" valign="top"><span></span></td> </tr> </tbody> </table> </td> </tr> </tbody> </table> <div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:0px; padding-right: 0px; padding-left: 0px;"> <div style="color:#707070;font-family:Arial,Helvetica Neue, Helvetica, Arial, sans-serif;line-height:1.5;padding-top:0px;padding-right:20px;padding-bottom:0px;padding-left:20px;"> <div class="txtTinyMce-wrapper" style="line-height: 1.5; font-size: 12px; color:#707070; font-family: Arial,Helvetica Neue, Helvetica, Arial, sans-serif; mso-line-height-alt: 18px;"> <p style="text-align: center; line-height: 1.5; word-break: break-word; mso-line-height-alt: 18px; margin: 0; color: #707070;"><strong><span style="font-size: 12px; color: #707070;">What did you think of this email?</span></strong></p> </div> </div> <table class="divider" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" role="presentation" valign="top"> <tbody> <tr style="vertical-align: top;" valign="top"> <td class="divider_inner" style="word-break: break-word; vertical-align: top; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; padding-top: 3px; padding-right: 3px; padding-bottom: 3px; padding-left: 3px;" valign="top"> <table class="divider_content" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-top: 0px solid transparent; height: 0px; width: 100%;" align="center" role="presentation" height="0" valign="top"> <tbody> <tr style="vertical-align: top;" valign="top"> <td style="word-break: break-word; vertical-align: top; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" height="0" valign="top"><span></span></td> </tr> </tbody> </table> </td> </tr> </tbody> </table> <div style="font-size:16px;text-align:center;font-family:Arial, Helvetica Neue, Helvetica, sans-serif"> <table class="reactions_icons" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;"> <tbody> <tr style="vertical-align: top;" valign="top"> <td style="word-break: break-word; vertical-align: top; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px;" valign="top"> <table class="s_table" align="center" cellpadding="0" cellspacing="0" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-tspace: 0; mso-table-rspace: 0; mso-table-bspace: 0; mso-table-lspace: 0;"> <tbody> <tr style="vertical-align: top; display: inline-block; text-align: center;" align="center" valign="top"> <td style="word-break: break-word; vertical-align: top; padding-bottom: 0; padding-right: 10px; padding-left: 0px;" valign="top"> <a href="%7b%7b%20urls.reactionangry%20%7d%7d" target="_blank" style="pointer-events: none;"> <img width="40" height="40" src="https://ic.autopilotapp.com/r/5-5C70FF-40-40.png" alt="Angry" title="Very pool" style="text-decoration: none; -ms-interpolation-mode: bicubic; height: auto; border: 0; display: block;"/> </a> </td> <td style="word-break: break-word; vertical-align: top; padding-bottom: 0; padding-right: 10px; padding-left: 10px;" valign="top"> <a href="%7b%7b%20urls.reactiondislike%20%7d%7d" target="_blank" style="pointer-events: none;"> <img width="40" height="40" src="https://ic.autopilotapp.com/r/4-5C70FF-40-40.png" alt="Dislike" title="Poor" style="text-decoration: none; -ms-interpolation-mode: bicubic; height: auto; border: 0; display: block;"/> </a> </td> <td style="word-break: break-word; vertical-align: top; padding-bottom: 0; padding-right: 10px; padding-left: 10px;" valign="top"> <a href="%7b%7b%20urls.reactionok%20%7d%7d" target="_blank" style="pointer-events: none;"> <img width="40" height="40" src="https://ic.autopilotapp.com/r/3-5C70FF-40-40.png" alt="OK" title="OK" style="text-decoration: none; -ms-interpolation-mode: bicubic; height: auto; border: 0; display: block;"/> </a> </td> <td style="word-break: break-word; vertical-align: top; padding-bottom: 0; padding-right: 10px; padding-left: 10px;" valign="top"> <a href="%7b%7b%20urls.reactionlike%20%7d%7d" target="_blank" style="pointer-events: none;"> <img width="40" height="40" src="https://ic.autopilotapp.com/r/2-5C70FF-40-40.png" alt="Like" title="Good" style="text-decoration: none; -ms-interpolation-mode: bicubic; height: auto; border: 0; display: block;"/> </a> </td> <td style="word-break: break-word; vertical-align: top; padding-bottom: 0; padding-right: 10px; padding-left: 10px;" valign="top"> <a href="%7b%7b%20urls.reactionlove%20%7d%7d" target="_blank" style="pointer-events: none;"> <img width="40" height="40" src="https://ic.autopilotapp.com/r/1-5C70FF-40-40.png" alt="Love" title="Great" style="text-decoration: none; -ms-interpolation-mode: bicubic; height: auto; border: 0; display: block;"/> </a> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </div> <table class="divider" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" role="presentation" valign="top"> <tbody> <tr style="vertical-align: top;" valign="top"> <td class="divider_inner" style="word-break: break-word; vertical-align: top; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; padding-top: 16px; padding-right: 16px; padding-bottom: 16px; padding-left: 16px;" valign="top"> <table class="divider_content" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-top: 0px solid transparent; height: 0px; width: 100%;" align="center" role="presentation" height="0" valign="top"> <tbody> <tr style="vertical-align: top;" valign="top"> <td style="word-break: break-word; vertical-align: top; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" height="0" valign="top"><span></span></td> </tr> </tbody> </table> </td> </tr> </tbody> </table> <div style="color:#707070;font-family:Arial,Helvetica Neue, Helvetica, Arial, sans-serif;line-height:1.5;padding-top:0px;padding-right:20px;padding-bottom:0px;padding-left:20px;"> <div class="txtTinyMce-wrapper" style="line-height: 1.5; font-size: 12px; color: #707070; font-family: Arial,Helvetica Neue, Helvetica, Arial, sans-serif; mso-line-height-alt: 18px;"> <p style="text-align: center; line-height: 1.5; word-break: break-word; mso-line-height-alt: 18px; margin: 0; color: #707070;"><strong><span style="font-size: 12px; color: #707070;">Love Out Loud Oz Incorporated</span></strong></p> <p style="text-align: center; line-height: 1.5; word-break: break-word; font-size: 12px; mso-line-height-alt: 18px; margin: 0; color: #707070;"><span style="font-size: 12px; color: #707070;">45 Hunter St, Newcastle NSW 2300, Australia</span></p> </div> </div> <table class="divider" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" role="presentation" valign="top"> <tbody> <tr style="vertical-align: top;" valign="top"> <td class="divider_inner" style="word-break: break-word; vertical-align: top; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; padding-top: 16px; padding-right: 16px; padding-bottom: 16px; padding-left: 16px;" valign="top"> <table class="divider_content" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-top: 0px solid transparent; height: 0px; width: 100%;" align="center" role="presentation" height="0" valign="top"> <tbody> <tr style="vertical-align: top;" valign="top"> <td style="word-break: break-word; vertical-align: top; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" height="0" valign="top"><span></span></td> </tr> </tbody> </table> </td> </tr> </tbody> </table> <div id="before-disclaimer"></div> <div id="after-disclaimer"></div> <table class="divider" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" role="presentation" valign="top"> <tbody> <tr style="vertical-align: top;" valign="top"> <td class="divider_inner" style="word-break: break-word; vertical-align: top; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; padding-top: 5px; padding-right: 5px; padding-bottom: 5px; padding-left: 5px;" valign="top"> <table class="divider_content" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-top: 0px solid transparent; height: 0px; width: 100%;" align="center" role="presentation" height="0" valign="top"> <tbody> <tr style="vertical-align: top;" valign="top"> <td style="word-break: break-word; vertical-align: top; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" height="0" valign="top"><span></span></td> </tr> </tbody> </table> </td> </tr> </tbody> </table> <div id="before-links"></div> <div style="font-size:11px;text-align:center;font-family:Arial, Helvetica Neue, Helvetica, sans-serif"> <div class="footer-links" style="color:#707070;font-family:Arial, Helvetica Neue, Helvetica, Arial, sans-serif;line-height:1.5;padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px;"> <div style="line-height: 1.5; font-size: 11px; color: #707070; font-family: Arial, Helvetica Neue, Helvetica, Arial, sans-serif; mso-line-height-alt: 18px;"> <p style="text-align: center; line-height: 1.5; word-break: break-word; font-size: 11px; mso-line-height-alt: 17px; margin: 0;"> <span style="font-size: 11px;"> <a style="text-decoration: underline; color: #707070;pointer-events: none;" href="%7b%7b%20urls.forward%20%7d%7d" target="_blank" title="Forward">Forward</a> | <a style="text-decoration: underline; color: #707070;pointer-events: none;" href="%7b%7b%20urls.viewonline%20%7d%7d" target="_blank" title="View online">View online</a> | <a style="text-decoration: underline; color: #707070;pointer-events: none;" href="%7b%7b%20urls.unsubscribe%20%7d%7d" target="_blank" title="Unsubscribe">Unsubscribe</a> | </span> </p> </div> </div> </div> <div id="after-links"></div> <table class="divider" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" role="presentation" valign="top"> <tbody> <tr style="vertical-align: top;" valign="top"> <td class="divider_inner" style="word-break: break-word; vertical-align: top; min-width: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; padding-top: 16px; padding-right: 16px; padding-bottom: 16px; padding-left: 16px;" valign="top"> <table class="divider_content" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-top: 0px solid transparent; height: 0px; width: 100%;" align="center" role="presentation" height="0" valign="top"> <tbody> <tr style="vertical-align: top;" valign="top"> <td style="word-break: break-word; vertical-align: top; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" height="0" valign="top"><span></span></td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </div> </div> </div> </div> </div> </div> </td> </tr> </tbody> </table> <div id="after-ap-footer"></div>
<div id="637be9b66b37b5b980720da3-after-preview"></div></div></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></body></html>`


      const myHeaders = new HttpHeaders({
        'X-Api-Key': 'PRV-loveoutloud--3ojWet-MG8YQiz-kLnmhPLEwHjTTw_W1jIOCiEgSO8',
        'Content-Type': 'application/json'
      });

      const raw = JSON.stringify({
        "asset": {
          "from_email": "hello@loveoutloudoz.com",
          "from_name": "Love Out Loud",
          "reply_to": "support01@loveoutloudoz.com",
          "cc": [
            "adeel.shhid@gmail.com",
            "habib.usman@live.com"
          ],
          "subject": "Support Request Received",
          "email_name": "support-email",
          "no_click_tracks": false,
          "no_opens_tracks": false,
          "html_body": emailBody,
          "liquid_syntax_enabled": true
        },
        "emails": [
          {
            "fields": {
              "bol::sp": true,
              "str::email": email,
              "str::first": name,
              "str::last": "",
              "str::soi-ctx": "Support Request",
            },
            "location": null
          }
        ],
        "merge_by": [
          "str::email"
        ],
        "merge_strategy": 2,
        "find_strategy": 0,
        "skip_non_existing": false
      });

      this.http.post(`${this.supportApiUrl}/transactional/send`, raw, { headers: myHeaders }).subscribe({
        next: (response) => {
          console.log('Email sent successfully:', response);
          resolve(response);
        },
        error: (error) => {
          console.error('Error sending email:', error);
          reject(error);
        }
      });

    })



  }

  async sendSupportEmail(customerData: any) {
    const emailBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f8f8; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #f8f8f8; padding: 10px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Support Request</h2>
        </div>
        <div class="content">
          <p><strong>Name:</strong> ${customerData.name}</p>
          <p><strong>Email:</strong> ${customerData.email}</p>
          <p><strong>Phone:</strong> ${customerData.phone || 'Not provided'}</p>
          <p><strong>Message:</strong></p>
          <p>${customerData.message}</p>
        </div>
        <div class="footer">
          <p>This request was submitted via the Contact Us form on ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return new Promise((resolve, reject) => {
      const myHeaders = new HttpHeaders({
        'X-Api-Key': 'PRV-loveoutloud--3ojWet-MG8YQiz-kLnmhPLEwHjTTw_W1jIOCiEgSO8',
        'Content-Type': 'application/json'
      });

      const raw = JSON.stringify({
        "asset": {
          "from_email": "hello@loveoutloudoz.com",
          "from_name": "Love Out Loud",
          "reply_to": customerData.email, // So support can reply directly
          "subject": `New Support Request from ${customerData.name}`,
          "email_name": "support-request",
          "html_body": emailBody
        },
        "emails": [
          {
            "fields": {
              "str::email": "support01@loveoutloudoz.com",
              "str::first": "Support",
              "str::soi-ctx": "Support Request",
            }
          }
        ],
        "merge_by": ["str::email"],
        "merge_strategy": 2
      });

      this.http.post(`${this.supportApiUrl}/transactional/send`, raw, { headers: myHeaders }).subscribe({
        next: (response) => {
          console.log('Support email sent successfully:', response);
          resolve(response);
        },
        error: (error) => {
          console.error('Error sending support email:', error);
          reject(error);
        }
      });
    });
  }




  wpLogin(email: string, password: string): Observable<WP_User> {
    const url = `${this.wpBaseUrl}/?rest_route=/simple-jwt-login/v1/auth`;
    const body = {
      login: email,
      password: password
    };

    return this.http.post<WpLoginResponse>(url, body, { headers: this.getLoginHeaders() })
      .pipe(
        map(response => {
          console.log('WP Login response:', response);

          localStorage.setItem('login-token', response.data.jwt);
          this.setId(response.data.user.id);
          this.saveUser(response.data.user);
          this.helper.setUser(response.data.user);

          return response.data.user;
        }),
        catchError(error => {
          console.error('WP Login Error:', error);
          return throwError(() => error);
        })
      );
  }

  get loginToken() {
    return localStorage.getItem('login-token');
  }

  wpRegister(params: WpRegistrationParams): Observable<UserRegistrationResponse> {
    const url = `${this.wpRegBaseUrl}/users`;
    const body = {
      email: params.email,
      password: params.password,
      AUTH_KEY: environment.JWT_AUTH_KEY,
      display_name: params.display_name,
      first_name: params.first_name,
      last_name: params.last_name
    };

    return this.http.post<UserRegistrationResponse>(url, body, { headers: this.getLoginHeaders() })
      .pipe(
        map(response => {
          return response
        }),
        catchError(error => {
          console.error('WP Register Error:', error);
          return throwError(() => error);
        })
      );
  }


  me(id: number | string): Observable<ME> {
    const storedUser = this.helper.getUser();

    if (storedUser) {
      const cachedProfile: ME = {
        firstName: storedUser.first_name || '',
        lastName: storedUser.last_name || '',
        email: storedUser.email || '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        churchName: '',
        churchSuburb: '',
        city: '',
        location: '',
        state: '',
        postalCode: '',
      };
      return of(cachedProfile);
    }

    // If no user in local cache, keep existing MP fallback if needed
    const url = `${this.mpBaseUrl}${ENDPOINTS.ME}/${id}`;

    return this.http.get<MP_MEMBER_RESPONSE>(url, { headers: this.getMpHeaders() })
      .pipe(
        map(response => {
          const user: WP_User = {
            id: response.id,
            email: response.email,
            username: response.username,
            display_name: response.display_name,
            first_name: response.first_name,
            last_name: response.last_name,
            memberships: response.active_memberships || [],
          };
          this.saveUser(user);

          const formData: ME = {
            firstName: response.first_name,
            lastName: response.last_name,
            email: response.email,
            phone: response.profile.mepr_phone || '',
            addressLine1: response.address['mepr-address-one'] || '',
            addressLine2: response.address['mepr-address-two'] || '',
            churchName: response.profile.mepr_church_name || '',
            churchSuburb: response.profile.mepr_church_suburb || '',
            city: response.address['mepr-address-city'] || '',
            location: response.address['mepr-address-country'] === 'PK' ? 'International' : response.address['mepr-address-state'] || '',
            state: response.address['mepr-address-state'] || '',
            postalCode: response.address['mepr-address-zip'] || '',
          };
          this.saveMpUser(formData);
          return formData;
        }),
        catchError(error => {
          console.error('Get User Error:', error);
          return throwError(() => error);
        })
      );
  }

  updateProfile(id: number | string, profile: ME, sendPasswordEmail: boolean = false): Observable<WORDPRESS_USER> {
    const url = `${this.wpUpdateUrl}/${id}`;

    const body = {
      first_name: profile.firstName,
      last_name: profile.lastName,
      email: profile.email,

      profile: {
        mepr_phone: profile.phone || '',
        mepr_church_name: profile.churchName || '',
        mepr_church_suburb: profile.churchSuburb || ''
      },

      address: {
        'mepr-address-one': profile.addressLine1 || '',
        'mepr-address-two': profile.addressLine2 || '',
        'mepr-address-city': profile.city || '',
        'mepr-address-state': profile.state || '',
        'mepr-address-zip': profile.postalCode || '',
        'mepr-address-country': profile.location || ''
      }
    };

    return this.http.put<WORDPRESS_USER>(url, body, { headers: this.getWpHeaders() })
      .pipe(
        map((response: WORDPRESS_USER) => {
          const formData: ME = {
            firstName: response.first_name,
            lastName: response.last_name,
            email: response.email,
            phone: response.profile.mepr_phone || '',
            addressLine1: response.address['mepr-address-one'] || '',
            addressLine2: response.address['mepr-address-two'] || '',
            churchName: response.profile.mepr_church_name || '',
            churchSuburb: response.profile.mepr_church_suburb || '',
            city: response.address['mepr-address-city'] || '',
            location: response.address['mepr-address-country'] === 'PK' ? 'International' : response.address['mepr-address-state'] || '',
            state: response.address['mepr-address-state'] || '',
            postalCode: response.address['mepr-address-zip'] || '',
          };
          this.saveMpUser(formData);
          return response;
        }),
        catchError(error => {
          console.error('Update Profile Error:', error);
          return throwError(() => error);
        })
      );
  }


  createMember(profile: ME, sendPasswordEmail: boolean = false): Observable<MP_MEMBER_REG_RESPONSE> {
    const url = `${this.mpBaseUrl}${ENDPOINTS.ME}/${profile.id}`; // Assuming ENDPOINTS.MEMBERS exists for creation
    const body = {
      first_name: profile.firstName,
      last_name: profile.lastName,
      email: profile.email,
      username: profile.email, // Email as username per MemberPress requirement
      address1: profile.location || '',
      address2: profile.addressLine2 || '',
      city: profile.city || '',
      state: profile.state || '',
      zip: profile.postalCode || '',
      country: profile.location || '',
      send_password_email: sendPasswordEmail,
      usermeta: {
        mepr_phone: profile.phone || '',
        mepr_church_name: profile.churchName || '',
        mepr_church_suburb: profile.churchSuburb || '',
        mepr_how_did_you_hear_about_us: profile.referralSource, // Default as in your example
        mepr_how_will_you_use_these_lessons: profile.usageDescription, // Empty default
      }
    };

    return this.http.post<MP_MEMBER_REG_RESPONSE>(url, body, { headers: this.getMpHeaders() })
      .pipe(
        map(response => {
          console.log('User Created', response)
          return response;
        }),
        catchError(error => {
          console.error('Create Member Error:', error);
          return throwError(() => error);
        })
      );
  }


  resetPassword(email: string): Observable<ResetPassword> {
    const url = `${this.giveBaseUrl}${DONOR_ENDPOINTS.RESET_PASSWORD}?email=${email}`;

    return this.http.post<ResetPassword>(url, {}, { headers: this.getLoginHeaders() })
      .pipe(
        map(response => {
          if (response.status === 200) {
            this.helper.createToast(response.body_response.message)
          }
          return response

        }),
        catchError(error => {
          console.error('WP Login Error:', error);
          return throwError(() => error);
        })
      );
  }

  saveUser(user: WP_User) {
    localStorage.setItem('user', JSON.stringify({ user }));
  }

  setId(id: string | number) {
    localStorage.setItem('uid', id.toString());
  }

  saveMpUser(user: ME) {
    localStorage.setItem('me', JSON.stringify(user));
  }



}

export interface WpLoginResponse {
  success: boolean;
  data: {
    jwt: string;
    user: WP_User;
    success?: boolean;
  };
}

export interface WP_User {
  id: number;
  email: string;
  username: string;
  display_name: string;
  first_name: string;
  last_name: string;
  roles?: string[];
  memberships?: string[];
}

export interface Member {
  address1: string;
  address2: string;
  city: string;
  country: string;
  email: string;
  first_name: string;
  last_name: string;
  send_password_email: boolean;
  state: string;
  usermeta: {
    mepr_phone: string;
    mepr_church_name: string;
    mepr_church_suburb: string;
  };
  username: string;
  zip: string;
}

export interface UserRegistrationResponse {
  success: boolean;
  id: string;
  message: string;
  user: {
    ID: string;
    user_login: string;
    user_nicename: string;
    user_email: string;
    user_url: string;
    user_registered: string;
    user_activation_key: string;
    user_status: string;
    display_name: string;
  };
  roles: string[];
}
interface MP_MEMBER_REG_RESPONSE {
  id: number;
  email: string;
  username: string;
  nicename: string;
  url: string;
  message: string;
  registered_at: string; // or Date if you'll convert it
  first_name: string;
  last_name: string;
  display_name: string;
  active_memberships: any[]; // or a more specific type if you know the structure
  active_txn_count: string;
  expired_txn_count: string;
  trial_txn_count: string;
  sub_count: number | null;
  login_count: string;
  latest_txn: {
    membership: string;
    member: string;
    coupon: string;
    subscription: string;
  };
  address: {
    'mepr-address-one': string;
    'mepr-address-two': string;
    'mepr-address-city': string;
    'mepr-address-state': string;
    'mepr-address-zip': string;
    'mepr-address-country': string;
  };
  profile: {
    mepr_phone: string;
    mepr_church_name: string;
    mepr_church_suburb: string;
    mepr_licensed_school_1: string;
    mepr_licensed_school_2: string;
    mepr_licensed_school_3: string;
    mepr_licensed_school_4: string;
    mepr_licensed_school_5: string;
    mepr_licensed_school_6: string;
    mepr_licensed_school_7: string;
    mepr_licensed_school_8: string;
    mepr_licensed_school_9: string;
    mepr_licensed_school_10: string;
    mepr_licensed_state_schools: string;
    mepr_how_did_you_hear_about_us: string;
    mepr_how_will_you_use_these_lessons: string;
    mepr_comments: string;
  };
  recent_transactions: any[]; // or a more specific transaction type
  recent_subscriptions: any[]; // or a more specific subscription type
}

export interface ME {
  id?: number
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  churchName: string;
  churchSuburb: string;
  city: string;
  location: string;
  state: string;
  postalCode: string;
  referralSource?: string
  usageDescription?: string
}
export interface WpRegistrationParams {


  /**
   * User's email address (used as username)
   */
  email: string;

  /**
   * User's password
   */
  password: string;



  /**
   * User's display name
   */
  display_name?: string;

  /**
   * User's first name
   */
  first_name?: string;

  /**
   * User's last name
   */
  last_name?: string;

  /**
   * Additional optional parameters that might be supported
   */
  [key: string]: string | undefined;
}

export interface MP_MEMBER_RESPONSE {
  id: number;
  email: string;
  username: string;
  nicename: string;
  url: string;
  message: string;
  registered_at: string;
  first_name: string;
  last_name: string;
  display_name: string;
  active_memberships: string[];
  active_txn_count: string;
  expired_txn_count: string;
  trial_txn_count: string;
  sub_count: string | null;
  login_count: string;
  latest_txn: {
    membership: string;
    member: string;
    coupon: string;
    subscription: string;
  };
  address: {
    'mepr-address-one': string;
    'mepr-address-two': string;
    'mepr-address-city': string;
    'mepr-address-state': string;
    'mepr-address-zip': string;
    'mepr-address-country': string;
  };
  profile: {
    mepr_phone: string;
    mepr_church_name: string;
    mepr_church_suburb: string;
    mepr_licensed_school_1: string;
    mepr_licensed_school_2: string;
    mepr_licensed_school_3: string;
    mepr_licensed_school_4: string;
    mepr_licensed_school_5: string;
    mepr_licensed_school_6: string;
    mepr_licensed_school_7: string;
    mepr_licensed_school_8: string;
    mepr_licensed_school_9: string;
    mepr_licensed_school_10: string;
    mepr_licensed_state_schools: string;
    mepr_how_did_you_hear_about_us: string;
    mepr_how_will_you_use_these_lessons: string;
    mepr_comments: string;
  };
  recent_transactions: any[];
  recent_subscriptions: any[];
}


export interface ResetPassword {

  "status": number
  "response": string,
  "body_response": {
    "message": string
  }
}


export interface ContentByTitleRes {
  success: boolean;
  data: ContentByTitleData;
}

export interface ContentByTitleData {
  title: string;
  content: string; // HTML string (render with innerHTML or sanitizer)
  link: string;
}


export interface WORDPRESS_USER {
  id: number;
  username: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  url: string;
  description: string;
  link: string;
  locale: string;

  profile: {
    mepr_phone: string;
    mepr_church_name: string;
    mepr_church_suburb: string;
  };

  address: {
    'mepr-address-one': string;
    'mepr-address-two': string;
    'mepr-address-city': string;
    'mepr-address-state': string;
    'mepr-address-zip': string;
    'mepr-address-country': string;
  };

  _links: {
    self: {
      href: string;
    }[];
  };
}