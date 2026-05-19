import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Session } from '@app/models/Session';
import { User } from '@app/models/User';
import { RegisterRequest } from '@app/models/RegisterRequest';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@app/models/ms-clasificator/ApiResponse';

export type AuthResponse = ApiResponse<Session>;

export interface PasswordStrength {
  level: string;       // 'weak' | 'medium' | 'strong'
  text: string;        // 'Insegura' | 'Débil' | 'Segura'
  percent: number;     // 33 | 66 | 100
  checks: {
    length:  boolean;
    upper:   boolean;
    lower:   boolean;
    number:  boolean;
    special: boolean;
  };
  error: string;
}

@Injectable({
  providedIn: 'root'
})
export class SecurityService {

  private tokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {
    this.loadSession();
  }

  // LOGIN
  login(email: string, password: string, captchaToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.url_backend}/api/public/security/login`,
      { email, password, captchaToken }
    );
  }

  // REGISTER
  register(registerRequest: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.url_backend}/api/public/security/register`,
      registerRequest
    );
  }

  // GUARDAR SESIÓN
  saveSession(session: Session) {
    localStorage.setItem("session", JSON.stringify(session));
    this.tokenSubject.next(session.token || null);
  }

  // OBTENER TOKEN OBSERVABLE
  getToken(): Observable<string | null> {
    return this.tokenSubject.asObservable();
  }

  // TOKEN ACTUAL
  get activeToken(): string | null {
    return this.tokenSubject.value;
  }

  // LOGOUT
  logout(): void {
    const session = this.getCurrentSession();

    // Limpiamos primero para que guards y navegación reaccionen de inmediato.
    localStorage.removeItem('session');
    this.tokenSubject.next(null);

    if (!session?.id) {
      return;
    }

    this.http.put<ApiResponse<void>>(
      `${environment.url_backend}/api/public/security/logout`,
      { id: session.id }
    ).subscribe({
      next: (response) => {
        console.log(response.message); // "Sesión cerrada correctamente"
      },
      error: (err) => {
        console.error('Error al cerrar sesión:', err);
      }
    });
  }

  // CARGAR SESIÓN DEL STORAGE
  private loadSession() {
    const sessionData = localStorage.getItem("session");
    if (sessionData) {
      const session: Session = JSON.parse(sessionData);
      this.tokenSubject.next(session.token || null);
    }
  }

  // REESTABLECER CONTRASEÑA (ENVIAR EMAIL)
  resetPassword(email: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${environment.url_backend}/api/public/security/reset-password`,
      { email }
    );
  }

  // OBTENER SESIÓN TEMPORAL CON TOKEN DE RESETEO
  getTemporalSession(token: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.url_backend}/api/public/security/get-temporal-session`,
      { token }
    );
  }

  // OBTENER SESIÓN ACTUAL
  getCurrentSession(): Session | null {
    const sessionData = localStorage.getItem("session");
    return sessionData ? JSON.parse(sessionData) : null;
  }

  // VALIDAR CÓDIGO 2FA
  validate2FACode(code: string): Observable<boolean> {
    const session = this.getCurrentSession();
    return this.http.put<AuthResponse>(
      `${environment.url_backend}/api/public/security/validateCode2FA`,
      { 
        code2FA: code, 
        sessionId: session?.id 
      }
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          // Guardar la sesión completa desde el backend
          this.saveSession(response.data);
          return true;
        }

        return false;
      })
    );
  }
//Validaciones (FORMULARIOS)------------
  // VERIFICAR SI EXISTE EMAIL
  existUserValidate(email: string): Observable<boolean> {
    return this.http.get<ApiResponse<boolean>>(
      `${environment.url_backend}/api/public/security/user-exist/email/${email}`
    ).pipe(
      map(response => !!response.data)
    );
  }

  findUserByEmail(email: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(
      `${environment.url_backend}/api/public/security/user/email/${email}`
    );
  }

  // VALIDAR EMAIL
  validateEmail(email: string): string {
    if (!email) return 'El correo es requerido';
    if (!email.includes('@') || !email.includes('.')) return 'Ingresa un correo válido';
    return '';
  }

  // VALIDAR NOMBRE
  validateName(name: string): string {
    const specialChars = /[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/;
    if (!name) return 'El nombre es requerido';
    if (specialChars.test(name)) return 'No se permiten caracteres especiales ni números';
    return '';
  }

  // VALIDAR FORTALEZA DE CONTRASEÑA
  validatePassword(password: string): PasswordStrength {
    const checks = {
      length:  password.length >= 8,
      upper:   /[A-Z]/.test(password),
      lower:   /[a-z]/.test(password),
      number:  /[0-9]/.test(password),
      special: /[^a-zA-Z0-9]/.test(password)
    };

    const passed = Object.values(checks).filter(Boolean).length;

    let level = '', text = '', percent = 0;

    if (passed <= 2) {
      level = 'weak';   text = 'Insegura'; percent = 33;
    } else if (passed <= 4) {
      level = 'medium'; text = 'Débil';    percent = 66;
    } else {
      level = 'strong'; text = 'Segura';   percent = 100;
    }

    const error = !password
      ? 'La contraseña es requerida'
      : passed < 5 ? 'La contraseña no cumple todos los requisitos'
      : '';

    return { level, text, percent, checks, error };
  }

  // VALIDAR CONFIRMACIÓN DE CONTRASEÑA
  validateConfirmPassword(password: string, confirmPassword: string): string {
    if (!confirmPassword) return 'Confirma tu contraseña';
    if (confirmPassword !== password) return 'Las contraseñas no coinciden';
    return '';
  }

  
}