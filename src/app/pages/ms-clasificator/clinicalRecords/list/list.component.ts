import { Component, signal, computed, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DynamicTableComponent, TableAction, TableColumn } from '@app/components/dynamic-table/dynamic-table.component';
import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { EntityDetailComponent, EntityDetailConfig, DetailSectionConfig } from '@app/components/entity-detail/entity-detail.component';
import { ConfirmDeleteComponent } from '@app/components/confirm-delete/confirm-delete.component';
import { ClinicalRecordService } from '@app/services/ms-clasificator/clinical-record.service';
import { PatientService } from '@app/services/ms-clasificator/patient.service';
import { ClinicalRecord, ClinicalRecordExtended } from '@models/ms-clasificator/ClinicalRecord/ClinicalRecord';
import { PatientExtended } from '@models/ms-clasificator/Patient/Patient';

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
  styleUrl: './list.component.scss',
})
export class ListComponent implements OnInit {

  // ── Estado de la página ──────────────────────────────────────
  patient   = signal<PatientExtended | null>(null);
  records   = signal<ClinicalRecord[]>([]);
  loading   = signal(true);
  loadError = signal(false);

  // ── Panel lateral ────────────────────────────────────────────
  panelOpen       = signal(false);
  panelLoading    = signal(false);
  isViewMode      = signal(false);
  formConfig      = signal<DynamicFormConfig | null>(null);
  detailConfig    = signal<EntityDetailConfig | null>(null);
  currentRecordId = signal<number | null>(null);
  toast           = signal<Toast | null>(null);

  // ─── CONFIRM DELETE ───────────────────────────────────────────────────────────
  showDeleteConfirm    = signal(false);
  deleteTargetId       = signal<number | null>(null);
  deleteConfirmMessage = signal('');

  private cdr        = inject(ChangeDetectorRef);
  private toastTimer: any;

  readonly pageSize = 10;

  columns: TableColumn[] = [
    { key: 'id',             label: 'ID'                 },
    { key: 'chiefComplaint', label: 'Motivo de consulta' },
    { key: 'visitDate',      label: 'Fecha de visita'    },
  ];

  actionButtons: TableAction[] = [
    { action: 'view',   icon: 'visibility', class: 'btn-view'   },
    { action: 'edit',   icon: 'edit',       class: 'btn-edit'   },
    { action: 'delete', icon: 'delete',     class: 'btn-delete' },
  ];

  // ── Computeds ────────────────────────────────────────────────
  patientName = computed(() => this.patient()?.userInfo?.name ?? '—');

  patientInitials = computed(() => {
    const name = this.patient()?.userInfo?.name ?? '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  });

  patientAge = computed(() => {
    const dob = this.patient()?.dob;
    if (!dob) return '—';
    const [y, m, d] = String(dob).split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clinicalRecordService: ClinicalRecordService,
    private patientService: PatientService,
  ) {}

  ngOnInit(): void {
    const document = this.route.snapshot.paramMap.get('document');
    if (!document) {
      this.loadError.set(true);
      this.loading.set(false);
      return;
    }
    this.loadByDocument(document);
  }

  // ── Carga ────────────────────────────────────────────────────
  private loadByDocument(document: string): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.patientService.findByDocument(document).subscribe({
      next: (response) => {
        const patient = response.data ?? null;
        this.patient.set(patient);

        if (!patient?.id) {
          this.loading.set(false);
          return;
        }

        this.clinicalRecordService.findByPatientId(patient.id).subscribe({
          next: (res) => {
            this.records.set(this.formatRecords(res.data ?? []));
            this.loading.set(false);
          },
          error: (err) => {
            console.error('[ClinicalRecords] Error al cargar registros:', err);
            this.loading.set(false);
          },
        });
      },
      error: (err) => {
        console.error('[ClinicalRecords] Paciente no encontrado:', err);
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  private formatRecords(records: ClinicalRecord[]): ClinicalRecord[] {
    return records.map(r => ({
      ...r,
      visitDate: r.visitDate
        ? (() => {
            const [datePart, timePart = ''] = String(r.visitDate).split('T');
            const [y, m, d] = datePart.split('-');
            const [hh = '00', mm = '00'] = timePart.split(':');
            return `${d}/${m}/${y} ${hh}:${mm}` as any;
          })()
        : '—',
    }));
  }

  private reloadRecords(): void {
    const id = this.patient()?.id;
    if (!id) return;
    this.clinicalRecordService.findByPatientId(id).subscribe({
      next: (res) => this.records.set(this.formatRecords(res.data ?? [])),
      error: (err) => console.error('[ClinicalRecords] Error al recargar:', err),
    });
  }

  // ── Acciones de tabla ────────────────────────────────────────
  handleAction(event: { action: string; row: ClinicalRecord }): void {
    const { action, row } = event;
    switch (action) {
      case 'view':   this.openView(row.id!);  break;
      case 'edit':   this.openEdit(row.id!);  break;
      case 'delete': this.openDeleteConfirm(row.id!); break;
    }
  }

  // ── Panel ────────────────────────────────────────────────────
  openCreate(): void {
    this.isViewMode.set(false);
    this.buildFormConfig(1, null);
    this.panelOpen.set(true);
  }

  openView(id: number): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.isViewMode.set(true);
    this.currentRecordId.set(id);

    this.clinicalRecordService.findById(id).subscribe({
      next: (res) => {
        const record = res.data ?? null;
        if (!record) { this.closePanel(); return; }

        this.detailConfig.set({
          title:              'Detalle del Registro Clínico',
          subtitle:           `Registro # ${record.id}`,
          icon:               'assignment',
          data:               record,
          fields: [
            { key: 'id',             label: 'ID',               icon: 'tag'             },
            { key: 'chiefComplaint', label: 'Motivo de consulta', icon: 'notes'          },
            { key: 'visitDate',      label: 'Fecha de visita',  icon: 'event_available'  },
          ],
          primaryActionLabel: 'Editar',
          primaryActionIcon:  'edit',
          sections:           this.buildDetailSections(record),
        });

        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Error al cargar el registro clínico', 'error');
        this.closePanel();
      },
    });
  }

  openEdit(id: number): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.isViewMode.set(false);

    this.clinicalRecordService.findById(id).subscribe({
      next: (res) => {
        this.buildFormConfig(2, res.data ?? null);
        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Error al cargar el registro clínico', 'error');
        this.closePanel();
      },
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.isViewMode.set(false);
    this.formConfig.set(null);
    this.detailConfig.set(null);
    this.currentRecordId.set(null);
    this.panelLoading.set(false);
  }

  // ── Formulario ───────────────────────────────────────────────
  buildFormConfig(mode: 1 | 2, model: ClinicalRecord | null): void {
    const patient   = this.patient();
    const patientId = patient?.id ?? null;

    const patientOption = patient
      ? [{ value: patientId, label: patient.userInfo?.name ?? `Paciente #${patientId}` }]
      : [];

    this.formConfig.set({
      mode,
      model: model ? { ...model, patientId } : { patientId },
      fields: [
        {
          name:   'id',
          label:  'ID',
          type:   'text',
          hidden: mode === 1,
        },
        {
          name:       'chiefComplaint',
          label:      'Motivo de consulta',
          type:       'textarea',
          validators: [Validators.required],
        },
        {
          name:       'visitDate',
          label:      'Fecha de visita',
          type:       'date',
          validators: [Validators.required],
        },
        {
          name:       'patientId',
          label:      'Paciente',
          type:       'select',
          options:    patientOption,
          disabled:   true,
          validators: [Validators.required],
        },
      ],
    });
  }

  private buildDetailSections(record: ClinicalRecordExtended): DetailSectionConfig[] {
    const patient = this.patient();
    if (!patient) return [];

    return [{
      title: 'Información del paciente',
      icon:  'person',
      data:  { ...patient.userInfo, document: patient.document, dob: patient.dob },
      fields: [
        { key: 'name',     label: 'Nombre',      icon: 'person' },
        { key: 'email',    label: 'Email',        icon: 'email'  },
        { key: 'document', label: 'Documento',    icon: 'badge'  },
        { key: 'dob',      label: 'Nacimiento',   icon: 'cake',  type: 'date' },
      ],
    }];
  }

  // ── Submit / Cancel ──────────────────────────────────────────
  handleFormSubmit(data: any): void {
    const config    = this.formConfig();
    const patientId = this.patient()?.id;
    if (!config || !patientId) return;

    const payload = { ...data, patientId };

    if (config.mode === 1) {
      this.clinicalRecordService.create(payload).subscribe({
        next: (res) => {
          this.showToast(res.message || 'Registro creado exitosamente', 'success');
          this.closePanel();
          this.reloadRecords();
        },
        error: () => this.showToast('Error al crear el registro clínico', 'error'),
      });
    } else if (config.mode === 2) {
      this.clinicalRecordService.update(data.id, payload).subscribe({
        next: (res) => {
          this.showToast(res.message || 'Registro actualizado exitosamente', 'success');
          this.closePanel();
          this.reloadRecords();
        },
        error: () => this.showToast('Error al actualizar el registro clínico', 'error'),
      });
    }
  }

  handleFormCancel(): void {
    this.closePanel();
  }

  // ── Eliminar ─────────────────────────────────────────────────
  openDeleteConfirm(id: number): void {
    this.deleteTargetId.set(id);
    this.deleteConfirmMessage.set(`¿Está seguro que desea eliminar el registro clínico con ID "${id}"?`);
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
    this.clinicalRecordService.delete(id).subscribe({
      next: () => {
        this.showToast('Registro eliminado exitosamente', 'success');
        this.deleteTargetId.set(null);
        this.reloadRecords();
      },
      error: () => {
        this.showToast('Error al eliminar el registro clínico', 'error');
        this.deleteTargetId.set(null);
      },
    });
  }

  // ── Navegación ───────────────────────────────────────────────
  goBack(): void {
    this.router.navigate(['/patients/list']);
  }

  goToRecord(): void {
    const id        = this.currentRecordId();
    const patientId = this.patient()?.id;
    if (id != null && patientId != null)
      this.router.navigate(['/clinical-records', id, 'info', patientId]);
  }

  // ── Toast ─────────────────────────────────────────────────────
  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }
}