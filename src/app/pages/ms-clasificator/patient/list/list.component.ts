import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { DynamicTableComponent, TableAction, TableColumn } from '@app/components/dynamic-table/dynamic-table.component';
import { Patient } from '@app/models/ms-clasificator';
import { PatientService } from '@app/services/ms-clasificator/patient.service';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, DynamicTableComponent, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './list.component.html',
})
export class ListComponent {

  private initialPath = '/patients';
  patients = signal<Patient[]>([]);
  loading = signal(true);

  columns: TableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'document', label: 'Documento' },
    { key: 'years', label: 'Años' },
    { key: 'userId', label: 'ID Usuario' }
  ];

  actionButtons: TableAction[] = [
    { action: 'view', icon: 'visibility', class: 'btn-view' },
    { action: 'edit', icon: 'edit', class: 'btn-edit' },
    { action: 'delete', icon: 'delete', class: 'btn-delete' },
  ];

  constructor(private router: Router, private patientService: PatientService) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.loading.set(true);
    this.patientService.findAll().subscribe({
      next: (response) => {
        this.patients.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar pacientes:', error);
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

  view(patientId: string) {
    this.router.navigate([`${this.initialPath}/view/${patientId}`]);
  }

  create() {
    this.router.navigate([`${this.initialPath}/create`]);
  }

  edit(patientId: string) {
    this.router.navigate([`${this.initialPath}/edit/${patientId}`]);
  }

  delete(patientId: string) {
    if (confirm('¿Estás seguro de que quieres eliminar este paciente?')) {
      this.patientService.delete(Number(patientId)).subscribe({
        next: () => {
          this.loadPatients();
        },
        error: (error) => {
          console.error('Error al eliminar paciente:', error);
        }
      });
    }
  }
}