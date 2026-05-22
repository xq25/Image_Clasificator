import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { MaterialModule } from 'src/app/material.module';
import { SecurityService, PasswordStrength } from '@app/services/ms-security/security';
import { InternalServicesService } from '@app/services/ms-clasificator/internal-services.service';
import { RegisterRequest } from '@app/models/RegisterRequest';
import { Session } from '@app/models/Session';
import { User } from '@app/models/User';
import { environment } from '@environments/environment';

type RegisterStep = 'user-form' | 'patient-form';
type FeedbackType = 'info' | 'success' | 'error';

@Component({
	selector: 'app-side-register',
	standalone: true,
	imports: [CommonModule, FormsModule, RouterModule, MaterialModule],
	templateUrl: './side-register.component.html',
	styleUrl: './side-register.component.scss',
})
export class AppSideRegisterComponent {
	currentStep: RegisterStep = 'user-form';
	loading = false;
	hidePassword = true;
	hideConfirmPassword = true;

	emailInput = '';
	registeredUserId = '';
	pendingSession: Session | null = null;

	feedbackMessage = '';
	feedbackType: FeedbackType = 'info';

	formData = {
		name: '',
		password: '',
		confirmPassword: ''
	};

	profileData = {
		document: '',
		years: null as number | null,
	};

	errors = {
		email: '',
		name: '',
		password: '',
		confirmPassword: '',
		document: '',
		years: ''
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
			special: false
		},
		error: ''
	};

	constructor(
		private router: Router,
		public securityService: SecurityService,
		private internalServicesService: InternalServicesService,
	) {}

	get stepBadgeText(): string {
		return this.currentStep === 'user-form' ? 'Paso 1 de 2' : 'Paso 2 de 2';
	}

	get stepTitle(): string {
		return this.currentStep === 'user-form'
			? 'Crear cuenta de usuario'
			: 'Completa tu perfil de paciente';
	}

	get stepDescription(): string {
		return this.currentStep === 'user-form'
			? 'Ingresa tus datos base para crear la cuenta y validar el registro.'
			: 'Finaliza tu registro con la información del paciente.';
	}

	get stepActionLabel(): string {
		return this.currentStep === 'user-form'
			? 'Registrarme'
			: 'Finalizar registro';
	}

	togglePasswordVisibility(): void {
		this.hidePassword = !this.hidePassword;
	}

	toggleConfirmPasswordVisibility(): void {
		this.hideConfirmPassword = !this.hideConfirmPassword;
	}

	goToLogin(): void {
		this.router.navigate(['/auth/authentication/login']);
	}

	goBackToUserStep(): void {
		this.currentStep = 'user-form';
		this.feedbackMessage = '';
		this.pendingSession = null;
	}

	validateEmail(): void {
		this.errors.email = this.securityService.validateEmail(this.emailInput.trim());
	}

	validateName(): void {
		this.errors.name = this.securityService.validateName(this.formData.name.trim());
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
			this.formData.confirmPassword,
		);
	}

	validateDocument(): void {
		const normalized = this.profileData.document.trim();
		if (!normalized) {
			this.errors.document = 'El documento es requerido';
			return;
		}

		const documentPattern = /^(TI|CC)\d{6,11}$/;
		if (!documentPattern.test(normalized)) {
			this.errors.document = 'El documento debe comenzar con TI o CC seguido de 6 a 11 dígitos (ejemplo: TI123456, CC12345678901)';
			return;
		}

		this.errors.document = '';
	}

	validateYears(): void {
		const years = Number(this.profileData.years);
		if (!Number.isFinite(years) || years <= 0) {
			this.errors.years = 'Ingresa una edad valida';
			return;
		}

		if (years > 120) {
			this.errors.years = 'La edad no puede ser mayor a 120';
			return;
		}

		this.errors.years = '';
	}

	isUserFormValid(): boolean {
		this.validateEmail();
		this.validateName();
		this.validatePassword();
		this.validateConfirmPassword();

		return (
			!this.errors.email &&
			!this.errors.name &&
			!this.errors.password &&
			!this.errors.confirmPassword &&
			this.strength.level === 'strong'
		);
	}

	isProfileFormValid(): boolean {
		this.validateDocument();
		this.validateYears();

		return !this.errors.document && !this.errors.years;
	}

	register(): void {
		if (this.loading) {
			return;
		}

		if (this.currentStep === 'user-form') {
			this.registerUser();
			return;
		}

		this.registerPatient();
	}

	private registerUser(): void {
		this.feedbackMessage = '';
		if (!this.isUserFormValid()) {
			return;
		}

		const request: RegisterRequest = {
			user: {
				name: this.formData.name.trim(),
				email: this.emailInput.trim(),
				password: this.formData.password
			} as User,
			defaultRoleId: environment.securityRoles.patientRole
		};

		this.loading = true;
		this.securityService.register(request).subscribe({
			next: (response) => {
				this.loading = false;

				if (!response.success) {
					this.showFeedback(response.message || 'No se pudo registrar el usuario.', 'error');
					return;
				}

				const userId = response.data?.user?.id;
				if (!userId) {
					this.showFeedback('El registro se completo, pero no se pudo obtener el usuario para crear el perfil.', 'error');
					return;
				}

				this.pendingSession = response.data || null;
				this.registeredUserId = userId;
				this.currentStep = 'patient-form';
				this.showFeedback('Usuario creado correctamente. Ahora completa el perfil de paciente.', 'success');
			},
			error: (error) => {
				this.loading = false;
				this.showFeedback(this.extractErrorMessage(error), 'error');
			}
		});
	}

	private registerPatient(): void {
		this.feedbackMessage = '';

		if (!this.registeredUserId) {
			this.showFeedback('No existe un usuario registrado para asociar el perfil de paciente.', 'error');
			return;
		}

		if (!this.isProfileFormValid()) {
			return;
		}

		const payload = {
			document: this.profileData.document.trim(),
			years: Number(this.profileData.years),
			userId: this.registeredUserId
		};

		this.loading = true;
		this.internalServicesService.registerPatient(payload).subscribe({
			next: (response) => {
				this.loading = false;

				if (!response) {
					this.showFeedback('No se pudo crear el perfil de paciente.', 'error');
					return;
				}

				if (this.pendingSession) {
					this.securityService.saveSession(this.pendingSession);
					this.pendingSession = null;
				}

				this.showFeedback('Registro completado con exito. Ya puedes iniciar sesion.', 'success');
				this.router.navigate(['/dashboard']);
			},
			error: (error) => {
				this.loading = false;
				this.showFeedback(this.extractErrorMessage(error), 'error');
			}
		});
	}

	private showFeedback(message: string, type: FeedbackType): void {
		this.feedbackMessage = message;
		this.feedbackType = type;
	}

	private extractErrorMessage(error: any): string {
		return (
			error?.error?.message ||
			error?.error?.errors?.message ||
			error?.message ||
			'Ocurrio un error inesperado. Intentalo de nuevo.'
		);
	}
}
