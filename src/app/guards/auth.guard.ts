import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

function getVgamesLoginUrl(): string {
  const isHttps = window.location.protocol === 'https:';
  return isHttps ? 'https://localhost/login' : 'http://localhost:3000/login';
}

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);

  return authService.user$.pipe(
    filter(user => user !== undefined),
    take(1),
    map(user => {
      if (user) return true;
      window.location.href = getVgamesLoginUrl();
      return false;
    })
  );
};
