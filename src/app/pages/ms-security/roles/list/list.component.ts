import { Component, signal, ChangeDetectorRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DynamicTableComponent, TableColumn, TableAction } from '@app/components/dynamic-table/dynamic-table.component';
import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { Role } from '@app/models/Role';
import { RoleService } from '@app/services/ms-security/role-service';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
    DynamicTableComponent,
    DynamicFormComponent,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class ListComponent {

  private initialPath = '/roles';
  roles = signal<Role[]>([]);
  loading = signal(true);

  // Panel lateral
  panelOpen = signal(false);
  panelLoading = signal(false);
  formConfig = signal<DynamicFormConfig | null>(null);

  private cdr = inject(ChangeDetectorRef);

  columns: TableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' }
  ];

  actionButtons: TableAction[] = [
    { action: 'view', icon: 'visibility', class: 'btn-view' },
    { action: 'edit', icon: 'edit', class: 'btn-edit' },
    { action: 'delete', icon: 'delete', class: 'btn-delete' },
    { action: 'managePermissions', icon: 'security', class: 'btn-manage-permissions' },
  ];

  constructor(private router: Router, private roleService: RoleService) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading.set(true);
    this.roleService.getRoles().subscribe({
      next: (response) => {
        this.roles.set(response.data ?? []);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar roles:', error);
        this.loading.set(false);
      }
    });
  }

  handleAction(event: any): void {
    const { action, row } = event;
    switch (action) {
      case 'view':
        this.openView(row.id);
        break;
      case 'edit':
        this.openEdit(row.id);
        break;
      case 'delete':
        this.delete(row.id);
        break;
      case 'managePermissions':
        this.router.navigate([`${this.initialPath}/role-permissions/${row.id}`]);
        break;
    }
  }

  openCreate(): void {
    this.buildConfig(1, null);
    this.panelOpen.set(true);
  }

  openView(role_id: string): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.roleService.getRoleById(role_id).subscribe({
      next: (response) => {
        this.buildConfig(0, response.data ?? null);
        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Error: No se pudo cargar el rol');
        this.closePanel();
      }
    });
  }

  openEdit(role_id: string): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.roleService.getRoleById(role_id).subscribe({
      next: (response) => {
        this.buildConfig(2, response.data ?? null);
        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Error: No se pudo cargar el rol');
        this.closePanel();
      }
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.formConfig.set(null);
    this.panelLoading.set(false);
  }

  buildConfig(mode: 0 | 1 | 2, model: Role | null): void {
    this.formConfig.set({
      mode,
      model,
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
      ]
    });
  }

  handleFormSubmit(data: any): void {
    const config = this.formConfig();
    if (!config) return;
    const mode = config.mode;

    if (mode === 1) {
      this.roleService.createRole(data).subscribe({
        next: (response) => {
          alert(response.message || 'Rol creado exitosamente');
          this.closePanel();
          this.loadRoles();
        },
        error: (error) => {
          console.error('Error al crear rol:', error);
          alert('Error al crear rol');
        }
      });
    } else if (mode === 2) {
      this.roleService.updateRole(data.id, data).subscribe({
        next: (response) => {
          alert(response.message || 'Rol actualizado exitosamente');
          this.closePanel();
          this.loadRoles();
        },
        error: (error) => {
          console.error('Error al actualizar rol:', error);
          alert('Error al actualizar rol');
        }
      });
    }
  }

  handleFormCancel(): void {
    this.closePanel();
  }

  delete(role_id: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este rol?')) {
      this.roleService.deleteRole(role_id).subscribe({
        next: () => {
          this.loadRoles();
        },
        error: (error) => {
          console.error('Error al eliminar rol:', error);
        }
      });
    }
  }
}