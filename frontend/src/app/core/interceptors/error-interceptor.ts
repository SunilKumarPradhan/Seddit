import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Auth } from '../services/auth';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) auth.handleUnauthorized();
      return throwError(() => error);
    }),
  );
};