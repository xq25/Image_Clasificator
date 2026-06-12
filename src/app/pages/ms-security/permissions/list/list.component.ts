import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DynamicTableComponent, TableAction, TableColumn } from '@app/components/dynamic-table/dynamic-table.component';
import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { EntityDetailComponent, EntityDetailConfig, DetailSectionConfig } from '@app/components/entity-detail/entity-detail.component';
import { Permission, HttpMethod, PermissionModel } from '@app/models/Permission';
import { PermissionService } from '@app/services/ms-security/permission-service';

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

  private initialPath = '/permissions';
  private cdr = inject(ChangeDetectorRef);
  private toastTimer: any;

  // ─── TABLE STATE ─────────────────────────────────────────────────────────────
  permissions = signal<Permission[]>([]);
  loading     = signal(true);

  // ─── PANEL STATE ─────────────────────────────────────────────────────────────
  panelOpen           = signal(false);
  panelLoading        = signal(false);
  isViewMode          = signal(false);
  formConfig          = signal<DynamicFormConfig | null>(null);
  detailConfig        = signal<EntityDetailConfig | null>(null);
  currentPermissionId = signal<string | null>(null);
  toast               = signal<Toast | null>(null);

  readonly pageSize = 10;

  private readonly methodOptions = Object.values(HttpMethod).map(v => ({ value: v, label: v }));
  private readonly modelOptions  = Object.values(PermissionModel).map(v => ({ value: v, label: v }));

  // ─── TABLE CONFIG ─────────────────────────────────────────────────────────────
  columns: TableColumn[] = [
    { key: 'id',     label: 'ID'     },
    { key: 'url',    label: 'URL'    },
    { key: 'method', label: 'Método' },
    { key: 'model',  label: 'Modelo' },
  ];

  actionButtons: TableAction[] = [
    { action: 'view',   icon: 'visibility', class: 'btn-view'   },
    { action: 'edit',   icon: 'edit',       class: 'btn-edit'   },
    { action: 'delete', icon: 'delete',     class: 'btn-delete' },
  ];

  constructor(
    private router: Router,
    private permissionService: PermissionService,
  ) {}

  ngOnInit(): void {
    this.loadPermissions();
  }

  // ─── CARGA DE TABLA ───────────────────────────────────────────────────────────

  loadPermissions(): void {
    this.loading.set(true);
    this.permissionService.getPermissions().subscribe({
      next: (response) => {
        this.permissions.set(response.data ?? []);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar permisos:', error);
        this.loading.set(false);
      },
    });
  }

  // ─── ACCIONES DE TABLA ────────────────────────────────────────────────────────

  handleAction(event: { action: string; row: Permission }): void {
    const { action, row } = event;
    switch (action) {
      case 'view':   this.openView(row.id);   break;
      case 'edit':   this.openEdit(row.id);   break;
      case 'delete': this.delete(row.id);     break;
    }
  }

  // ─── APERTURA DEL PANEL ───────────────────────────────────────────────────────

  openCreate(): void {
    this.panelOpen.set(true);
    this.isViewMode.set(false);
    this.buildConfig(1, null);
  }

  openView(id: string): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.isViewMode.set(true);
    this.currentPermissionId.set(id);

    this.permissionService.getPermissionById(id).subscribe({
      next: (response) => {
        const permission = response.data ?? null;
        if (!permission) { this.closePanel(); return; }

        this.detailConfig.set({
          title:    'Detalle de Permiso',
          subtitle: `ID ${permission.id}`,
          icon:     'verified_user',
          data:     permission,
          fields: [
            { key: 'id',     label: 'ID',         icon: 'tag'      },
            { key: 'url',    label: 'URL',         icon: 'link'     },
            { key: 'method', label: 'Método HTTP', icon: 'http'     },
            { key: 'model',  label: 'Modelo',      icon: 'category' },
          ],
          primaryActionLabel: 'Editar',
          primaryActionIcon:  'edit',
          sections: this.buildDetailSections(permission),
        });

        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Error al cargar el permiso', 'error');
        this.closePanel();
      },
    });
  }

  openEdit(id: string): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.isViewMode.set(false);

    this.permissionService.getPermissionById(id).subscribe({
      next: (response) => {
        this.buildConfig(2, response.data ?? null);
        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Error al cargar el permiso', 'error');
        this.closePanel();
      },
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.isViewMode.set(false);
    this.formConfig.set(null);
    this.detailConfig.set(null);
    this.currentPermissionId.set(null);
    this.panelLoading.set(false);
  }

  // ─── FORM BUILDER ─────────────────────────────────────────────────────────────

  buildConfig(mode: 1 | 2, model: Permission | null): void {
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
          name:        'url',
          label:       'URL',
          type:        'text',
          placeholder: '/api/users',
          validators:  [Validators.required, Validators.minLength(3), Validators.maxLength(200)],
        },
        {
          name:       'method',
          label:      'Método HTTP',
          type:       'select',
          options:    this.methodOptions,
          validators: [Validators.required],
        },
        {
          name:       'model',
          label:      'Modelo',
          type:       'select',
          options:    this.modelOptions,
          validators: [Validators.required],
        },
      ],
    });
  }

  private buildDetailSections(permission: Permission): DetailSectionConfig[] {
    return [];
  }

  // ─── SUBMIT / CANCEL ──────────────────────────────────────────────────────────

  handleFormSubmit(data: any): void {
    const mode = this.formConfig()?.mode;

    if (mode === 1) {
      this.permissionService.createPermission(data).subscribe({
        next: (response) => {
          this.showToast(response.message || 'Permiso creado exitosamente', 'success');
          this.closePanel();
          this.loadPermissions();
        },
        error: () => this.showToast('Error al crear permiso', 'error'),
      });
    } else if (mode === 2) {
      this.permissionService.updatePermission(data.id, data).subscribe({
        next: (response) => {
          this.showToast(response.message || 'Permiso actualizado exitosamente', 'success');
          this.closePanel();
          this.loadPermissions();
        },
        error: () => this.showToast('Error al actualizar permiso', 'error'),
      });
    }
  }

  handleFormCancel(): void {
    this.closePanel();
  }

  // ─── OTRAS ACCIONES ───────────────────────────────────────────────────────────

  delete(id: string): void {
    this.permissionService.deletePermission(id).subscribe({
      next: () => {
        this.showToast('Permiso eliminado exitosamente', 'success');
        this.loadPermissions();
      },
      error: () => this.showToast('Error al eliminar permiso', 'error'),
    });
  }

  // ─── TOAST ────────────────────────────────────────────────────────────────────

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }
}