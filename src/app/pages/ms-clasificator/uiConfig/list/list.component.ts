import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { DynamicTableComponent, TableAction, TableColumn } from '@app/components/dynamic-table/dynamic-table.component';
import { UIConfig } from '@app/models/ms-clasificator';
import { UIConfigService } from '@app/services/ms-clasificator/ui-config.service';

@Component({
  selector: 'app-ui-config-list',
  standalone: true,
  imports: [CommonModule, DynamicTableComponent, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent {

  private initialPath = '/ui-configs';
  configs = signal<UIConfig[]>([]);
  loading = signal(true);

  columns: TableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'medicalDiagnosticId', label: 'Diagnóstico Médico ID' },
    { key: 'evaluationAreaId', label: 'Área de Evaluación ID' }
  ];

  actionButtons: TableAction[] = [
    { action: 'view', icon: 'visibility', class: 'btn-view' },
    { action: 'edit', icon: 'edit', class: 'btn-edit' },
    { action: 'assignToArea', icon: 'swap_vert', class: 'btn-manage-state' },
    { action: 'manageState', icon: 'settings', class: 'btn-manage-state' },
    { action: 'delete', icon: 'delete', class: 'btn-delete' },
  ];

  constructor(private router: Router, private uiConfigService: UIConfigService) {}

  ngOnInit(): void {
    this.loadConfigs();
  }

  loadConfigs(): void {
    this.loading.set(true);
    this.uiConfigService.findAll().subscribe({
      next: (response) => {
        this.configs.set(response as UIConfig[]);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar UI Configs:', error);
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
      case 'assignToArea':
        this.assignToArea(row.id);
        break;
      case 'manageState':
        this.manageState(row.id);
        break;
      case 'delete':
        this.delete(row.id);
        break;
    }
  }

  manageState(id: string) {
    this.router.navigate([`${this.initialPath}/manage-state/${id}`]);
  }

  view(id: string) {
    this.router.navigate([`${this.initialPath}/view/${id}`]);
  }

  create() {
    this.router.navigate([`${this.initialPath}/create`]);
  }

  edit(id: string) {
    this.router.navigate([`${this.initialPath}/edit/${id}`]);
  }

  assignToArea(id: string) {
    this.router.navigate([`${this.initialPath}/assign-to-area/${id}`]);
  }

  delete(id: string) {
    if (confirm('¿Estás seguro de que quieres eliminar esta configuración?')) {
      this.uiConfigService.delete(Number(id)).subscribe({
        next: () => this.loadConfigs(),
        error: (error) => console.error('Error al eliminar UIConfig:', error)
      });
    }
  }

}
