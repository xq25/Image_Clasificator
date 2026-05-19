import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DynamicTableComponent, TableColumn, TableAction } from '@app/components/dynamic-table/dynamic-table.component';
import { Role } from '@app/models/Role';
import { RoleService } from '@app/services/ms-security/role-service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, DynamicTableComponent, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class ListComponent {

  private initialPath = '/roles';
  roles = signal<Role[]>([]);
  loading = signal(true);

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

  handleAction(event: any) {
    const { action, row } = event;
    switch (action) {
      case 'view':
        this.view(row.id);
        break;
      case 'edit':
        this.edit(row.id);
        break;
      case 'delete':
        this.delete(row.id);
        break;
      case 'managePermissions':
        this.managePermissions(row.id);
        break;
    }
  }

  view(role_id: string) {
    this.router.navigate([`${this.initialPath}/view/${role_id}`]);
  }

  create() {
    this.router.navigate([`${this.initialPath}/create`]);
  }

  edit(role_id: string) {
    this.router.navigate([`${this.initialPath}/edit/${role_id}`]);
  }

  delete(role_id: string) {
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

  managePermissions(role_id: string) {
    this.router.navigate([`${this.initialPath}/role-permissions/${role_id}`]);
  }

}
