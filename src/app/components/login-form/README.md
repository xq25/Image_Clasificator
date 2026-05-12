# Login Form Component

Un componente Angular reutilizable para formularios de login con validación reactiva, autenticación social y soporte para diferentes tipos de usuario.

## Características

- 📧 **Email y Password**: Campos validados con Angular Reactive Forms
- 👁️ **Toggle de Contraseña**: Ver/ocultar contraseña
- 🔐 **Validaciones**: Email válido y contraseña requerida
- 🌐 **OAuth Social**: Botones de Google y GitHub
- 👥 **Soporte de Tipos de Usuario**: Muestra el tipo de usuario seleccionado
- ✨ **Material Design**: Iconos y componentes de Angular Material
- 📱 **Responsive**: Se adapta a todos los tamaños de pantalla

## Instalación

El componente está listo para usar. Solo importa `LoginFormComponent` en tu módulo o componente.

```typescript
import { LoginFormComponent } from './components/login-form/login-form.component';
```

## Uso

### Ejemplo Básico

```typescript
import { Component } from '@angular/core';
import { LoginFormComponent, LoginFormData } from './components/login-form/login-form.component';

@Component({
  selector: 'app-login-page',
  imports: [LoginFormComponent],
  template: `
    <app-login-form
      [selectedUserType]="selectedUserType"
      (formSubmit)="onLoginSubmit($event)"
      (loginWithGoogle)="onGoogleLogin()"
      (loginWithGithub)="onGithubLogin()">
    </app-login-form>
  `
})
export class LoginPageComponent {
  selectedUserType: { id: string; name: string } | null = null;

  onLoginSubmit(data: LoginFormData): void {
    console.log('Login data:', data);
    // Enviar al backend
  }

  onGoogleLogin(): void {
    console.log('Google login iniciado');
  }

  onGithubLogin(): void {
    console.log('GitHub login iniciado');
  }
}
```

## Interfaz LoginFormData

```typescript
export interface LoginFormData {
  email: string;        // Email del usuario
  password: string;     // Contraseña
  userType?: string;    // Tipo de usuario (optional)
}
```

## Propiedades (Inputs)

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `selectedUserType` | `{ id: string; name: string } \| null` | `null` | Información del tipo de usuario seleccionado |

## Eventos (Outputs)

| Evento | Tipo | Descripción |
|--------|------|-------------|
| `formSubmit` | `EventEmitter<LoginFormData>` | Se emite cuando el formulario es válido y se envía |
| `loginWithGoogle` | `EventEmitter<void>` | Se emite cuando se hace click en el botón de Google |
| `loginWithGithub` | `EventEmitter<void>` | Se emite cuando se hace click en el botón de GitHub |

## Validaciones

El formulario valida automáticamente:
- **Email**: Debe ser un email válido
- **Password**: Requerido, mínimo 1 carácter

Los mensajes de error se muestran automáticamente cuando el campo es tocado e inválido.

## Estilos

El componente utiliza:
- **Colores**: Azul (#539bff) y blanco como colores principales
- **Material Design**: Componentes de Angular Material
- **Iconos**: Material Icons para prefijos y visibilidad
- **Animaciones**: Transiciones suaves en botones

## Características Especiales

### Toggle de Contraseña

El usuario puede hacer clic en el icono de visibilidad para mostrar/ocultar la contraseña en tiempo real.

### Validación Reactiva

El botón de envío está deshabilitado hasta que el formulario sea válido:
```html
<button 
  [disabled]="!form.valid"
  mat-flat-button 
  color="primary" 
  class="w-full">
  Sign In
</button>
```

### Badge de Tipo de Usuario

Si hay un tipo de usuario seleccionado, muestra un badge con información:
```html
@if (selectedUserType) {
  <div class="user-type-badge">
    <mat-icon>check_circle</mat-icon>
    <span>{{ selectedUserType.name }} mode</span>
  </div>
}
```

### Botones de Redes Sociales

Incluye botones pre-diseñados para Google y GitHub con iconos.

## Ejemplo Completo

```typescript
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoginFormComponent, LoginFormData } from './components/login-form/login-form.component';

@Component({
  selector: 'app-auth-login',
  imports: [LoginFormComponent],
  template: `
    <div class="login-container">
      <h1>Bienvenido</h1>
      <app-login-form
        [selectedUserType]="selectedUserType"
        (formSubmit)="handleLogin($event)"
        (loginWithGoogle)="handleGoogleLogin()"
        (loginWithGithub)="handleGithubLogin()">
      </app-login-form>
    </div>
  `,
  styles: [`
    .login-container {
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
    }
  `]
})
export class AuthLoginComponent {
  selectedUserType: { id: string; name: string } | null = {
    id: 'doctor',
    name: 'Doctor'
  };

  constructor(private router: Router) {}

  handleLogin(data: LoginFormData): void {
    console.log('Login attempt:', data);
    
    // Validar con el backend
    // this.authService.login(data).subscribe({
    //   next: (response) => {
    //     this.router.navigate(['/dashboard']);
    //   },
    //   error: (error) => {
    //     console.error('Login failed:', error);
    //   }
    // });
  }

  handleGoogleLogin(): void {
    console.log('Iniciando Google OAuth');
    // Implementar Google OAuth
  }

  handleGithubLogin(): void {
    console.log('Iniciando GitHub OAuth');
    // Implementar GitHub OAuth
  }
}
```

## Notas

- El componente es **standalone** y no requiere módulos adicionales
- Utiliza **Angular 17+** con el nuevo modelo de componentes
- Las validaciones se ejecutan en tiempo real
- El formulario es completamente reactivo
- Compatible con Reactive Forms de Angular

## Pruebas

El componente incluye tests unitarios completos. Para ejecutarlos:

```bash
ng test
```

Los tests cubren:
- Creación del componente
- Validación del formulario
- Envío del formulario
- Eventos de redes sociales
- Toggle de visibilidad de contraseña
