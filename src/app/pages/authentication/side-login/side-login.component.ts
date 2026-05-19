import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { LoginFormComponent, LoginFormData } from 'src/app/components/login-form/login-form.component';
import { SelectCardComponent, CardItem } from 'src/app/components/select-card/select-card.component';
import { SecurityService } from '@app/services/ms-security/security';
import { OAuthService } from '@app/services/ms-security/oauth-service';
import { environment } from '@environments/environment';
import Swal from 'sweetalert2';

declare const grecaptcha: any;

@Component({
  selector: 'app-side-login',
  standalone: true,
  imports: [RouterModule, CommonModule, MaterialModule, LoginFormComponent, SelectCardComponent],
  templateUrl: './side-login.component.html',
  styleUrl: './side-login.component.scss',
})
export class AppSideLoginComponent implements OnInit {
  // Tarjetas de selección de usuario
  userTypeCards: CardItem[] = [
    {
      id: 'doctor',
      name: 'Doctor',
      value: 'Usuario diferencial',
      icon: 'medical_services'
    },
    {
      id: 'patient',
      name: 'Patient',
      value: 'Usuario prueba',
      icon: 'person'
    }
  ];

  selectedUserType: CardItem | null = null;
  isLoading = false;

  constructor(
    private router: Router,
    private securityService: SecurityService,
    private oAuthService: OAuthService
  ) {}

  ngOnInit(): void {
    this.loadRecaptcha();
  }

  // ─── RECAPTCHA ────────────────────────────────────────────

  private loadRecaptcha() {
    if ((window as any).grecaptcha) {
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${environment.captchatkey}`;
    script.id = 'recaptcha-script';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  private removeRecaptcha() {
    const script = document.getElementById('recaptcha-script');
    if (script) {
      script.remove();
    }
    delete (window as any).grecaptcha;
  }

  // ─── SELECCIÓN DE TIPO DE USUARIO ─────────────────────────

  onUserTypeSelected(card: CardItem): void {
    this.selectedUserType = card;
    console.log('Usuario seleccionado:', card);
  }

  // ─── LOGIN CON EMAIL/PASSWORD ─────────────────────────────

  onLoginSubmit(loginData: LoginFormData): void {
    this.isLoading = true;

    // Ejecutar reCAPTCHA v3 y obtener token
    grecaptcha.ready(() => {
      grecaptcha.execute(environment.captchatkey, { action: 'login' }).then((captchaToken: string) => {
        
        // Enviar credenciales + captchaToken al backend
        this.securityService.login(loginData.email, loginData.password, captchaToken).subscribe({
          next: (response) => {
            if (response.data) {
              this.securityService.saveSession(response.data);
            }
            this.removeRecaptcha();
            this.isLoading = false;
            
            Swal.fire('Login exitoso', response.message || 'Has iniciado sesión correctamente', 'success');
            
            // Verificar si requiere 2FA
            this.router.navigate(['/auth/authentication/validate2FA']);
            
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error de login:', error);
            Swal.fire('Error de login', 'Credenciales incorrectas o captcha inválido', 'error');
          }
        });

      });
    });
  }

  // ─── LOGIN CON GOOGLE ─────────────────────────────────────

  onGoogleLogin(): void {
    this.isLoading = true;

    this.oAuthService.loginWithGoogle().then((idToken) => {
      if (!idToken) {
        Swal.fire('Error', 'No se pudo obtener el token de Google', 'error');
        this.isLoading = false;
        return;
      }

      this.oAuthService.loginOAuthGoogle(idToken).subscribe({
        next: (response) => {
          if (response.data) {
            this.securityService.saveSession(response.data);
          }
          this.removeRecaptcha();
          this.isLoading = false;
          
          Swal.fire('Login exitoso', response.message || 'Has iniciado sesión con Google', 'success');
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error OAuth Google:', error);
          Swal.fire('Error de login', 'No se pudo autenticar con Google', 'error');
        }
      });
    });
  }

  // ─── LOGIN CON GITHUB ─────────────────────────────────────

  onGithubLogin(): void {
    this.isLoading = true;

    this.oAuthService.loginWithGithub().then((idToken) => {
      if (!idToken) {
        Swal.fire('Error', 'No se pudo obtener el token de GitHub', 'error');
        this.isLoading = false;
        return;
      }

      this.oAuthService.loginOAuthGithub(idToken).subscribe({
        next: (response) => {
          if (response.data) {
            this.securityService.saveSession(response.data);
          }
          this.removeRecaptcha();
          this.isLoading = false;
          
          Swal.fire('Login exitoso', response.message || 'Has iniciado sesión con GitHub', 'success');
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error OAuth GitHub:', error);
          Swal.fire('Error de login', 'No se pudo autenticar con GitHub', 'error');
        }
      });
    });
  }

  // ─── LOGIN CON MICROSOFT ──────────────────────────────────

  loginWithMicrosoft(): void {
    this.isLoading = true;

    this.oAuthService.loginWithMicrosoft().then((idToken) => {
      if (!idToken) {
        Swal.fire('Error', 'No se pudo obtener el token de Microsoft', 'error');
        this.isLoading = false;
        return;
      }

      this.oAuthService.loginOAuthMicrosoft(idToken).subscribe({
        next: (response) => {
          if (response.data) {
            this.securityService.saveSession(response.data);
          }
          this.removeRecaptcha();
          this.isLoading = false;
          
          Swal.fire('Login exitoso', response.message || 'Has iniciado sesión con Microsoft', 'success');
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error OAuth Microsoft:', error);
          Swal.fire('Error de login', 'No se pudo autenticar con Microsoft', 'error');
        }
      });
    });
  }

  // ─── REDIRECCIONAMIENTOS ──────────────────────────────────

  goToRegister(): void {
    this.router.navigate(['/auth/authentication/register']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/auth/authentication/forgot-password']);
  }
}
