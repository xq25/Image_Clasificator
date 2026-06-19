import { Component, OnInit, signal, ChangeDetectorRef, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { DynamicTableComponent, TableColumn, TableAction } from '@app/components/dynamic-table/dynamic-table.component';
import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { EntityDetailComponent, EntityDetailConfig, DetailSectionConfig } from '@app/components/entity-detail/entity-detail.component';
import { ConfirmDeleteComponent } from '@app/components/confirm-delete/confirm-delete.component';
import { User } from '@app/models/User';
import { Role } from '@app/models/Role';
import { UserRole } from '@app/models/UserRole';
import { UserService } from '@app/services/ms-security/user-service';
import { RoleService } from '@app/services/ms-security/role-service';
import { UserRoleService } from '@app/services/ms-security/user-role-service';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DynamicTableComponent,
    DynamicFormComponent,
    EntityDetailComponent,
    ConfirmDeleteComponent,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class ListComponent implements OnInit {

  private cdr = inject(ChangeDetectorRef);
  private toastTimer: any;

  // ─── TABLE STATE ─────────────────────────────────────────────────────────────
  users   = signal<User[]>([]);
  loading = signal(true);

  // ─── PANEL STATE ─────────────────────────────────────────────────────────────
  panelOpen     = signal(false);
  panelLoading  = signal(false);
  isViewMode    = signal(false);
  isRolesMode   = signal(false);
  formConfig    = signal<DynamicFormConfig | null>(null);
  detailConfig  = signal<EntityDetailConfig | null>(null);
  currentUserId = signal<string | null>(null);
  toast         = signal<Toast | null>(null);

  // ─── CONFIRM DELETE ───────────────────────────────────────────────────────────
  showDeleteConfirm    = signal(false);
  deleteTargetId       = signal<string | null>(null);
  deleteConfirmMessage = signal('');

  // ─── ROLES PANEL STATE ───────────────────────────────────────────────────────
  managedUser       = signal<User | null>(null);
  userRoles         = signal<UserRole[]>([]);
  allRoles          = signal<Role[]>([]);
  rolesLoading      = signal(false);
  addingRole        = signal(false);
  removingRoleId    = signal<string | null>(null);
  selectedRoleIdValue: string | null = null;
  rolesPage         = signal(0);
  readonly ROLES_PAGE_SIZE = 5;

  availableRoles = computed(() => {
    const assigned = new Set(this.userRoles().map(ur => ur.role.id));
    return this.allRoles().filter(r => !assigned.has(r.id));
  });

  pagedRoles = computed(() => {
    const start = this.rolesPage() * this.ROLES_PAGE_SIZE;
    return this.userRoles().slice(start, start + this.ROLES_PAGE_SIZE);
  });

  totalRolesPages = computed(() =>
    Math.ceil(this.userRoles().length / this.ROLES_PAGE_SIZE)
  );

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
    private userService: UserService,
    private roleService: RoleService,
    private userRoleService: UserRoleService,
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
      case 'delete':      this.openDeleteConfirm(row.id); break;
      case 'manageRoles': this.openManageRoles(row); break;
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

  openManageRoles(user: User): void {
    this.panelOpen.set(true);
    this.isViewMode.set(false);
    this.isRolesMode.set(true);
    this.rolesPage.set(0);
    this.userRoles.set([]);
    this.allRoles.set([]);
    this.selectedRoleIdValue = null;
    this.rolesLoading.set(true);
    this.managedUser.set(user);

    this.roleService.getRoles().subscribe({
      next: (rolesRes) => {
        this.allRoles.set(rolesRes.data ?? []);

        this.userRoleService.getUserRoles(user.id!).subscribe({
          next: (res) => {
            this.userRoles.set(res.data ?? []);
            this.rolesLoading.set(false);
          },
          error: () => {
            this.showToast('Error al cargar roles del usuario', 'error');
            this.rolesLoading.set(false);
          },
        });
      },
      error: () => {
        this.showToast('Error al cargar la lista de roles', 'error');
        this.rolesLoading.set(false);
      },
    });
  }

  addRoleToUser(): void {
    const roleId = this.selectedRoleIdValue;
    const userId = this.managedUser()?.id;
    if (!roleId || !userId) return;

    this.addingRole.set(true);
    this.userRoleService.addUserRole(userId, roleId).subscribe({
      next: (res) => {
        if (res.data) {
          this.userRoles.update(list => [...list, res.data!]);
        }
        this.selectedRoleIdValue = null;
        this.addingRole.set(false);
        this.showToast('Rol agregado al usuario', 'success');
      },
      error: () => {
        this.addingRole.set(false);
        this.showToast('Error al agregar el rol', 'error');
      },
    });
  }

  removeRoleFromUser(userRole: UserRole): void {
    this.removingRoleId.set(userRole.id);
    this.userRoleService.removeUserRole(userRole.id).subscribe({
      next: () => {
        this.userRoles.update(list => list.filter(ur => ur.id !== userRole.id));
        this.removingRoleId.set(null);
        this.showToast('Rol quitado del usuario', 'success');
      },
      error: () => {
        this.removingRoleId.set(null);
        this.showToast('Error al quitar el rol', 'error');
      },
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.isViewMode.set(false);
    this.isRolesMode.set(false);
    this.formConfig.set(null);
    this.detailConfig.set(null);
    this.currentUserId.set(null);
    this.panelLoading.set(false);
    this.managedUser.set(null);
    this.userRoles.set([]);
    this.allRoles.set([]);
    this.selectedRoleIdValue = null;
    this.rolesPage.set(0);
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

  openDeleteConfirm(id: string): void {
    this.deleteTargetId.set(id);
    this.deleteConfirmMessage.set(`¿Está seguro que desea eliminar el usuario con ID "${id}"?`);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.deleteTargetId.set(null);
    this.deleteConfirmMessage.set('');
  }

  confirmDelete(): void {
    const id = this.deleteTargetId();
    if (id === null) return;
    this.showDeleteConfirm.set(false);
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.showToast('Usuario eliminado exitosamente', 'success');
        this.deleteTargetId.set(null);
        this.loadUsers();
      },
      error: () => {
        this.showToast('Error al eliminar usuario', 'error');
        this.deleteTargetId.set(null);
      },
    });
  }

  // ─── TOAST ────────────────────────────────────────────────────────────────────

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }
}