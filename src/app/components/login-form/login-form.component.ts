import { Component, Output, EventEmitter, Input } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';

export interface LoginFormData {
  email: string;
  password: string;
  userType?: string | number;
}

@Component({
  selector: 'app-login-form',
  imports: [MaterialModule, ReactiveFormsModule, CommonModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
})
export class LoginFormComponent {
  @Output() formSubmit = new EventEmitter<LoginFormData>();
  @Output() loginWithGoogle = new EventEmitter<void>();
  @Output() loginWithGithub = new EventEmitter<void>();
  @Input() selectedUserType: { id: string | number; name: string } | null = null;

  hidePassword = true;

  form = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.email
    ]),
    password: new FormControl('', [Validators.required]),
  });

  get f() {
    return this.form.controls;
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  submit(): void {
    if (this.form.valid) {
      const loginData: LoginFormData = {
        email: this.form.get('email')?.value || '',
        password: this.form.get('password')?.value || '',
        userType: this.selectedUserType?.id
      };
      this.formSubmit.emit(loginData);
    }
  }

  onGoogleClick(): void {
    this.loginWithGoogle.emit();
  }

  onGithubClick(): void {
    this.loginWithGithub.emit();
  }
}
