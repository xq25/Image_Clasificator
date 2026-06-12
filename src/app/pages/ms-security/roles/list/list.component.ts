import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DynamicTableComponent, TableColumn, TableAction } from '@app/components/dynamic-table/dynamic-table.component';
import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { EntityDetailComponent, EntityDetailConfig, DetailSectionConfig } from '@app/components/entity-detail/entity-detail.component';
import { Role } from '@app/models/Role';
import { RoleService } from '@app/services/ms-security/role-service';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
    DynamicTableComponent,
    DynamicFormComponent,
    EntityDetailComponent,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class ListComponent implements OnInit {

  private initialPath = '/roles';
  private cdr = inject(ChangeDetectorRef);
  private toastTimer: any;

  // ─── TABLE STATE ─────────────────────────────────────────────────────────────
  roles   = signal<Role[]>([]);
  loading = signal(true);

  // ─── PANEL STATE ─────────────────────────────────────────────────────────────
  panelOpen     = signal(false);
  panelLoading  = signal(false);
  isViewMode    = signal(false);
  formConfig    = signal<DynamicFormConfig | null>(null);
  detailConfig  = signal<EntityDetailConfig | null>(null);
  currentRoleId = signal<string | null>(null);
  toast         = signal<Toast | null>(null);

  // ─── TABLE CONFIG ─────────────────────────────────────────────────────────────
  columns: TableColumn[] = [
    { key: 'id',          label: 'ID'          },
    { key: 'name',        label: 'Nombre'      },
    { key: 'description', label: 'Descripción' },
  ];

  actionButtons: TableAction[] = [
    { action: 'view',              icon: 'visibility', class: 'btn-view'               },
    { action: 'edit',              icon: 'edit',       class: 'btn-edit'               },
    { action: 'delete',            icon: 'delete',     class: 'btn-delete'             },
    { action: 'managePermissions', icon: 'security',   class: 'btn-manage-permissions' },
  ];

  constructor(
    private router: Router,
    private roleService: RoleService,
  ) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  // ─── CARGA DE TABLA ───────────────────────────────────────────────────────────

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
      },
    });
  }

  // ─── ACCIONES DE TABLA ────────────────────────────────────────────────────────

  handleAction(event: any): void {
    const { action, row } = event;
    switch (action) {
      case 'view':              this.openView(row.id); break;
      case 'edit':              this.openEdit(row.id); break;
      case 'delete':            this.delete(row.id);   break;
      case 'managePermissions': this.router.navigate([`${this.initialPath}/role-permissions/${row.id}`]); break;
    }
  }

  // ─── APERTURA DEL PANEL ───────────────────────────────────────────────────────

  openCreate(): void {
    this.panelOpen.set(true);
    this.isViewMode.set(false);
    this.buildConfig(1, null);
  }

  openView(roleId: string): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.isViewMode.set(true);
    this.currentRoleId.set(roleId);

    this.roleService.getRoleById(roleId).subscribe({
      next: (response) => {
        const role = response.data ?? null;
        if (!role) { this.closePanel(); return; }

        this.detailConfig.set({
          title:    'Detalle del Rol',
          subtitle: role.name,
          icon:     'security',
          data:     role,
          fields: [
            { key: 'id',          label: 'ID',          icon: 'tag'         },
            { key: 'name',        label: 'Nombre',      icon: 'badge'       },
            { key: 'description', label: 'Descripción', icon: 'description' },
          ],
          primaryActionLabel: 'Editar',
          primaryActionIcon:  'edit',
          sections: this.buildDetailSections(role),
        });

        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Error al cargar el rol', 'error');
        this.closePanel();
      },
    });
  }

  openEdit(roleId: string): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.isViewMode.set(false);

    this.roleService.getRoleById(roleId).subscribe({
      next: (response) => {
        this.buildConfig(2, response.data ?? null);
        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Error al cargar el rol', 'error');
        this.closePanel();
      },
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.isViewMode.set(false);
    this.formConfig.set(null);
    this.detailConfig.set(null);
    this.currentRoleId.set(null);
    this.panelLoading.set(false);
  }

  // ─── FORM BUILDER ─────────────────────────────────────────────────────────────

  buildConfig(mode: 1 | 2, model: Role | null): void {
    this.formConfig.set({
      mode,
      model,
      fields: [
        {
          name:   'id',
          label:  'ID',
          type:   'text',
          hidden: mode === 1,
        },
        {
          name:        'name',
          label:       'Nombre del rol',
          type:        'text',
          placeholder: 'Ej: ADMIN, USER, EDITOR...',
          validators:  [Validators.required, Validators.minLength(2), Validators.maxLength(50)],
        },
        {
          name:        'description',
          label:       'Descripción',
          type:        'textarea',
          placeholder: 'Describe las responsabilidades de este rol',
          validators:  [Validators.required, Validators.maxLength(200)],
        },
      ],
    });
  }

  private buildDetailSections(role: Role): DetailSectionConfig[] {
    return [];
  }

  // ─── SUBMIT / CANCEL ──────────────────────────────────────────────────────────

  handleFormSubmit(data: any): void {
    const mode = this.formConfig()?.mode;

    if (mode === 1) {
      this.roleService.createRole(data).subscribe({
        next: (response) => {
          this.showToast(response.message || 'Rol creado exitosamente', 'success');
          this.closePanel();
          this.loadRoles();
        },
        error: () => this.showToast('Error al crear rol', 'error'),
      });
    } else if (mode === 2) {
      this.roleService.updateRole(data.id, data).subscribe({
        next: (response) => {
          this.showToast(response.message || 'Rol actualizado exitosamente', 'success');
          this.closePanel();
          this.loadRoles();
        },
        error: () => this.showToast('Error al actualizar rol', 'error'),
      });
    }
  }

  handleFormCancel(): void {
    this.closePanel();
  }

  // ─── OTRAS ACCIONES ───────────────────────────────────────────────────────────

  delete(roleId: string): void {
    this.roleService.deleteRole(roleId).subscribe({
      next: () => {
        this.showToast('Rol eliminado exitosamente', 'success');
        this.loadRoles();
      },
      error: () => this.showToast('Error al eliminar rol', 'error'),
    });
  }

  // ─── TOAST ────────────────────────────────────────────────────────────────────

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }
}