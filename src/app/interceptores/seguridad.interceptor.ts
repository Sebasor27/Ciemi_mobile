import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs';

export const seguridadInterceptor: HttpInterceptorFn = (req, next) => {
  const secureReq = req.clone({
    setHeaders: {
      'X-Demo-Seguridad': 'true',
      'X-Timestamp': Date.now().toString()
    }
  });
  console.log('[INTERCEPTOR] Request →', secureReq.urlWithParams);
  return next(secureReq).pipe(
    tap(event => {
      if (event.type === 4) { // HttpResponse
        console.log('[INTERCEPTOR] Response ←', event.status, event.url);
      }
    })
  );
};