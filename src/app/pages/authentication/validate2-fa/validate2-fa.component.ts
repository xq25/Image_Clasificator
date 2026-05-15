import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { SecurityService } from '@app/services/ms-security/security';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-validate2-fa',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './validate2-fa.component.html',
  styleUrl: './validate2-fa.component.scss',
})
export class Validate2FAComponent implements OnInit {
  isLoading = false;
  sessionEmail = '';
  hasSession = true;

  form = new FormGroup({
    code: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(6),
      Validators.pattern(/^[0-9]+$/),
    ]),
  });

  constructor(
    private router: Router,
    public securityService: SecurityService
  ) {}

  ngOnInit(): void {
    const session = this.securityService.getCurrentSession();
    this.hasSession = !!session;
    this.sessionEmail = session?.user?.email || '';

    if (!session) {
      Swal.fire(
        'Sesión no disponible',
        'Debes iniciar sesión nuevamente para validar el código 2FA.',
        'warning'
      );
    }
  }

  get f() {
    return this.form.controls;
  }

  submit(): void {
    if (this.form.invalid || this.isLoading) {
      this.form.markAllAsTouched();
      return;
    }

    const code = (this.form.value.code || '').trim();
    this.isLoading = true;

    this.securityService.validate2FACode(code).subscribe({
      next: (isValid) => {
        this.isLoading = false;

        if (isValid) {
          Swal.fire('Código validado', 'Acceso autorizado correctamente', 'success');
          this.router.navigate(['/dashboard']);
          return;
        }

        Swal.fire('Código inválido', 'Revisa el código e inténtalo de nuevo', 'error');
      },
      error: () => {
        this.isLoading = false;
        Swal.fire('Error', 'No se pudo validar el código 2FA', 'error');
      }
    });
  }

  goBackToLogin(): void {
    this.securityService.logout();
    this.router.navigate(['/auth/authentication/login']);
  }

  clearCode(): void {
    this.form.patchValue({ code: '' });
    this.form.markAsUntouched();
    this.form.markAsPristine();
  }

}
