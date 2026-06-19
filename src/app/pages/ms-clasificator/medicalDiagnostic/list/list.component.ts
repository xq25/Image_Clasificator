import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DynamicTableComponent, TableAction, TableColumn } from '@app/components/dynamic-table/dynamic-table.component';
import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { EntityDetailComponent, EntityDetailConfig, DetailSectionConfig } from '@app/components/entity-detail/entity-detail.component';
import { ConfirmDeleteComponent } from '@app/components/confirm-delete/confirm-delete.component';
import { MedicalDiagnostic, MedicalDiagnosticExtended } from '@app/models/ms-clasificator/MedicalDiagnostic/MedicalDiagnostic';
import { MedicalDiagnosticService } from '@app/services/ms-clasificator/medical-diagnostic.service';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
    DynamicTableComponent,
    DynamicFormComponent,
    EntityDetailComponent,
    ConfirmDeleteComponent,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './list.component.html',
  styleUrl:    './list.component.scss',
})
export class ListComponent implements OnInit {

  private initialPath = '/medical-diagnostics';
  private cdr = inject(ChangeDetectorRef);
  private toastTimer: any;

  // ─── TABLE STATE ─────────────────────────────────────────────────────────────
  diagnostics = signal<MedicalDiagnosticExtended[]>([]);
  loading     = signal(true);

  // ─── PANEL STATE ─────────────────────────────────────────────────────────────
  panelOpen           = signal(false);
  panelLoading        = signal(false);
  isViewMode          = signal(false);
  formConfig          = signal<DynamicFormConfig | null>(null);
  detailConfig        = signal<EntityDetailConfig | null>(null);
  currentDiagnosticId = signal<number | null>(null);
  toast               = signal<Toast | null>(null);

  // ─── CONFIRM DELETE ───────────────────────────────────────────────────────────
  showDeleteConfirm    = signal(false);
  deleteTargetId       = signal<number | null>(null);
  deleteConfirmMessage = signal('');

  // ─── TABLE CONFIG ─────────────────────────────────────────────────────────────
  columns: TableColumn[] = [
    { key: 'id',             label: 'ID'     },
    { key: 'diagnosticCode', label: 'Código' },
    { key: 'diagnosticName', label: 'Nombre' },
  ];

  actionButtons: TableAction[] = [
    { action: 'view',           icon: 'visibility',              class: 'btn-view'         },
    { action: 'edit',           icon: 'edit',                    class: 'btn-edit'         },
    { action: 'delete',         icon: 'delete',                  class: 'btn-delete'       },
    { action: 'subDiagnostics', icon: 'subdirectory_arrow_right', class: 'btn-manage-roles' },
  ];

  constructor(
    private router: Router,
    private medicalDiagnosticService: MedicalDiagnosticService,
  ) {}

  ngOnInit(): void {
    this.loadDiagnostics();
  }

  // ─── CARGA DE TABLA ───────────────────────────────────────────────────────────

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
      },
    });
  }

  // ─── ACCIONES DE TABLA ────────────────────────────────────────────────────────

  handleAction(event: any): void {
    const { action, row } = event;
    switch (action) {
      case 'view':           this.openView(row.id);   break;
      case 'edit':           this.openEdit(row.id);   break;
      case 'delete':         this.openDeleteConfirm(row.id); break;
      case 'subDiagnostics': this.router.navigate([`${this.initialPath}/sub-diagnostics/${row.id}`]); break;
    }
  }

  // ─── APERTURA DEL PANEL ───────────────────────────────────────────────────────

  openCreate(): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.isViewMode.set(false);

    this.medicalDiagnosticService.findAll().subscribe({
      next: (allDiagnostics) => {
        this.buildFormConfig(1, null, allDiagnostics);
        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Error al cargar el catálogo de diagnósticos', 'error');
        this.closePanel();
      },
    });
  }

  openView(diagnosticId: number): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.isViewMode.set(true);
    this.currentDiagnosticId.set(diagnosticId);

    this.medicalDiagnosticService.findById(diagnosticId).subscribe({
      next: (response) => {
        const diagnostic = response.data ?? null;
        if (!diagnostic) { this.closePanel(); return; }

        this.detailConfig.set({
          title:    'Detalle del Diagnóstico',
          subtitle: diagnostic.diagnosticName,
          icon:     'medical_services',
          data:     diagnostic,
          fields: [
            { key: 'id',             label: 'ID',     icon: 'tag'        },
            { key: 'diagnosticCode', label: 'Código', icon: 'qr_code'    },
            { key: 'diagnosticName', label: 'Nombre', icon: 'description' },
          ],
          primaryActionLabel: 'Editar',
          primaryActionIcon:  'edit',
          sections: this.buildDetailSections(diagnostic),
        });

        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Error al cargar el diagnóstico', 'error');
        this.closePanel();
      },
    });
  }

  openEdit(diagnosticId: number): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.isViewMode.set(false);

    this.medicalDiagnosticService.findById(diagnosticId).subscribe({
      next: (response) => {
        const diagnostic = response.data ?? null;
        if (!diagnostic) { this.closePanel(); return; }

        this.medicalDiagnosticService.findAll().subscribe({
          next: (allDiagnostics) => {
            const modelForForm = { ...diagnostic, parentDiagnosticId: diagnostic.parentDiagnostic?.id ?? null };
            this.buildFormConfig(2, modelForForm as any, allDiagnostics);
            this.panelLoading.set(false);
            this.cdr.detectChanges();
          },
          error: () => {
            this.showToast('Error al cargar el catálogo de diagnósticos', 'error');
            this.closePanel();
          },
        });
      },
      error: () => {
        this.showToast('Error al cargar el diagnóstico', 'error');
        this.closePanel();
      },
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.isViewMode.set(false);
    this.formConfig.set(null);
    this.detailConfig.set(null);
    this.currentDiagnosticId.set(null);
    this.panelLoading.set(false);
  }

  // ─── FORM BUILDER ─────────────────────────────────────────────────────────────

  buildFormConfig(mode: 1 | 2, model: MedicalDiagnosticExtended | null, allDiagnostics: MedicalDiagnosticExtended[]): void {
    const parentOptions = allDiagnostics
      .filter(d => !model?.id || d.id !== model.id)
      .filter(d => d.id)
      .map(d => ({ value: d.id, label: `${d.diagnosticName?.trim() || 'Sin nombre'} (${d.diagnosticCode?.trim() || 'Sin código'})` }));

    this.formConfig.set({
      mode,
      model,
      fields: [
        {
          name:   'id',
          label:  'ID',
          type:   'text',
          hidden: mode === 1,
        },
        {
          name:        'diagnosticCode',
          label:       'Código',
          type:        'text',
          placeholder: 'Código del diagnóstico',
          validators:  [Validators.required, Validators.minLength(2)],
        },
        {
          name:        'diagnosticName',
          label:       'Nombre',
          type:        'text',
          placeholder: 'Nombre del diagnóstico',
          validators:  [Validators.required, Validators.minLength(2)],
        },
        {
          name:        'parentDiagnosticId',
          label:       'Diagnóstico padre',
          type:        'select',
          placeholder: 'Selecciona el diagnóstico padre',
          options:     [{ value: '', label: 'Sin diagnóstico padre' }, ...parentOptions],
        },
      ],
    });
  }

  private buildDetailSections(diagnostic: MedicalDiagnosticExtended): DetailSectionConfig[] {
    const sections: DetailSectionConfig[] = [];

    if (diagnostic.parentDiagnostic) {
      sections.push({
        title: 'Diagnóstico padre',
        icon:  'account_tree',
        data:  diagnostic.parentDiagnostic,
        fields: [
          { key: 'id',             label: 'ID',     icon: 'tag'        },
          { key: 'diagnosticCode', label: 'Código', icon: 'qr_code'    },
          { key: 'diagnosticName', label: 'Nombre', icon: 'description' },
        ],
      });
    }

    return sections;
  }

  // ─── SUBMIT / CANCEL ──────────────────────────────────────────────────────────

  handleFormSubmit(data: any): void {
    console.log('[MedicalDiagnostic] form data:', data);
    const mode = this.formConfig()?.mode;
    const payload = {
      ...data,
      parentDiagnosticId: data.parentDiagnosticId === '' ? null : (data.parentDiagnosticId ?? null),
    };

    if (mode === 1) {
      this.medicalDiagnosticService.create(payload).subscribe({
        next: (response) => {
          this.showToast(response.message || 'Diagnóstico creado exitosamente', 'success');
          this.closePanel();
          this.loadDiagnostics();
        },
        error: () => this.showToast('Error al crear diagnóstico', 'error'),
      });
    } else if (mode === 2) {
      this.medicalDiagnosticService.update(Number(data.id), payload).subscribe({
        next: (response) => {
          this.showToast(response.message || 'Diagnóstico actualizado exitosamente', 'success');
          this.closePanel();
          this.loadDiagnostics();
        },
        error: () => this.showToast('Error al actualizar diagnóstico', 'error'),
      });
    }
  }

  handleFormCancel(): void {
    this.closePanel();
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────────

  openDeleteConfirm(id: number): void {
    this.deleteTargetId.set(id);
    this.deleteConfirmMessage.set(`¿Está seguro que desea eliminar el diagnóstico con ID "${id}"?`);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.deleteTargetId.set(null);
    this.deleteConfirmMessage.set('');
  }

  confirmDelete(): void {
    const id = this.deleteTargetId();
    if (id === null) return;
    this.showDeleteConfirm.set(false);
    this.medicalDiagnosticService.delete(id).subscribe({
      next: () => {
        this.showToast('Diagnóstico eliminado exitosamente', 'success');
        this.deleteTargetId.set(null);
        this.loadDiagnostics();
      },
      error: () => {
        this.showToast('Error al eliminar diagnóstico', 'error');
        this.deleteTargetId.set(null);
      },
    });
  }

  // ─── TOAST ────────────────────────────────────────────────────────────────────

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }
}
