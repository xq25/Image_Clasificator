import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { RolePermissionService } from '@app/services/ms-security/role-permission-service';
import { RoleService } from '@app/services/ms-security/role-service';
import { PermissionService } from '@app/services/ms-security/permission-service';
import { Role } from '@app/models/Role';
import { Permission, PermissionModel } from '@app/models/Permission';
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
    MatProgressSpinnerModule
  ],
  templateUrl: './manage-permissions.component.html',
  styleUrl: './manage-permissions.component.scss',
})
export class ManagePermissionsComponent implements OnInit {

  roleId!: string;

  // Todos los valores del enum para organizar la tabla
  permissionModels = Object.values(PermissionModel);

  // SIGNALS
  role = signal<Role | null>(null);
  allPermissions = signal<Permission[]>([]);
  rolePermissionRelations = signal<RolePermission[]>([]);
  assignedIds = signal<Set<string>>(new Set());

  loading = signal(true);
  processingId = signal<string | null>(null);
  searchQuery = signal('');
  toast = signal<Toast | null>(null);

  private toastTimer: any;

  // Contadores
  totalCount = computed(() => this.allPermissions().length);
  assignedCount = computed(() => this.assignedIds().size);
  
  // Modelos únicos de los permisos actuales
  uniqueModels = computed(() => {
    const models = new Set(
      this.allPermissions()
        .map(p => p.model)
        .filter((m): m is string => m !== undefined && m !== null)
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
    this.loadRole();
    this.loadData();
  }

  loadRole(): void {
    this.roleService.getRoleById(this.roleId).subscribe({
      next: (r) => this.role.set(r),
      error: () => this.showToast('Error al cargar el rol', 'error'),
    });
  }

  loadData(): void {
    this.loading.set(true);

    this.permissionService.getPermissions().subscribe({
      next: (data: any) => {
        const permissions = Array.isArray(data) ? data : (data?.content ?? data?.data ?? []);
        this.allPermissions.set(permissions);
        this.loadAssigned();
      },
      error: () => {
        this.showToast('Error al cargar los permisos', 'error');
        this.loading.set(false);
      }
    });
  }

  loadAssigned(): void {
    this.rolePermissionService.getRolePermissions(this.roleId).subscribe({
      next: (data: any) => {
        const relations: RolePermission[] = Array.isArray(data)
          ? data
          : (data?.content ?? data?.data ?? []);

        const safeRelations = relations.filter(rp => rp?.permission?.id);
        this.rolePermissionRelations.set(safeRelations);

        const ids = new Set<string>(safeRelations.map(rp => rp.permission!.id!));
        this.assignedIds.set(ids);
        this.loading.set(false);
      },
      error: () => {
        this.showToast('Error al cargar permisos asignados', 'error');
        this.loading.set(false);
      }
    });
  }

  isAssigned(permissionId: string): boolean {
    return this.assignedIds().has(permissionId);
  }

  onTogglePermission(permission: Permission): void {
    if (!permission?.id) return;

    if (this.isAssigned(permission.id)) {
      this.removePermission(permission);
    } else {
      this.addPermission(permission);
    }
  }

  private addPermission(permission: Permission): void {
    this.processingId.set(permission.id!);

    this.rolePermissionService.addRolePermission(this.roleId, permission.id!).subscribe({
      next: (newRelation: RolePermission) => {
        const safeRelation: RolePermission = {
          ...newRelation,
          permission: newRelation.permission ?? permission
        };

        this.rolePermissionRelations.update(prev => [...prev, safeRelation]);
        this.assignedIds.update(prev => new Set([...prev, permission.id!]));
        this.processingId.set(null);
        this.showToast(`Permiso "${permission.url}" asignado`, 'success');
      },
      error: () => {
        this.processingId.set(null);
        this.showToast('Error al asignar el permiso', 'error');
      }
    });
  }

  private removePermission(permission: Permission): void {
    this.processingId.set(permission.id!);

    const relation = this.rolePermissionRelations().find(rp => rp?.permission?.id === permission.id);

    if (!relation?.id) {
      this.showToast('No se encontró la relación', 'error');
      this.processingId.set(null);
      this.loadAssigned();
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
      }
    });
  }

  getFilteredByModel(model: string): Permission[] {
    const query = this.searchQuery().trim().toLowerCase();
    return this.allPermissions().filter(p => {
      const matchesModel = p.model === model;
      if (!query) return matchesModel;
      return matchesModel && (
        p.url?.toLowerCase().includes(query) ||
        p.method?.toLowerCase().includes(query)
      );
    });
  }

  getAssignedCountByModel(model: string): number {
    return this.allPermissions().filter(
      p => p.model === model && this.isAssigned(p.id!)
    ).length;
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
