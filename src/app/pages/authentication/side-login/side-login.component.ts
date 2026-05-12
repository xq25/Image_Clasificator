import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { LoginFormComponent, LoginFormData } from 'src/app/components/login-form/login-form.component';
import { SelectCardComponent, CardItem } from 'src/app/components/select-card/select-card.component';

@Component({
  selector: 'app-side-login',
  imports: [RouterModule, MaterialModule, LoginFormComponent, SelectCardComponent],
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

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Configuración inicial si es necesaria
  }

  onUserTypeSelected(card: CardItem): void {
    this.selectedUserType = card;
    console.log('Usuario seleccionado:', card);
  }

  onLoginSubmit(loginData: LoginFormData): void {
    console.log('Login data:', loginData);
    console.log('User type:', this.selectedUserType);
    // Aquí irá la lógica de autenticación
    this.router.navigate(['']);
  }

  onGoogleLogin(): void {
    console.log('Login con Google iniciado');
    // Aquí iría la lógica de OAuth de Google
  }

  onGithubLogin(): void {
    console.log('Login con GitHub iniciado');
    // Aquí iría la lógica de OAuth de GitHub
  }
}
