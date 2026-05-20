import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { DynamicTableComponent, TableAction, TableColumn } from '@app/components/dynamic-table/dynamic-table.component';
import { MedicalDiagnostic } from '@app/models/ms-clasificator';
import { MedicalDiagnosticService } from '@app/services/ms-clasificator/medical-diagnostic.service';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, DynamicTableComponent, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './list.component.html',
})
export class ListComponent {

  private initialPath = '/medical-diagnostics';
  diagnostics = signal<MedicalDiagnostic[]>([]);
  loading = signal(true);

  columns: TableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'diagnosticCode', label: 'Código' },
    { key: 'diagnosticName', label: 'Nombre' },
  ];

  actionButtons: TableAction[] = [
    { action: 'view', icon: 'visibility', class: 'btn-view' },
    { action: 'edit', icon: 'edit', class: 'btn-edit' },
    { action: 'delete', icon: 'delete', class: 'btn-delete' },
    { action: 'subDiagnostics', icon: 'subdirectory_arrow_right', class: 'btn-manage-roles' },
  ];

  constructor(private router: Router, private medicalDiagnosticService: MedicalDiagnosticService) {}

  ngOnInit(): void {
    this.loadDiagnostics();
  }

  loadDiagnostics(): void {
    this.loading.set(true);
    this.medicalDiagnosticService.findAll().subscribe({
      next: (response) => {
        this.diagnostics.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar diagnósticos médicos:', error);
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
      case 'subDiagnostics':
        this.subDiagnostics(row.id);
        break;
    }
  }

  view(id: string) { this.router.navigate([`${this.initialPath}/view/${id}`]); }
  create() { this.router.navigate([`${this.initialPath}/create`]); }
  edit(id: string) { this.router.navigate([`${this.initialPath}/edit/${id}`]); }

  delete(id: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar este diagnóstico?')) return;
    this.medicalDiagnosticService.delete(Number(id)).subscribe({
      next: () => this.loadDiagnostics(),
      error: (err) => console.error('Error eliminando diagnóstico:', err)
    });
  }

  subDiagnostics(id: string) { this.router.navigate([`${this.initialPath}/sub-diagnostics/${id}`]); }
}
