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
import { ClinicalRecordService } from '@app/services/ms-clasificator/clinical-record.service';
import { PatientService } from '@app/services/ms-clasificator/patient.service';
import { ClinicalRecord, ClinicalRecordExtended } from '@models/ms-clasificator/ClinicalRecord/ClinicalRecord';
import { PatientExtended } from '@models/ms-clasificator/Patient/Patient';

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
export class ListComponent implements OnInit {

  // ── Estado de la página ──────────────────────────────────────
  patient      = signal<PatientExtended | null>(null);
  records      = signal<ClinicalRecord[]>([]);
  loading      = signal(true);
  loadError    = signal(false);

  // ── Panel lateral ────────────────────────────────────────────
  panelOpen    = signal(false);
  panelLoading = signal(false);
  formConfig   = signal<DynamicFormConfig | null>(null);
  /** Guarda el registro completo para el resumen en modo VIEW */
  viewRecord   = signal<ClinicalRecordExtended | null>(null);

  private cdr = inject(ChangeDetectorRef);

  readonly pageSize = 10;

  columns: TableColumn[] = [
    { key: 'id',          label: 'ID'             },
    { key: 'chiefComplaint', label: 'Motivo de consulta' },
    { key: 'visitDate', label: 'Fecha de visita' },
  ];

  actionButtons: TableAction[] = [
    { action: 'view',   icon: 'visibility', class: 'btn-view'   },
    { action: 'edit',   icon: 'edit',       class: 'btn-edit'   },
    { action: 'delete', icon: 'delete',     class: 'btn-delete' },
  ];

  // ── Computeds ────────────────────────────────────────────────
  patientName = computed(() => this.patient()?.userInfo?.name ?? '—');

  /** Iniciales para el avatar del header */
  patientInitials = computed(() => {
    const name = this.patient()?.userInfo?.name ?? '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  });

  /** fecha de nacimiento en texto */
  patientAge = computed(() => {
    const dob = this.patient()?.dob.toString();
    return dob;
  });

  /** ID del registro actualmente en vista, para el botón de navegación */
  viewRecordId = computed(() => this.viewRecord()?.id ?? null);

  /** Fecha formateada del registro en vista */
  viewDateFormatted = computed(() => {
    const d = this.viewRecord()?.visitDate.toString();
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-CO', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
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
        ? new Date(r.visitDate).toLocaleDateString('es-CO', {
            day: '2-digit', month: 'short', year: 'numeric'
          }) as any
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
      case 'view':   this.openView(row.id!);   break;
      case 'edit':   this.openEdit(row.id!);   break;
      case 'delete': this.delete(row.id!);     break;
    }
  }

  // ── Panel ────────────────────────────────────────────────────
  openCreate(): void {
    this.viewRecord.set(null);
    this.buildConfig(1, null);
    this.panelOpen.set(true);
  }

  openView(id: number): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.viewRecord.set(null);

    this.clinicalRecordService.findById(id).subscribe({
      next: (res) => {
        const record = res.data ?? null;
        this.viewRecord.set(record);
        this.buildConfig(0, record);
        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Error: No se pudo cargar el registro clínico');
        this.closePanel();
      },
    });
  }

  openEdit(id: number): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.viewRecord.set(null);

    this.clinicalRecordService.findById(id).subscribe({
      next: (res) => {
        this.buildConfig(2, res.data ?? null);
        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Error: No se pudo cargar el registro clínico');
        this.closePanel();
      },
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.formConfig.set(null);
    this.panelLoading.set(false);
    this.viewRecord.set(null);
  }

  // ── Formulario ───────────────────────────────────────────────
  buildConfig(mode: 0 | 1 | 2, model: ClinicalRecord | null): void {
    const patient   = this.patient();
    const patientId = patient?.id ?? null;

    // Opción del select: el único item es el paciente actual
    const patientOption = patient
      ? [{ value: patientId, label: patient.userInfo?.name ?? `Paciente #${patientId}` }]
      : [];

    this.formConfig.set({
      mode,
      model: model
        ? { ...model, patientId }   // siempre forzamos el patientId en el modelo
        : { patientId },            // en create el modelo solo necesita el patientId
      fields: [
        {
          name: 'id',
          label: 'ID',
          type: 'text',
          hidden: mode === 1,
        },
        {
          name: 'chiefComplaint',
          label: 'Motivo de consulta',
          type: 'textarea',
          validators: [Validators.required],
        },
        {
          name: 'visitDate',
          label: 'Fecha de visita',
          type: 'date',
          validators: [Validators.required],
        },
        {
          name: 'patientId',
          label: 'Paciente',
          type: 'select',
          options: patientOption,
          // Siempre fijo y deshabilitado: el paciente ya está definido por contexto
          disabled: true,
          validators: [Validators.required],
        },
      ],
    });
  }

  handleFormSubmit(data: any): void {
    const config    = this.formConfig();
    const patientId = this.patient()?.id;
    if (!config || !patientId) return;

    // Garantizamos que patientId siempre viaje al backend
    const payload = { ...data, patientId };

    if (config.mode === 1) {
      this.clinicalRecordService.create(payload).subscribe({
        next: (res) => {
          alert(res.message || 'Registro creado exitosamente');
          this.closePanel();
          this.reloadRecords();
        },
        error: (err) => {
          console.error('Error al crear registro:', err);
          alert('Error al crear el registro clínico');
        },
      });
    } else if (config.mode === 2) {
      this.clinicalRecordService.update(data.id, payload).subscribe({
        next: (res) => {
          alert(res.message || 'Registro actualizado exitosamente');
          this.closePanel();
          this.reloadRecords();
        },
        error: (err) => {
          console.error('Error al actualizar registro:', err);
          alert('Error al actualizar el registro clínico');
        },
      });
    }
  }

  handleFormCancel(): void {
    this.closePanel();
  }

  // ── Eliminar ─────────────────────────────────────────────────
  delete(id: number): void {
    if (!confirm('¿Estás seguro de que quieres eliminar este registro clínico?')) return;
    this.clinicalRecordService.delete(id).subscribe({
      next:  ()    => this.reloadRecords(),
      error: (err) => console.error('Error al eliminar registro:', err),
    });
  }

  // ── Navegación ───────────────────────────────────────────────
  goBack(): void {
    this.router.navigate(['/patients/list']);
  }

  goToRecord(id: number): void {
    this.router.navigate([`/clinical-records/${id}`]);
  }
}