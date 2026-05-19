import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { PermissionService } from '@app/services/ms-security/permission-service';
import { Permission, HttpMethod, PermissionModel } from '@app/models/Permission';

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

  private readonly methodOptions = Object.values(HttpMethod).map((value) => ({ value, label: value }));
  private readonly modelOptions = Object.values(PermissionModel).map((value) => ({ value, label: value }));

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private permissionService: PermissionService,
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
      this.loadPermission(id, 0);
    } else if (routePath === 'edit/:id' && id) {
      this.loadPermission(id, 2);
    } else {
      console.warn('[ManageComponent] Ruta no reconocida:', routePath);
      this.router.navigate(['permissions/list']);
    }
  }

  private loadPermission(id: string, mode: 0 | 2): void {
    this.permissionService.getPermissionById(id).subscribe({
      next: (response) => {
        this.buildConfig(mode, response.data ?? null);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar permiso:', error);
        this.router.navigate(['permissions/list']);
      }
    });
  }

  private buildConfig(mode: 0 | 1 | 2, model: Permission | null): void {
    this.formConfig = {
      mode,
      model,
      fields: [
        {
          name: 'id',
          label: 'ID',
          type: 'text',
          hidden: mode === 1
        },
        {
          name: 'url',
          label: 'URL',
          type: 'text',
          placeholder: '/api/users',
          validators: [Validators.required, Validators.minLength(3), Validators.maxLength(200)]
        },
        {
          name: 'method',
          label: 'Método HTTP',
          type: 'select',
          options: this.methodOptions,
          validators: [Validators.required]
        },
        {
          name: 'model',
          label: 'Modelo',
          type: 'select',
          options: this.modelOptions,
          validators: [Validators.required]
        }
      ]
    };
  }

  handleFormSubmit(data: any): void {
    if (this.formConfig.mode === 1) {
      this.createPermission(data);
    } else if (this.formConfig.mode === 2) {
      this.updatePermission(data);
    }
  }

  private createPermission(data: Permission): void {
    this.permissionService.createPermission(data).subscribe({
      next: (response) => {
        alert(response.message || 'Permiso creado exitosamente');
        this.router.navigate(['permissions/list']);
      },
      error: (error) => {
        console.error('Error al crear permiso:', error);
        alert(error?.message || 'Error al crear permiso');
      }
    });
  }

  private updatePermission(data: Permission): void {
    this.permissionService.updatePermission(data.id, data).subscribe({
      next: (response) => {
        alert(response.message || 'Permiso actualizado exitosamente');
        this.router.navigate(['permissions/list']);
      },
      error: (error) => {
        console.error('Error al actualizar permiso:', error);
        alert('Error al actualizar permiso');
      }
    });
  }

  handleFormCancel(): void {
    this.router.navigate(['permissions/list']);
  }
}