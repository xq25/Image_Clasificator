import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

import { UserRoleService } from '@app/services/ms-security/user-role-service';
import { UserService } from '@app/services/ms-security/user-service';
import { RoleService } from '@app/services/ms-security/role-service';
import { User } from '@app/models/User';
import { Role } from '@app/models/Role';
import { UserRole } from '@app/models/UserRole';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-manage-roles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatListModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './manage-roles.component.html',
  styleUrl: './manage-roles.component.scss',
})
export class ManageRolesComponent implements OnInit {

  userId!: string;

  // 🔥 SIGNALS
  user = signal<User | null>(null);
  userRoleRelations = signal<UserRole[]>([]);
  userRoles = signal<Role[]>([]);
  allRoles = signal<Role[]>([]);

  loadingUserRoles = signal(true);
  loadingAvailableRoles = signal(true);

  removingRoleId = signal<string | null>(null);
  addingRoleId = signal<string | null>(null);

  searchQuery = signal('');
  toast = signal<Toast | null>(null);

  private toastTimer: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userRoleService: UserRoleService,
    private userService: UserService,
    private roleService: RoleService,
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadUser();
    this.loadUserRoles();
    this.loadAllRoles();
  }

  // ─── CARGA DE DATOS ───────────────────────────────────────────

  loadUser(): void {
    this.userService.getUserById(this.userId).subscribe({
      next: (u) => this.user.set(u),
      error: () => this.showToast('Error al cargar el usuario', 'error'),
    });
  }

  loadUserRoles(): void {
    this.loadingUserRoles.set(true);

    this.userRoleService.getUserRoles(this.userId).subscribe({
      next: (data: any) => {
        const relations: UserRole[] = Array.isArray(data)
          ? data
          : (data?.content ?? data?.data ?? []);

        const safeRelations = relations.filter(ur => ur?.role?.id);

        this.userRoleRelations.set(safeRelations);
        this.userRoles.set(safeRelations.map(ur => ur.role));

        this.loadingUserRoles.set(false);
      },
      error: (err) => {
        console.error('Error cargando roles del usuario:', err);
        this.showToast('Error al cargar los roles del usuario', 'error');
        this.loadingUserRoles.set(false);
      },
    });
  }

  loadAllRoles(): void {
    this.loadingAvailableRoles.set(true);

    this.roleService.getRoles().subscribe({
      next: (data: any) => {
        const roles = Array.isArray(data)
          ? data
          : (data?.content ?? data?.data ?? []);

        this.allRoles.set(roles);
        this.loadingAvailableRoles.set(false);
      },
      error: (err) => {
        console.error('Error cargando roles disponibles:', err);
        this.showToast('Error al cargar roles disponibles', 'error');
        this.loadingAvailableRoles.set(false);
      },
    });
  }

  // ─── AGREGAR ROL ──────────────────────────────────────────────

  onAssignRole(event: Event, role: Role): void {
    event.preventDefault();
    event.stopPropagation();
    this.assignRole(role);
  }

  assignRole(role: Role): void {
    if (!role.id) {
      this.showToast('No se pudo determinar el ID del rol', 'error');
      return;
    }

    if (this.hasRole(role)) return;

    this.addingRoleId.set(role.id);

    this.userRoleService.addUserRole(this.userId, role.id).subscribe({
      next: () => {
        this.showToast(`Rol "${role.name}" asignado exitosamente`, 'success');
        this.addingRoleId.set(null);
        this.loadUserRoles();
      },
      error: (err) => {
        console.error('Error asignando rol:', err);
        this.showToast(`Error al asignar el rol "${role.name}"`, 'error');
        this.addingRoleId.set(null);
      },
    });
  }

  // ─── ELIMINAR ROL ─────────────────────────────────────────────

  onRemoveRole(event: Event, role: Role): void {
    event.preventDefault();
    event.stopPropagation();
    this.removeRole(role);
  }

  removeRole(role: Role): void {
    if (!role.id) {
      this.showToast('No se pudo determinar el ID del rol', 'error');
      return;
    }

    if (!confirm(`¿Desasignar el rol "${role.name}"?`)) return;

    const userRole = this.userRoleRelations().find(
      ur => ur.role.id === role.id
    );

    if (!userRole || !userRole.id) {
      this.showToast('No se pudo encontrar la relación de rol', 'error');
      return;
    }

  this.removingRoleId.set(role.id);

    this.userRoleService.removeUserRole(userRole.id).subscribe({
      next: () => {
        this.showToast(`Rol "${role.name}" eliminado exitosamente`, 'success');
        this.removingRoleId.set(null);
        this.loadUserRoles();
      },
      error: (err) => {
        console.error('Error eliminando rol:', err);
        this.showToast(`Error al eliminar el rol "${role.name}"`, 'error');
        this.removingRoleId.set(null);
      },
    });
  }

  // ─── HELPERS ──────────────────────────────────────────────────

  hasRole(role: Role): boolean {
    return this.userRoles().some(r => r.id === role.id);
  }

  getAvailableRoles = computed(() => {
    return this.allRoles().filter(
      r => !this.hasRole(r) &&
        r.name?.toLowerCase().includes(this.searchQuery().toLowerCase())
    );
  });

  getUserInitials(): string {
    const name = this.user()?.name ?? '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  goBack(): void {
    this.router.navigate(['../list'], { relativeTo: this.route });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(
      () => this.toast.set(null),
      3000
    );
  }
}
