import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpResponse, HttpHeaders } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { CapacitorHttp, HttpResponse as CapHttpResponse, HttpOptions } from '@capacitor/core';
import { Platform } from '@ionic/angular/standalone';
import { inject } from '@angular/core';

/**
 * Functional interceptor that routes Angular HttpClient requests through
 * Capacitor's native HTTP layer on mobile devices to bypass CORS.
 *
 * It also handles resolving relative URLs (e.g. /api) to absolute ones
 * when running on a device, ensuring the app works in both dev (proxy)
 * and production builds without changes.
 */
export const capacitorHttpInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const platform = inject(Platform);

  // If not on a native device, use standard Angular/Proxy behavior
  if (!platform.is('capacitor')) {
    return next(req);
  }

  // On native device, we must ensure all URLs are absolute
  let finalUrl = req.url;

  if (finalUrl.startsWith('/')) {
    // Mapping relative paths to production domains for native platform
    if (finalUrl.startsWith('/api')) {
      finalUrl = 'https://api.loveoutloudoz.com' + finalUrl;
    } else if (finalUrl.startsWith('/wp')) {
      finalUrl = 'https://loveoutloudoz.com' + finalUrl;
    } else if (finalUrl.startsWith('/reg')) {
      finalUrl = finalUrl.replace('/reg', 'https://loveoutloudoz.com/wp/?rest_route=/simple-jwt-login/v1');
    } else if (finalUrl.startsWith('/mp')) {
      finalUrl = finalUrl.replace('/mp', 'https://loveoutloudoz.com/wp-json/mp/v1');
    } else if (finalUrl.startsWith('/supportApiUrl')) {
      finalUrl = finalUrl.replace('/supportApiUrl', 'https://api.ap3api.com/v1');
    } else if (finalUrl.startsWith('/hookaLeft')) {
        finalUrl = 'https://hookaleft.com/wp-admin/admin-ajax.php';
    } else {
      // Default fallback if no specific rule matches
      finalUrl = 'https://loveoutloudoz.com' + finalUrl;
    }
  }

  return from(handleNativeRequest(req, finalUrl));
};

/**
 * Executes a request using Capacitor's native HTTP layer
 */
async function handleNativeRequest(req: HttpRequest<unknown>, url: string): Promise<HttpEvent<unknown>> {
  const headers: { [key: string]: string } = {};
  req.headers.keys().forEach(key => {
    headers[key] = req.headers.get(key) || '';
  });

  // Explicitly set User-Agent to bypass firewall blocks
  headers['User-Agent'] = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';

  const options: HttpOptions = {
    url: url,
    method: req.method,
    headers: headers,
    data: req.body,
  };

  try {
    const response: CapHttpResponse = await CapacitorHttp.request(options);
    
    return new HttpResponse({
      body: response.data,
      headers: new HttpHeaders(response.headers),
      status: response.status,
      url: response.url || url
    });
  } catch (error: any) {
    throw error;
  }
}
