import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { UserService } from '@app/services/ms-security/user-service';
import { User } from '@app/models/User';

@Component({
  selector: 'app-manage',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './manage.component.html',
  styleUrl: './manage.component.scss',
})
export class ManageComponent implements OnInit {

  formConfig!: DynamicFormConfig;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const routePath = this.route.snapshot.routeConfig?.path ?? '';
    const id = this.route.snapshot.paramMap.get('id');

    if (routePath === 'create') {
      this.buildConfig(1, null);
      this.loading = false;
      this.cdr.detectChanges();

    } else if (routePath === 'view/:id' && id) {
      this.loadUser(id, 0);

    } else if (routePath === 'edit/:id' && id) {
      this.loadUser(id, 2);

    } else {
      console.warn('[ManageComponent] Ruta no reconocida:', routePath);
      this.router.navigate(['../list'], { relativeTo: this.route });
    }
  }

  private loadUser(id: string, mode: 0 | 2): void {
    this.userService.getUserById(id).subscribe({
      next: (user) => {
        this.buildConfig(mode, user);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Error: No se pudo cargar el usuario');
        this.router.navigate(['../list'], { relativeTo: this.route });
      }
    });
  }

  buildConfig(mode: 0 | 1 | 2, model: User | null): void {
    this.formConfig = {
      mode,
      model,
      fields: [
        {
          name: 'id',
          label: 'ID',
          type: 'text'
        },
        {
          name: 'name',
          label: 'Nombre',
          type: 'text',
          placeholder: 'Ingresa el nombre completo',
          validators: [Validators.required, Validators.minLength(3)]
        },
        {
          name: 'email',
          label: 'Correo electrónico',
          type: 'email',
          placeholder: 'usuario@email.com',
          validators: [Validators.required, Validators.email]
        },
        {
          name: 'password',
          label: 'Contraseña',
          type: 'password',
          placeholder: 'Mínimo 8 caracteres',
          hidden: mode !== 1,
          validators: mode === 1
            ? [Validators.required, Validators.minLength(8)]
            : []
        }
      ]
    };
  }

  handleFormSubmit(data: any): void {
    const mode = this.formConfig.mode;

    if (mode === 1) {
      // CREATE
      this.userService.createUser(data).subscribe({
        next: () => {
          alert('Usuario creado exitosamente');
          this.router.navigate(['../list'], { relativeTo: this.route });
        },
        error: (error) => {
          console.error('Error al crear usuario:', error);
          alert('Error al crear usuario');
        }
      });

    } else if (mode === 2) {
      // UPDATE
      this.userService.updateUser(data.id, data).subscribe({
        next: () => {
          alert('Usuario actualizado exitosamente');
          this.router.navigate(['../list'], { relativeTo: this.route });
        },
        error: (error) => {
          console.error('Error al actualizar usuario:', error);
          alert('Error al actualizar usuario');
        }
      });
    }
  }

  handleFormCancel(): void {
    this.router.navigate(['../list'], { relativeTo: this.route });
  }
}
