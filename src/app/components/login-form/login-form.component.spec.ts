import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginFormComponent, LoginFormData } from './login-form.component';
import { MaterialModule } from 'src/app/material.module';
import { ReactiveFormsModule } from '@angular/forms';

describe('LoginFormComponent', () => {
  let component: LoginFormComponent;
  let fixture: ComponentFixture<LoginFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginFormComponent, MaterialModule, ReactiveFormsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have invalid form when empty', () => {
    expect(component.form.valid).toBeFalsy();
  });

  it('should have valid form with correct email and password', () => {
    component.form.patchValue({
      email: 'test@example.com',
      password: 'password123'
    });
    expect(component.form.valid).toBeTruthy();
  });

  it('should emit formSubmit event with login data', (done) => {
    const loginData: LoginFormData = {
      email: 'test@example.com',
      password: 'password123',
      userType: 'doctor'
    };

    component.selectedUserType = { id: 'doctor', name: 'Doctor' };
    component.form.patchValue({
      email: loginData.email,
      password: loginData.password
    });

    component.formSubmit.subscribe(data => {
      expect(data.email).toBe(loginData.email);
      expect(data.password).toBe(loginData.password);
      expect(data.userType).toBe('doctor');
      done();
    });

    component.submit();
  });

  it('should toggle password visibility', () => {
    expect(component.hidePassword).toBeTruthy();
    component.togglePasswordVisibility();
    expect(component.hidePassword).toBeFalsy();
    component.togglePasswordVisibility();
    expect(component.hidePassword).toBeTruthy();
  });

  it('should emit loginWithGoogle event', (done) => {
    component.loginWithGoogle.subscribe(() => {
      expect(true).toBeTruthy();
      done();
    });
    component.onGoogleClick();
  });

  it('should emit loginWithGithub event', (done) => {
    component.loginWithGithub.subscribe(() => {
      expect(true).toBeTruthy();
      done();
    });
    component.onGithubClick();
  });
});
