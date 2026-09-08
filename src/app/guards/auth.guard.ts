import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HelperService } from '../services/helper.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  private helper = inject(HelperService);
  private router = inject(Router);

  canActivate: CanActivateFn = () => {
    const token = localStorage.getItem('login-token');
    const userId = this.helper.getId();

    if (token && userId) {
      return true;
    }

    this.helper.alertController('Please log in to access the app functionality.');
    this.router.navigate(['/login']);
    return false;
  };
}

export const authGuard: CanActivateFn = (route, state) => {
  return inject(AuthGuard).canActivate(route, state);
};