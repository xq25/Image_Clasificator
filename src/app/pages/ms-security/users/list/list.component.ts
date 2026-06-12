import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DynamicTableComponent, TableColumn, TableAction } from '@app/components/dynamic-table/dynamic-table.component';
import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { EntityDetailComponent, EntityDetailConfig, DetailSectionConfig } from '@app/components/entity-detail/entity-detail.component';
import { User } from '@app/models/User';
import { UserService } from '@app/services/ms-security/user-service';

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

  private initialPath = '/users';
  private cdr = inject(ChangeDetectorRef);
  private toastTimer: any;

  // ─── TABLE STATE ─────────────────────────────────────────────────────────────
  users   = signal<User[]>([]);
  loading = signal(true);

  // ─── PANEL STATE ─────────────────────────────────────────────────────────────
  panelOpen     = signal(false);
  panelLoading  = signal(false);
  isViewMode    = signal(false);
  formConfig    = signal<DynamicFormConfig | null>(null);
  detailConfig  = signal<EntityDetailConfig | null>(null);
  currentUserId = signal<string | null>(null);
  toast         = signal<Toast | null>(null);

  // ─── TABLE CONFIG ─────────────────────────────────────────────────────────────
  columns: TableColumn[] = [
    { key: 'id',    label: 'ID'     },
    { key: 'name',  label: 'Nombre' },
    { key: 'email', label: 'Correo' },
  ];

  actionButtons: TableAction[] = [
    { action: 'view',        icon: 'visibility',         class: 'btn-view'         },
    { action: 'edit',        icon: 'edit',               class: 'btn-edit'         },
    { action: 'delete',      icon: 'delete',             class: 'btn-delete'       },
    { action: 'manageRoles', icon: 'admin_panel_settings', class: 'btn-manage-roles' },
  ];

  constructor(
    private router: Router,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  // ─── CARGA DE TABLA ───────────────────────────────────────────────────────────

  loadUsers(): void {
    this.loading.set(true);
    this.userService.getUsers().subscribe({
      next: (response) => {
        this.users.set(response.data ?? []);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.loading.set(false);
      },
    });
  }

  // ─── ACCIONES DE TABLA ────────────────────────────────────────────────────────

  handleAction(event: any): void {
    const { action, row } = event;
    switch (action) {
      case 'view':        this.openView(row.id); break;
      case 'edit':        this.openEdit(row.id); break;
      case 'delete':      this.delete(row.id);   break;
      case 'manageRoles': this.router.navigate([`${this.initialPath}/user-roles/${row.id}`]); break;
    }
  }

  // ─── APERTURA DEL PANEL ───────────────────────────────────────────────────────

  openCreate(): void {
    this.panelOpen.set(true);
    this.isViewMode.set(false);
    this.buildConfig(1, null);
  }

  openView(userId: string): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.isViewMode.set(true);
    this.currentUserId.set(userId);

    this.userService.getUserById(userId).subscribe({
      next: (response) => {
        const user = response.data ?? null;
        if (!user) { this.closePanel(); return; }

        this.detailConfig.set({
          title:    'Detalle de Usuario',
          subtitle: user.name,
          icon:     'person',
          data:     user,
          fields: [
            { key: 'id',    label: 'ID',     icon: 'tag'   },
            { key: 'name',  label: 'Nombre', icon: 'badge' },
            { key: 'email', label: 'Correo', icon: 'email' },
          ],
          primaryActionLabel: 'Editar',
          primaryActionIcon:  'edit',
          sections: this.buildDetailSections(user),
        });

        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Error al cargar el usuario', 'error');
        this.closePanel();
      },
    });
  }

  openEdit(userId: string): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.isViewMode.set(false);

    this.userService.getUserById(userId).subscribe({
      next: (response) => {
        this.buildConfig(2, response.data ?? null);
        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Error al cargar el usuario', 'error');
        this.closePanel();
      },
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.isViewMode.set(false);
    this.formConfig.set(null);
    this.detailConfig.set(null);
    this.currentUserId.set(null);
    this.panelLoading.set(false);
  }

  // ─── FORM BUILDER ─────────────────────────────────────────────────────────────

  buildConfig(mode: 1 | 2, model: User | null): void {
    this.formConfig.set({
      mode,
      model,
      fields: [
        {
          name:  'id',
          label: 'ID',
          type:  'text',
          hidden: mode === 1,
        },
        {
          name:        'name',
          label:       'Nombre',
          type:        'text',
          placeholder: 'Ingresa el nombre completo',
          validators:  [Validators.required, Validators.minLength(3)],
        },
        {
          name:        'email',
          label:       'Correo electrónico',
          type:        'email',
          placeholder: 'usuario@email.com',
          validators:  [Validators.required, Validators.email],
        },
        {
          name:        'password',
          label:       'Contraseña',
          type:        'password',
          placeholder: 'Mínimo 8 caracteres',
          hidden:      mode !== 1,
          validators:  mode === 1
            ? [Validators.required, Validators.minLength(8)]
            : [],
        },
      ],
    });
  }

  private buildDetailSections(user: User): DetailSectionConfig[] {
    return [];
  }

  // ─── SUBMIT / CANCEL ──────────────────────────────────────────────────────────

  handleFormSubmit(data: any): void {
    const mode = this.formConfig()?.mode;

    if (mode === 1) {
      this.userService.createUser(data).subscribe({
        next: (response) => {
          this.showToast(response.message || 'Usuario creado exitosamente', 'success');
          this.closePanel();
          this.loadUsers();
        },
        error: () => this.showToast('Error al crear usuario', 'error'),
      });
    } else if (mode === 2) {
      this.userService.updateUser(data.id, data).subscribe({
        next: (response) => {
          this.showToast(response.message || 'Usuario actualizado exitosamente', 'success');
          this.closePanel();
          this.loadUsers();
        },
        error: () => this.showToast('Error al actualizar usuario', 'error'),
      });
    }
  }

  handleFormCancel(): void {
    this.closePanel();
  }

  // ─── OTRAS ACCIONES ───────────────────────────────────────────────────────────

  delete(userId: string): void {
    this.userService.deleteUser(userId).subscribe({
      next: () => {
        this.showToast('Usuario eliminado exitosamente', 'success');
        this.loadUsers();
      },
      error: () => this.showToast('Error al eliminar usuario', 'error'),
    });
  }

  // ─── TOAST ────────────────────────────────────────────────────────────────────

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }
}