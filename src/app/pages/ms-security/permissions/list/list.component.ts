import { Component, signal, ChangeDetectorRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DynamicTableComponent, TableAction, TableColumn } from '@app/components/dynamic-table/dynamic-table.component';
import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { Permission, HttpMethod, PermissionModel } from '@app/models/Permission';
import { PermissionService } from '@app/services/ms-security/permission-service';

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

  private initialPath = '/permissions';

  permissions  = signal<Permission[]>([]);
  loading      = signal(true);

  // Panel lateral
  panelOpen    = signal(false);
  panelLoading = signal(false);
  formConfig   = signal<DynamicFormConfig | null>(null);

  private cdr = inject(ChangeDetectorRef);

  readonly pageSize = 10;

  private readonly methodOptions = Object.values(HttpMethod).map(v => ({ value: v, label: v }));
  private readonly modelOptions  = Object.values(PermissionModel).map(v => ({ value: v, label: v }));

  columns: TableColumn[] = [
    { key: 'id',     label: 'ID'      },
    { key: 'url',    label: 'URL'     },
    { key: 'method', label: 'Método'  },
    { key: 'model',  label: 'Modelo'  },
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

  // ── Carga ────────────────────────────────────────────────────
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

  // ── Acciones de tabla ────────────────────────────────────────
  handleAction(event: { action: string; row: Permission }): void {
    const { action, row } = event;
    switch (action) {
      case 'view':   this.openView(row.id);   break;
      case 'edit':   this.openEdit(row.id);   break;
      case 'delete': this.delete(row.id);     break;
    }
  }

  // ── Panel: apertura ─────────────────────────────────────────
  openCreate(): void {
    this.buildConfig(1, null);
    this.panelOpen.set(true);
  }

  openView(id: string): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.permissionService.getPermissionById(id).subscribe({
      next: (response) => {
        this.buildConfig(0, response.data ?? null);
        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Error: No se pudo cargar el permiso');
        this.closePanel();
      },
    });
  }

  openEdit(id: string): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.permissionService.getPermissionById(id).subscribe({
      next: (response) => {
        this.buildConfig(2, response.data ?? null);
        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Error: No se pudo cargar el permiso');
        this.closePanel();
      },
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.formConfig.set(null);
    this.panelLoading.set(false);
  }

  // ── Construcción del formulario ──────────────────────────────
  buildConfig(mode: 0 | 1 | 2, model: Permission | null): void {
    this.formConfig.set({
      mode,
      model,
      fields: [
        {
          name: 'id',
          label: 'ID',
          type: 'text',
          hidden: mode === 1,
        },
        {
          name: 'url',
          label: 'URL',
          type: 'text',
          placeholder: '/api/users',
          validators: [Validators.required, Validators.minLength(3), Validators.maxLength(200)],
        },
        {
          name: 'method',
          label: 'Método HTTP',
          type: 'select',
          options: this.methodOptions,
          validators: [Validators.required],
        },
        {
          name: 'model',
          label: 'Modelo',
          type: 'select',
          options: this.modelOptions,
          validators: [Validators.required],
        },
      ],
    });
  }

  // ── Submit del formulario ────────────────────────────────────
  handleFormSubmit(data: any): void {
    const config = this.formConfig();
    if (!config) return;

    if (config.mode === 1) {
      this.permissionService.createPermission(data).subscribe({
        next: (response) => {
          alert(response.message || 'Permiso creado exitosamente');
          this.closePanel();
          this.loadPermissions();
        },
        error: (error) => {
          console.error('Error al crear permiso:', error);
          alert('Error al crear permiso');
        },
      });
    } else if (config.mode === 2) {
      this.permissionService.updatePermission(data.id, data).subscribe({
        next: (response) => {
          alert(response.message || 'Permiso actualizado exitosamente');
          this.closePanel();
          this.loadPermissions();
        },
        error: (error) => {
          console.error('Error al actualizar permiso:', error);
          alert('Error al actualizar permiso');
        },
      });
    }
  }

  handleFormCancel(): void {
    this.closePanel();
  }

  // ── Eliminar ─────────────────────────────────────────────────
  delete(id: string): void {
    if (!confirm('¿Estás seguro de que quieres eliminar este permiso?')) return;
    this.permissionService.deletePermission(id).subscribe({
      next:  ()      => this.loadPermissions(),
      error: (error) => console.error('Error al eliminar permiso:', error),
    });
  }
}