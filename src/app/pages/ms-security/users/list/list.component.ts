import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DynamicTableComponent, TableColumn, TableAction } from '@app/components/dynamic-table/dynamic-table.component';
import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { User } from '@app/models/User';
import { UserService } from '@app/services/ms-security/user-service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Validators } from '@angular/forms';
import { ChangeDetectorRef, inject } from '@angular/core';
import { MatDialogClose } from "@angular/material/dialog";

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

  private initialPath = '/users';
  users = signal<User[]>([]);
  loading = signal(true);

  // Panel lateral
  panelOpen = signal(false);
  panelLoading = signal(false);
  formConfig = signal<DynamicFormConfig | null>(null);

  private cdr = inject(ChangeDetectorRef);

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
        this.openView(row.id);
        break;
      case 'edit':
        this.openEdit(row.id);
        break;
      case 'delete':
        this.delete(row.id);
        break;
      case 'manageRoles':
        this.router.navigate([`${this.initialPath}/user-roles/${row.id}`]);
        break;
    }
  }

  openCreate(): void {
    this.buildConfig(1, null);
    this.panelOpen.set(true);
  }

  openView(user_id: string): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.userService.getUserById(user_id).subscribe({
      next: (response) => {
        this.buildConfig(0, response.data ?? null);
        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Error: No se pudo cargar el usuario');
        this.closePanel();
      }
    });
  }

  openEdit(user_id: string): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.userService.getUserById(user_id).subscribe({
      next: (response) => {
        this.buildConfig(2, response.data ?? null);
        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Error: No se pudo cargar el usuario');
        this.closePanel();
      }
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.formConfig.set(null);
    this.panelLoading.set(false);
  }

  buildConfig(mode: 0 | 1 | 2, model: User | null): void {
    this.formConfig.set({
      mode,
      model,
      fields: [
        {
          name: 'id',
          label: 'ID',
          type: 'text'
        },
        {
          name: 'name',
          label: 'Nombre',
          type: 'text',
          placeholder: 'Ingresa el nombre completo',
          validators: [Validators.required, Validators.minLength(3)]
        },
        {
          name: 'email',
          label: 'Correo electrónico',
          type: 'email',
          placeholder: 'usuario@email.com',
          validators: [Validators.required, Validators.email]
        },
        {
          name: 'password',
          label: 'Contraseña',
          type: 'password',
          placeholder: 'Mínimo 8 caracteres',
          hidden: mode !== 1,
          validators: mode === 1
            ? [Validators.required, Validators.minLength(8)]
            : []
        }
      ]
    });
  }

  handleFormSubmit(data: any): void {
    const config = this.formConfig();
    if (!config) return;
    const mode = config.mode;

    if (mode === 1) {
      this.userService.createUser(data).subscribe({
        next: (response) => {
          alert(response.message || 'Usuario creado exitosamente');
          this.closePanel();
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error al crear usuario:', error);
          alert('Error al crear usuario');
        }
      });
    } else if (mode === 2) {
      this.userService.updateUser(data.id, data).subscribe({
        next: (response) => {
          alert(response.message || 'Usuario actualizado exitosamente');
          this.closePanel();
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error al actualizar usuario:', error);
          alert('Error al actualizar usuario');
        }
      });
    }
  }

  handleFormCancel(): void {
    this.closePanel();
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
}