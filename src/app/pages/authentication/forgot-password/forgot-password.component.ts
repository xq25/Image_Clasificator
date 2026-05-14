import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { combineLatest } from 'rxjs';
import Swal from 'sweetalert2';
import { SecurityService, PasswordStrength } from '@app/services/ms-security/security';
import { UserService } from '@app/services/ms-security/user-service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent implements OnInit {
  // Control de pasos
  // 1 = formulario de correo
  // 2 = correo enviado
  // 3 = restablecer contraseña (viene con token en URL)
  step: number = 1;
  loading: boolean = false;
  resendLoading: boolean = false;
  tokenLoading: boolean = false;
  tokenError: boolean = false;

  // Paso 1 y 2
  emailInput: string = '';
  emailError: string = '';

  // Paso 3
  resetToken: string = '';
  private processedToken: string = '';

  formData = {
    password: '',
    confirmPassword: ''
  };

  errors = {
    password: '',
    confirmPassword: ''
  };

  strength: PasswordStrength = {
    level: '',
    text: '',
    percent: 0,
    checks: { length: false, upper: false, lower: false, number: false, special: false },
    error: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public securityService: SecurityService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Soporta token por query (?token=...) y por segmento de ruta (.../forgot-password/:token)
    combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, query]) => {
      const token = params.get('token') || query.get('token') || '';
      this.processResetToken(token);
    });
  }

  private processResetToken(token: string): void {
    const normalizedToken = token?.trim();
    if (!normalizedToken || normalizedToken === this.processedToken) return;

    this.processedToken = normalizedToken;
    this.resetToken = normalizedToken;
    this.step = 3;
    this.tokenLoading = true;
    this.tokenError = false;
    this.validateToken(normalizedToken);
  }

  // VALIDAR TOKEN Y GENERAR SESIÓN TEMPORAL
  validateToken(token: string): void {
    // Antes de generar la sesión temporal, se valida que el token sea válido
    this.securityService.getTemporalSession(token).subscribe({
      next: (data) => {
        this.tokenLoading = false;
        this.tokenError = false;
        // Guardamos la sesión temporal — se usará para el PUT /users/{id}
        this.securityService.saveSession(data.session);
        this.cdr.detectChanges();
      },
      error: () => {
        this.tokenLoading = false;
        this.tokenError = true;
        this.cdr.detectChanges();
      }
    });
  }

  // PASO 1 — Enviar correo de recuperación
  sendResetEmail(): void {
    this.emailError = this.securityService.validateEmail(this.emailInput);
    if (this.emailError) return;

    this.loading = true;
    // Realizamos el envío del correo únicamente si el correo que ingresó el usuario está en nuestra base de datos
    this.securityService.resetPassword(this.emailInput).subscribe({
      next: () => {
        this.loading = false;
        this.step = 2;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        // Aun en caso de error mostramos el paso 2 — no revelamos si el correo existe
        this.step = 2;
        this.cdr.detectChanges();
      }
    });
  }

  // PASO 2 — Reenviar correo (Opcional)
  resend(): void {
    this.resendLoading = true;
    this.securityService.resetPassword(this.emailInput).subscribe({
      next: () => {
        this.resendLoading = false;
        Swal.fire('Enviado', 'Te reenviamos las instrucciones a tu correo', 'success');
      },
      error: () => {
        this.resendLoading = false;
        Swal.fire('Enviado', 'Te reenviamos las instrucciones a tu correo', 'success');
      }
    });
  }

  // Validaciones de contraseña
  validatePassword(): void {
    this.strength = this.securityService.validatePassword(this.formData.password);
    this.errors.password = this.strength.error;
    if (this.formData.confirmPassword) this.validateConfirmPassword();
  }

  validateConfirmPassword(): void {
    this.errors.confirmPassword = this.securityService.validateConfirmPassword(
      this.formData.password,
      this.formData.confirmPassword
    );
  }

  isFormValid(): boolean {
    return (
      this.strength.level === 'strong' &&
      this.errors.password === '' &&
      this.formData.confirmPassword === this.formData.password &&
      this.formData.confirmPassword !== ''
    );
  }

  // PASO 3 — Cambiar contraseña
  changePassword(): void {
    this.validatePassword();
    this.validateConfirmPassword();
    if (!this.isFormValid()) return;

    this.loading = true;

    const session = this.securityService.getCurrentSession();
    if (!session?.user?.id) {
      Swal.fire('Error', 'Sesión inválida, solicita un nuevo enlace', 'error');
      this.loading = false;
      return;
    }

    // Actualizar contraseña via UserService
    this.userService.updateUser(session.user.id, {
      name: session.user.name,
      email: session.user.email,
      password: this.formData.password
    } as any).subscribe({
      next: () => {
        this.loading = false;
        // Destruir sesión temporal
        this.securityService.logout();
        Swal.fire('¡Listo!', 'Tu contraseña fue restablecida exitosamente', 'success');
        this.router.navigate(['auth/authentication/side-login']);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 401) {
          Swal.fire(
            'Enlace expirado',
            'El tiempo para restablecer tu contraseña ha expirado. Solicita un nuevo enlace.',
            'warning'
          );
          this.securityService.logout();
          this.tokenError = true;
        } else {
          Swal.fire('Error', 'No se pudo actualizar la contraseña, intenta de nuevo', 'error');
        }
      }
    });
  }

  // Volver al paso 1
  goBack(): void {
    this.step = 1;
    this.emailInput = '';
    this.emailError = '';
  }
}
