import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { DynamicTableComponent, TableAction, TableColumn } from '@app/components/dynamic-table/dynamic-table.component';
import { Permission } from '@app/models/Permission';
import { PermissionService } from '@app/services/ms-security/permission-service';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, DynamicTableComponent, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class ListComponent {

  private initialPath = '/permissions';
  permissions = signal<Permission[]>([]);
  loading = signal(true);

  columns: TableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'url', label: 'URL' },
    { key: 'method', label: 'Método' },
    { key: 'model', label: 'Modelo' }
  ];

  actionButtons: TableAction[] = [
    { action: 'view', icon: 'visibility', class: 'btn-view' },
    { action: 'edit', icon: 'edit', class: 'btn-edit' },
    { action: 'delete', icon: 'delete', class: 'btn-delete' },
  ];

  constructor(private router: Router, private permissionService: PermissionService) {}

  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions(): void {
    this.loading.set(true);
    this.permissionService.getPermissions().subscribe({
      next: (response: any) => {
        const permissions = Array.isArray(response) ? response : (response?.content ?? response?.data ?? []);
        this.permissions.set(permissions);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar permisos:', error);
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
    }
  }

  view(permissionId: string) {
    this.router.navigate([`${this.initialPath}/view/${permissionId}`]);
  }

  create() {
    this.router.navigate([`${this.initialPath}/create`]);
  }

  edit(permissionId: string) {
    this.router.navigate([`${this.initialPath}/edit/${permissionId}`]);
  }

  delete(permissionId: string) {
    if (confirm('¿Estás seguro de que quieres eliminar este permiso?')) {
      this.permissionService.deletePermission(permissionId).subscribe({
        next: () => {
          this.loadPermissions();
        },
        error: (error) => {
          console.error('Error al eliminar permiso:', error);
        }
      });
    }
  }
}