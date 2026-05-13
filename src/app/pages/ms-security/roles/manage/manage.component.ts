import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { RoleService } from '@app/services/ms-security/role-service';
import { Role } from '@app/models/Role';

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
    private roleService: RoleService,
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
      this.loadRole(id, 0);

    } else if (routePath === 'edit/:id' && id) {
      this.loadRole(id, 2);

    } else {
      console.warn('[ManageComponent] Ruta no reconocida:', routePath);
      this.router.navigate(['roles/list']);
    }
  }

  private loadRole(id: string, mode: 0 | 2): void {
    this.roleService.getRoleById(id).subscribe({
      next: (role) => {
        this.buildConfig(mode, role);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar rol:', error);
        this.router.navigate(['roles/list']);
      }
    });
  }

  private buildConfig(mode: 0 | 1 | 2, model: Role | null): void {
    this.formConfig = {
      mode,
      fields: [
        {
          name: 'id',
          label: 'ID',
          type: 'text',
          hidden: mode !== 0
        },
        {
          name: 'name',
          label: 'Nombre del rol',
          type: 'text',
          placeholder: 'Ej: ADMIN, USER, EDITOR...',
          validators: [Validators.required, Validators.minLength(2), Validators.maxLength(50)]
        },
        {
          name: 'description',
          label: 'Descripción',
          type: 'textarea',
          placeholder: 'Describe las responsabilidades de este rol',
          validators: [Validators.required, Validators.maxLength(200)]
        }
      ],
      model
    };
  }

  handleFormSubmit(data: any): void {
    if (this.formConfig.mode === 1) {
      this.createRole(data);
    } else if (this.formConfig.mode === 2) {
      this.updateRole(data);
    }
  }

  private createRole(data: Role): void {
    this.roleService.createRole(data).subscribe({
      next: () => {
        alert('Rol creado exitosamente');
        this.router.navigate(['roles/list']);
      },
      error: (error) => {
        console.error('Error al crear rol:', error);
        alert('Error al crear rol');
      }
    });
  }

  private updateRole(data: Role): void {
    this.roleService.updateRole(data.id, data).subscribe({
      next: () => {
        alert('Rol actualizado exitosamente');
        this.router.navigate(['roles/list']);
      },
      error: (error) => {
        console.error('Error al actualizar rol:', error);
      }
    });
  }
  handleFormCancel(): void {
    this.router.navigate(['roles/list']);
  }
  

}
