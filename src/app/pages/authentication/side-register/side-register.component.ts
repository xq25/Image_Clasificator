import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { MaterialModule } from 'src/app/material.module';
import { SelectCardComponent, CardItem } from 'src/app/components/select-card/select-card.component';
import { User } from '@app/models/User';
import { RegisterRequest } from '@app/models/RegisterRequest';
import { Session } from '@app/models/Session';
import { Doctor, Patient } from '@app/models/ms-clasificator';
import { PasswordStrength, SecurityService } from '@app/services/ms-security/security';
import { InternalServicesService } from '@app/services/ms-clasificator/internal-services.service';
import { environment } from '@environments/environment';

type RegistrationStep = 'identity' | 'user-form' | 'profile-form';
type SelectedUserType = 'doctor' | 'patient';

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
      name: 'DOCTOR',
      value: 'Registro para doctor',
      icon: 'medical_services',
    },
    {
      id: 'patient',
      name: 'PATIENT',
      value: 'Registro para paciente',
      icon: 'person',
    },
  ];

  selectedUserType: CardItem | null = null;
  currentStep: RegistrationStep = 'identity';
  registrationScenario: 'new-user' | 'existing-user' | null = null;
  loading = false;
  feedbackMessage = '';
  feedbackType: 'info' | 'success' | 'error' | '' = '';
  emailInput = '';
  emailError = '';
  hidePassword = true;
  hideConfirmPassword = true;
  pendingSession: Session | null = null;
  pendingUserId: string | null = null;
  existingSystemUser: User | null = null;

  formData = {
    name: '',
    password: '',
    confirmPassword: '',
  };

  profileData = {
    code: '',
    document: '',
    years: '',
  };

  errors = {
    name: '',
    password: '',
    confirmPassword: '',
    code: '',
    document: '',
    years: '',
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
    private internalServices: InternalServicesService,
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

  get selectedUserTypeId(): SelectedUserType | null {
    const userType = this.selectedUserType?.id;

    if (userType === 'doctor' || userType === 'patient') {
      return userType;
    }

    return null;
  }

  private get selectedRoleId(): string {
    return this.selectedUserTypeId === 'doctor'
      ? environment.securityRoles.doctorRole
      : environment.securityRoles.patientRole;
  }

  private get selectedUserTypeLabel(): string {
    return this.selectedUserType?.name ?? 'usuario';
  }
  
   get isDoctorType(): boolean {
     return this.selectedUserTypeId === 'doctor';
   }

  private isMongoObjectId(value: unknown): value is string {
    return typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value);
  }

  private get selectedUserTypeLowercaseLabel(): string {
    return (this.selectedUserType?.name ?? 'usuario').toLowerCase();
  }

  private resetToIdentity(message = '', type: 'info' | 'success' | 'error' | '' = ''): void {
    this.currentStep = 'identity';
    this.registrationScenario = null;
    this.loading = false;
    this.pendingSession = null;
    this.pendingUserId = null;
    this.existingSystemUser = null;
    this.formData = {
      name: '',
      password: '',
      confirmPassword: '',
    };
    this.profileData = {
      code: '',
      document: '',
      years: '',
    };
    this.errors = {
      name: '',
      password: '',
      confirmPassword: '',
      code: '',
      document: '',
      years: '',
    };
    this.strength = {
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
    this.feedbackMessage = message;
    this.feedbackType = type;
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
    this.feedbackMessage = 'Verificando correo con el sistema...';
    this.feedbackType = 'info';
    this.securityService.findUserByEmail(this.emailInput.trim()).subscribe({
      next: (response) => {
        const foundUser = response.data;

        if (foundUser?.id) {
          this.handleExistingUser(foundUser);
          return;
        }

        this.startNewUserFlow();
      },
      error: (error) => {
        this.loading = false;

        if (error.status === 404) {
          this.startNewUserFlow();
          return;
        }

        this.feedbackMessage = 'No se pudo verificar el correo, intenta de nuevo';
        this.feedbackType = 'error';
        Swal.fire('Error', 'No se pudo verificar el correo, intenta de nuevo', 'error');
      },
    });
  }

  private startNewUserFlow(): void {
    this.registrationScenario = 'new-user';
    this.pendingSession = null;
    this.pendingUserId = null;
    this.existingSystemUser = null;
    this.formData = {
      name: '',
      password: '',
      confirmPassword: '',
    };
    this.profileData = {
      code: '',
      document: '',
      years: '',
    };
    this.errors = {
      name: '',
      password: '',
      confirmPassword: '',
      code: '',
      document: '',
      years: '',
    };
    this.currentStep = 'user-form';
    this.feedbackMessage = 'Correo disponible. Completa primero los datos del usuario.';
    this.feedbackType = 'success';
    this.loading = false;
    this.cdr.detectChanges();
  }

  private handleExistingUser(foundUser: User): void {
    const userId = foundUser.id?.trim();

    if (!userId || !this.isMongoObjectId(userId) || !this.isMongoObjectId(this.selectedRoleId)) {
      this.loading = false;
      this.feedbackMessage = 'El usuario o el rol no tiene un identificador Mongo válido para continuar.';
      this.feedbackType = 'error';
      Swal.fire('Error', 'El usuario o el rol no tiene un identificador Mongo válido para continuar.', 'error');
      return;
    }

    const relationCheck$ = this.isDoctorType
      ? this.internalServices.existRelationWithDoctor(userId)
      : this.internalServices.existRelationWithPatient(userId);

    relationCheck$.subscribe({
      next: (relationExists) => {
        if (relationExists) {
          this.loading = false;
          const message = `Ya existe un usuario registrado como ${this.selectedUserTypeLabel} en el sistema.`;
          this.resetToIdentity(message, 'error');
          Swal.fire('Registro no disponible', message, 'error');
          return;
        }

        this.registrationScenario = 'existing-user';
        this.existingSystemUser = foundUser;
        this.pendingUserId = userId;
        this.registerUserStage(this.buildExistingUserRegisterRequest(foundUser), 'existing-user');
      },
      error: () => {
        this.loading = false;
        this.feedbackMessage = 'No se pudo validar la relación del usuario, intenta de nuevo.';
        this.feedbackType = 'error';
        Swal.fire('Error', 'No se pudo validar la relación del usuario, intenta de nuevo.', 'error');
      },
    });
  }

  private buildExistingUserRegisterRequest(user: User): RegisterRequest {
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      defaultRoleId: this.selectedRoleId,
    };
  }

  private buildNewUserRegisterRequest(): RegisterRequest {
    const user: User = {
      name: this.formData.name.trim(),
      email: this.emailInput.trim(),
      password: this.formData.password,
    };

    return {
      user,
      defaultRoleId: this.selectedRoleId,
    };
  }

  private registerUserStage(registerRequest: RegisterRequest, scenario: 'new-user' | 'existing-user'): void {
    if (!this.isMongoObjectId(registerRequest.defaultRoleId)) {
      this.loading = false;
      this.feedbackMessage = 'El rol seleccionado no tiene un identificador válido.';
      this.feedbackType = 'error';
      Swal.fire('Error', this.feedbackMessage, 'error');
      return;
    }

    this.loading = true;
    this.securityService.register(registerRequest).subscribe({
      next: (response) => {
        this.loading = false;

        if (!response.data) {
          this.feedbackMessage = 'No se pudo preparar la sesión temporal del registro.';
          this.feedbackType = 'error';
          Swal.fire('Error', this.feedbackMessage, 'error');
          return;
        }

        this.pendingSession = response.data;
        this.pendingUserId = this.extractPendingUserId(response.data, scenario);
        this.currentStep = 'profile-form';
        this.registrationScenario = scenario;
        this.feedbackMessage = scenario === 'existing-user'
          ? `Usuario encontrado. Completa ahora tus datos de ${this.selectedUserTypeLowercaseLabel}.`
          : `Usuario registrado temporalmente. Completa ahora tus datos de ${this.selectedUserTypeLowercaseLabel}.`;
        this.feedbackType = 'success';
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.feedbackMessage = 'No se pudo iniciar el proceso de registro, intenta de nuevo.';
        this.feedbackType = 'error';
        Swal.fire('Error', 'No se pudo iniciar el proceso de registro, intenta de nuevo.', 'error');
      },
    });
  }

  private extractPendingUserId(session: Session, scenario: 'new-user' | 'existing-user'): string | null {
    const nestedUserId = session.user?.id?.trim();
    if (nestedUserId) {
      return nestedUserId;
    }

    if (scenario === 'existing-user' && this.existingSystemUser?.id?.trim()) {
      return this.existingSystemUser.id.trim();
    }

    return null;
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

  isUserFormValid(): boolean {
    return (
      this.formData.name.trim() !== '' &&
      this.errors.name === '' &&
      this.strength.level === 'strong' &&
      this.errors.password === '' &&
      this.formData.confirmPassword === this.formData.password &&
      this.formData.confirmPassword !== ''
    );
  }

  validateCode(): void {
    this.errors.code = this.profileData.code.trim() ? '' : 'El código del doctor es requerido';
  }

  validateDocument(): void {
    this.errors.document = this.profileData.document.trim() ? '' : 'El documento del paciente es requerido';
  }

  validateYears(): void {
    const yearsValue = String(this.profileData.years ?? '').trim();
    const years = Number(yearsValue);

    if (!yearsValue) {
      this.errors.years = 'Los años del paciente son requeridos';
      return;
    }

    if (!Number.isInteger(years) || years <= 0) {
      this.errors.years = 'Ingresa una cantidad válida de años';
      return;
    }

    this.errors.years = '';
  }

  isProfileFormValid(): boolean {
    if (this.selectedUserTypeId === 'doctor') {
      return this.profileData.code.trim() !== '' && this.errors.code === '';
    }

    const yearsValue = String(this.profileData.years ?? '').trim();

    return (
      this.profileData.document.trim() !== '' &&
      this.errors.document === '' &&
      yearsValue !== '' &&
      this.errors.years === ''
    );
  }

  register(): void {
    if (!this.requireUserTypeSelection()) {
      return;
    }

    if (this.currentStep === 'user-form') {
      this.validateName();
      this.validatePassword();
      this.validateConfirmPassword();

      if (!this.isUserFormValid()) {
        return;
      }

      this.registrationScenario = 'new-user';
      this.registerUserStage(this.buildNewUserRegisterRequest(), 'new-user');
      return;
    }

    if (this.currentStep === 'profile-form') {
      if (this.selectedUserTypeId === 'doctor') {
        this.validateCode();
      } else {
        this.validateDocument();
        this.validateYears();
      }

      if (!this.isProfileFormValid()) {
        return;
      }

      this.completeProfileRegistration();
    }
  }

  private completeProfileRegistration(): void {
    const userId = this.pendingUserId?.trim();

    if (!userId || !this.isMongoObjectId(userId)) {
      this.feedbackMessage = 'No se pudo resolver el userId para continuar con el registro del perfil.';
      this.feedbackType = 'error';
      Swal.fire('Error', this.feedbackMessage, 'error');
      return;
    }

    this.loading = true;

    if (this.isDoctorType) {
      console.log('userId for doctor registration:', userId);
      this.internalServices.registerDoctor({
        code: this.profileData.code.trim(),
        userId,
      } as Doctor).subscribe({
        next: (success) => {
          if (success) {
            this.finishRegistration();
            return;
          }

          this.handleProfileRegistrationError('No se pudo registrar el doctor. Verifica los datos e intenta de nuevo.');
        },
        error: () => this.handleProfileRegistrationError(),
      });
      return;
    }

    this.internalServices.registerPatient({
      document: this.profileData.document.trim(),
      years: Number(String(this.profileData.years ?? '').trim()),
      userId,
    } as Patient).subscribe({
      next: (success) => {
        if (success) {
          this.finishRegistration();
          return;
        }

        this.handleProfileRegistrationError('No se pudo registrar el paciente. Verifica los datos e intenta de nuevo.');
      },
      error: () => this.handleProfileRegistrationError(),
    });
  }

  private finishRegistration(): void {
    this.loading = false;
    this.securityService.saveSession(this.pendingSession as Session);
    localStorage.setItem(
      'userType',
      JSON.stringify({
        type: this.selectedUserType?.id,
      })
    );
    this.feedbackMessage = 'Registro completado correctamente.';
    this.feedbackType = 'success';
    Swal.fire('¡Bienvenido!', 'Tu cuenta ha sido creada exitosamente', 'success');
    this.router.navigate(['/dashboard']);
  }

  private handleProfileRegistrationError(message = 'No se pudo completar el perfil del usuario, intenta de nuevo.'): void {
    this.loading = false;
    this.feedbackMessage = message;
    this.feedbackType = 'error';
    Swal.fire('Error', message, 'error');
  }

  goBackToEmailStep(): void {
    this.resetToIdentity();
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

  get stepTitle(): string {
    if (this.currentStep === 'user-form') {
      return 'Completa tu usuario';
    }

    if (this.currentStep === 'profile-form') {
      return this.selectedUserTypeId === 'doctor' ? 'Completa tu perfil de doctor' : 'Completa tu perfil de paciente';
    }

    return 'Verifica tu correo';
  }

  get stepDescription(): string {
    if (this.currentStep === 'user-form') {
      return 'Define los datos principales del usuario para continuar con el registro.';
    }

    if (this.currentStep === 'profile-form') {
      return this.selectedUserTypeId === 'doctor'
        ? 'Completa la información específica del doctor antes de activar la sesión.'
        : 'Completa la información específica del paciente antes de activar la sesión.';
    }

    return 'Usaremos este correo como tu usuario principal en el sistema.';
  }

  get stepBadgeText(): string {
    if (this.currentStep === 'identity') {
      return 'Paso 1 de 2';
    }

    if (this.currentStep === 'user-form') {
      return 'Paso 2 de 3';
    }

    return this.registrationScenario === 'existing-user' ? 'Paso 2 de 2' : 'Paso 3 de 3';
  }

  get stepActionLabel(): string {
    if (this.currentStep === 'user-form') {
      return 'Guardar usuario y continuar';
    }

    if (this.currentStep === 'profile-form') {
      return 'Finalizar registro';
    }

    return 'Continuar';
  }
}
