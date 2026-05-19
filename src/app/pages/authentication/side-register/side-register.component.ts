import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { MaterialModule } from 'src/app/material.module';
import { SelectCardComponent, CardItem } from 'src/app/components/select-card/select-card.component';
import { User } from '@app/models/User';
import { PasswordStrength, SecurityService } from '@app/services/ms-security/security';

@Component({
  selector: 'app-side-register',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, SelectCardComponent],
  templateUrl: './side-register.component.html',
  styleUrl: './side-register.component.scss',
})
export class AppSideRegisterComponent {
  userTypeCards: CardItem[] = [
    {
      id: 'doctor',
      name: 'Doctor',
      value: 'Registro para doctor',
      icon: 'medical_services',
    },
    {
      id: 'patient',
      name: 'Patient',
      value: 'Registro para paciente',
      icon: 'person',
    },
  ];

  selectedUserType: CardItem | null = null;
  step: 1 | 2 = 1;
  loading = false;
  feedbackMessage = '';
  feedbackType: 'info' | 'success' | 'error' | '' = '';
  emailInput = '';
  emailError = '';
  hidePassword = true;
  hideConfirmPassword = true;

  formData = {
    name: '',
    password: '',
    confirmPassword: '',
  };

  errors = {
    name: '',
    password: '',
    confirmPassword: '',
  };

  strength: PasswordStrength = {
    level: '',
    text: '',
    percent: 0,
    checks: {
      length: false,
      upper: false,
      lower: false,
      number: false,
      special: false,
    },
    error: '',
  };

  constructor(
    private router: Router,
    public securityService: SecurityService,
    private cdr: ChangeDetectorRef
  ) {}

  onUserTypeSelected(card: CardItem): void {
    this.selectedUserType = card;
  }

  private requireUserTypeSelection(): boolean {
    if (this.selectedUserType) {
      return true;
    }

    this.feedbackMessage = 'Selecciona Doctor o Patient antes de continuar.';
    this.feedbackType = 'error';
    Swal.fire('Selecciona un tipo de usuario', 'Debes elegir Doctor o Patient antes de validar el correo', 'warning');
    return false;
  }

  checkEmail(): void {
    if (!this.requireUserTypeSelection()) {
      return;
    }

    this.emailError = this.securityService.validateEmail(this.emailInput.trim());
    if (this.emailError) {
      this.feedbackMessage = this.emailError;
      this.feedbackType = 'error';
      return;
    }

    this.loading = true;
    this.feedbackMessage = 'Verificando correo...';
    this.feedbackType = 'info';
    this.securityService.existUserValidate(this.emailInput.trim()).subscribe({
      next: (exists) => {
        this.loading = false;

        if (exists) {
          this.emailError = 'Este correo ya está registrado';
          this.feedbackMessage = this.emailError;
          this.feedbackType = 'error';
          this.cdr.detectChanges();
          return;
        }

        this.feedbackMessage = 'Correo válido, continuando al siguiente paso.';
        this.feedbackType = 'success';
        this.step = 2;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.feedbackMessage = 'No se pudo verificar el correo, intenta de nuevo';
        this.feedbackType = 'error';
        Swal.fire('Error', 'No se pudo verificar el correo, intenta de nuevo', 'error');
      },
    });
  }

  validateName(): void {
    this.errors.name = this.securityService.validateName(this.formData.name);
  }

  validatePassword(): void {
    this.strength = this.securityService.validatePassword(this.formData.password);
    this.errors.password = this.strength.error;

    if (this.formData.confirmPassword) {
      this.validateConfirmPassword();
    }
  }

  validateConfirmPassword(): void {
    this.errors.confirmPassword = this.securityService.validateConfirmPassword(
      this.formData.password,
      this.formData.confirmPassword
    );
  }

  isFormValid(): boolean {
    return (
      this.formData.name.trim() !== '' &&
      this.errors.name === '' &&
      this.strength.level === 'strong' &&
      this.errors.password === '' &&
      this.formData.confirmPassword === this.formData.password &&
      this.formData.confirmPassword !== ''
    );
  }

  register(): void {
    if (!this.requireUserTypeSelection()) {
      return;
    }

    this.validateName();
    this.validatePassword();
    this.validateConfirmPassword();

    if (!this.isFormValid()) {
      return;
    }

    this.loading = true;

    const newUser: User = {
      name: this.formData.name.trim(),
      email: this.emailInput.trim(),
      password: this.formData.password,
    };

    this.securityService.register(newUser).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.data) {
          this.securityService.saveSession(response.data);
        }
        localStorage.setItem(
          'userType',
          JSON.stringify({
            type: this.selectedUserType?.id,
          })
        );
        this.feedbackMessage = response.message || 'Cuenta creada correctamente.';
        this.feedbackType = 'success';
        Swal.fire('¡Bienvenido!', response.message || 'Tu cuenta ha sido creada exitosamente', 'success');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.loading = false;

        if (error.status === 409) {
          this.step = 1;
          this.emailError = 'Este correo ya está registrado';
            this.feedbackMessage = this.emailError;
            this.feedbackType = 'error';
          Swal.fire('Error', 'Este correo ya está registrado', 'error');
          return;
        }

          this.feedbackMessage = 'No se pudo crear la cuenta, intenta de nuevo';
          this.feedbackType = 'error';
        Swal.fire('Error', 'No se pudo crear la cuenta, intenta de nuevo', 'error');
      },
    });
  }

  goBackToEmailStep(): void {
    this.step = 1;
    this.feedbackMessage = '';
    this.feedbackType = '';
  }

  goToLogin(): void {
    this.router.navigate(['/auth/authentication/side-login']);
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }
}
