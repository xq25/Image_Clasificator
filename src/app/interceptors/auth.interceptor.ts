import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { SecurityService } from '@app/services/ms-security/security';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(
    private securityService: SecurityService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.securityService.activeToken;

    // Si la solicitud es para rutas públicas, no adjunta el token
    if (request.url.includes('/login') || 
        request.url.includes('/register') ||
        request.url.includes('/token-validation') ||
        request.url.includes('/reset-password') ||
        request.url.includes('/get-temporal-session')) {
      return next.handle(request);
    }

    // Adjunta el token a la solicitud
    let authRequest = request;
    if (token) {
      authRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(authRequest).pipe(
      catchError((err: HttpErrorResponse) => {
        // Extrae el mensaje específico del backend
        const errorBody = err.error || {};
        const backendMessage = errorBody.message || 'Error desconocido';

        switch (err.status) {
          case 401: // Token inválido o expirado
            Swal.fire({
              title: 'Sesión expirada',
              text: backendMessage,
              icon: 'warning',
              timer: 5000
            });
            // Limpiar token y redirigir a login
            this.securityService.logout();
            this.router.navigateByUrl('/auth/authentication/login');
            return new Observable<never>();

          case 403: // Sin permisos
            Swal.fire({
              title: 'Acceso denegado',
              text: backendMessage,
              icon: 'error',
              timer: 5000
            });
            this.router.navigateByUrl('/dashboard');
            return new Observable<never>();

          case 400:
          case 500:
          default:
            // Para otros errores, retorna el error para manejar en el componente
            Swal.fire({
              title: 'Error',
              text: backendMessage,
              icon: 'error',
              timer: 5000
            });
            return throwError(() => err);
        }
      })
    );
  }
}
