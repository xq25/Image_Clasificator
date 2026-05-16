import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { DynamicTableComponent, TableAction, TableColumn } from '@app/components/dynamic-table/dynamic-table.component';
import { Doctor } from '@app/models/ms-clasificator';
import { DoctorService } from '@app/services/ms-clasificator/doctor.service';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, DynamicTableComponent, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class ListComponent {

  private initialPath = '/doctors';
  doctors = signal<Doctor[]>([]);
  loading = signal(true);

  columns: TableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'code', label: 'Código' },
    { key: 'userId', label: 'ID Usuario' }
  ];

  actionButtons: TableAction[] = [
    { action: 'view', icon: 'visibility', class: 'btn-view' },
    { action: 'edit', icon: 'edit', class: 'btn-edit' },
    { action: 'delete', icon: 'delete', class: 'btn-delete' },
    { action: 'manageAreas', icon: 'medical_services', class: 'btn-manage-roles' },
  ];

  constructor(private router: Router, private doctorService: DoctorService) {}

  ngOnInit(): void {
    this.loadDoctors();
  }

  loadDoctors(): void {
    this.loading.set(true);
    this.doctorService.findAll().subscribe({
      next: (response) => {
        this.doctors.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar doctores:', error);
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
      case 'manageAreas':
        this.manageAreas(row.id);
        break;
    }
  }

  view(doctorId: string) {
    this.router.navigate([`${this.initialPath}/view/${doctorId}`]);
  }

  create() {
    this.router.navigate([`${this.initialPath}/create`]);
  }

  edit(doctorId: string) {
    this.router.navigate([`${this.initialPath}/edit/${doctorId}`]);
  }

  delete(doctorId: string) {
    if (confirm('¿Estás seguro de que quieres eliminar este doctor?')) {
      this.doctorService.delete(Number(doctorId)).subscribe({
        next: () => {
          this.loadDoctors();
        },
        error: (error) => {
          console.error('Error al eliminar doctor:', error);
        }
      });
    }
  }

  manageAreas(doctorId: string) {
    this.router.navigate([`${this.initialPath}/doctor-areas/${doctorId}`]);
  }

}