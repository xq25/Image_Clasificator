import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DynamicTableComponent, TableColumn, TableAction } from '@app/components/dynamic-table/dynamic-table.component';
import { User } from '@app/models/User';
import { UserService } from '@app/services/ms-security/user-service';
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

  private initialPath = '/users';
  users = signal<User[]>([]);
  loading = signal(true);

  columns: TableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nombre' },
    { key: 'email', label: 'Correo' }
  ];

  actionButtons: TableAction[] = [
    { action: 'view', icon: 'visibility', class: 'btn-view' },
    { action: 'edit', icon: 'edit', class: 'btn-edit' },
    { action: 'delete', icon: 'delete', class: 'btn-delete' },
    { action: 'manageRoles', icon: 'admin_panel_settings', class: 'btn-manage-roles' },
  ];

  constructor(private router: Router, private userService: UserService) {} 

  ngOnInit(): void {
    this.loadUsers();
  }

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
      case 'manageRoles':
        this.manageRoles(row.id);
        break;
    }
  }

  view(user_id: string) {
    this.router.navigate([`${this.initialPath}/view/${user_id}`]);
  }

  create() {
    this.router.navigate([`${this.initialPath}/create`]);
  }

  edit(user_id: string) {
    this.router.navigate([`${this.initialPath}/edit/${user_id}`]);
  }

  delete(user_id: string) {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      this.userService.deleteUser(user_id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error al eliminar usuario:', error);
        }
      });
    }
  }

  manageRoles(user_id: string) {
    this.router.navigate([`${this.initialPath}/user-roles/${user_id}`]);
  }

}
