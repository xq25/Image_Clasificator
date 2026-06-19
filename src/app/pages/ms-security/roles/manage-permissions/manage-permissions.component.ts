import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { forkJoin } from 'rxjs';

import { RolePermissionService } from '@app/services/ms-security/role-permission-service';
import { RoleService } from '@app/services/ms-security/role-service';
import { PermissionService } from '@app/services/ms-security/permission-service';
import { Role } from '@app/models/Role';
import { Permission } from '@app/models/Permission';
import { RolePermission } from '@app/models/RolePermission';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-manage-permissions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './manage-permissions.component.html',
  styleUrl: './manage-permissions.component.scss',
})
export class ManagePermissionsComponent implements OnInit {

  roleId!: string;

  role = signal<Role | null>(null);
  allPermissions = signal<Permission[]>([]);
  rolePermissionRelations = signal<RolePermission[]>([]);
  assignedIds = signal<Set<string>>(new Set());

  loading = signal(true);
  processingId = signal<string | null>(null);
  searchQuery = signal('');
  toast = signal<Toast | null>(null);

  private toastTimer: any;

  totalCount    = computed(() => this.allPermissions().length);
  assignedCount = computed(() => this.assignedIds().size);

  uniqueModels = computed(() => {
    const models = new Set(
      this.allPermissions()
        .map(p => p.model)
        .filter((m): m is string => !!m)
    );
    return Array.from(models).sort();
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rolePermissionService: RolePermissionService,
    private roleService: RoleService,
    private permissionService: PermissionService,
  ) {}

  ngOnInit(): void {
    this.roleId = this.route.snapshot.paramMap.get('id') ?? '';
    // Rol y permisos se cargan en paralelo
    this.roleService.getRoleById(this.roleId).subscribe({
      next: (r) => this.role.set(r.data ?? null),
      error: () => this.showToast('Error al cargar el rol', 'error'),
    });
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    // Permisos disponibles + permisos asignados al rol en paralelo
    forkJoin({
      permissions: this.permissionService.getPermissions(),
      assigned:    this.rolePermissionService.getRolePermissions(this.roleId),
    }).subscribe({
      next: ({ permissions, assigned }) => {
        this.allPermissions.set(permissions.data ?? []);

        const relations = (assigned.data ?? []).filter(rp => rp?.permission?.id);
        this.rolePermissionRelations.set(relations);
        this.assignedIds.set(new Set(relations.map(rp => rp.permission!.id!)));

        this.loading.set(false);
      },
      error: () => {
        this.showToast('Error al cargar los permisos', 'error');
        this.loading.set(false);
      },
    });
  }

  isAssigned(permissionId: string): boolean {
    return this.assignedIds().has(permissionId);
  }

  onTogglePermission(permission: Permission): void {
    if (!permission?.id) return;
    this.isAssigned(permission.id) ? this.removePermission(permission) : this.addPermission(permission);
  }

  private addPermission(permission: Permission): void {
    this.processingId.set(permission.id!);
    this.rolePermissionService.addRolePermission(this.roleId, permission.id!).subscribe({
      next: (response) => {
        const newRelation = response.data;
        if (!newRelation) {
          this.processingId.set(null);
          this.showToast('No se pudo asignar el permiso', 'error');
          return;
        }
        const safeRelation: RolePermission = { ...newRelation, permission: newRelation.permission ?? permission };
        this.rolePermissionRelations.update(prev => [...prev, safeRelation]);
        this.assignedIds.update(prev => new Set([...prev, permission.id!]));
        this.processingId.set(null);
        this.showToast(`Permiso "${permission.url}" asignado`, 'success');
      },
      error: () => {
        this.processingId.set(null);
        this.showToast('Error al asignar el permiso', 'error');
      },
    });
  }

  private removePermission(permission: Permission): void {
    this.processingId.set(permission.id!);
    const relation = this.rolePermissionRelations().find(rp => rp?.permission?.id === permission.id);
    if (!relation?.id) {
      this.showToast('No se encontró la relación', 'error');
      this.processingId.set(null);
      this.loadData();
      return;
    }
    this.rolePermissionService.removeRolePermission(relation.id).subscribe({
      next: () => {
        this.rolePermissionRelations.update(prev => prev.filter(rp => rp.id !== relation.id));
        this.assignedIds.update(prev => {
          const next = new Set(prev);
          next.delete(permission.id!);
          return next;
        });
        this.processingId.set(null);
        this.showToast(`Permiso "${permission.url}" eliminado`, 'success');
      },
      error: () => {
        this.processingId.set(null);
        this.showToast('Error al eliminar el permiso', 'error');
      },
    });
  }

  getFilteredByModel(model: string): Permission[] {
    const query = this.searchQuery().trim().toLowerCase();
    return this.allPermissions().filter(p => {
      if (p.model !== model) return false;
      if (!query) return true;
      return p.url?.toLowerCase().includes(query) || p.method?.toLowerCase().includes(query);
    });
  }

  getAssignedCountByModel(model: string): number {
    return this.allPermissions().filter(p => p.model === model && this.isAssigned(p.id!)).length;
  }

  onBack(): void {
    this.router.navigate(['roles/list']);
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }
}
