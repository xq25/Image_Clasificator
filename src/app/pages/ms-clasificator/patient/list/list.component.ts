import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DynamicTableComponent, TableColumn, TableAction } from '@app/components/dynamic-table/dynamic-table.component';
import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { EntityDetailComponent, EntityDetailConfig, DetailSectionConfig } from '@app/components/entity-detail/entity-detail.component';
import { PatientService } from '@app/services/ms-clasificator/patient.service';
import { UserService } from '@app/services/ms-security/user-service';
import { Patient, PatientExtended, Sex } from '@app/models/ms-clasificator/Patient/Patient';
import { User } from '@app/models/User';

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
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class ListComponent implements OnInit {

  private initialPath = '/patients';
  private cdr = inject(ChangeDetectorRef);
  private toastTimer: any;
  private readonly sexOptions = Object.values(Sex).map(v => ({ value: v, label: v }));

  // ─── TABLE STATE ──────────────────────────────────────────────────────────────
  patients = signal<Patient[]>([]);
  loading  = signal(true);

  // ─── PANEL STATE ──────────────────────────────────────────────────────────────
  panelOpen       = signal(false);
  panelLoading    = signal(false);
  isViewMode      = signal(false);
  formConfig      = signal<DynamicFormConfig | null>(null);
  detailConfig    = signal<EntityDetailConfig | null>(null);
  currentPatientId = signal<number | null>(null);
  toast           = signal<Toast | null>(null);

  // ─── TABLE CONFIG ─────────────────────────────────────────────────────────────
  columns: TableColumn[] = [
    { key: 'id',       label: 'ID'                  },
    { key: 'document', label: 'Documento'            },
    { key: 'dob',      label: 'Fecha de Nacimiento' },
    { key: 'sex',      label: 'Sexo'                },
    { key: 'userId',   label: 'ID Usuario'          },
  ];

  actionButtons: TableAction[] = [
    { action: 'view',         icon: 'visibility',  class: 'btn-view'     },
    { action: 'edit',         icon: 'edit',        class: 'btn-edit'     },
    { action: 'delete',       icon: 'delete',      class: 'btn-delete'   },
    { action: 'view-records', icon: 'description', class: 'btn-clinical' },
  ];

  constructor(
    private router: Router,
    private patientService: PatientService,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  // ─── CARGA DE TABLA ───────────────────────────────────────────────────────────

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
      },
    });
  }

  // ─── ACCIONES DE TABLA ────────────────────────────────────────────────────────

  handleAction(event: any): void {
    const { action, row } = event;
    switch (action) {
      case 'view':         this.openView(row.id);   break;
      case 'edit':         this.openEdit(row.id);   break;
      case 'delete':       this.delete(row.id);     break;
      case 'view-records': this.router.navigate([`/clinical-records/patient/${row.document}/records`]); break;
    }
  }

  // ─── APERTURA DEL PANEL ───────────────────────────────────────────────────────

  openCreate(): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.isViewMode.set(false);

    this.userService.getUsers().subscribe({
      next: (response) => {
        const users: User[] = response.data ?? [];
        this.buildFormConfig(1, null, users);
        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Error al cargar el catálogo de usuarios', 'error');
        this.closePanel();
      },
    });
  }

  openView(patientId: number): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.isViewMode.set(true);
    this.currentPatientId.set(patientId);

    this.patientService.findById(patientId).subscribe({
      next: (response) => {
        const patient = response.data ?? null;
        if (!patient) { this.closePanel(); return; }

        this.detailConfig.set({
          title:    'Detalle del Paciente',
          subtitle: patient.document,
          icon:     'person',
          data:     patient,
          fields: [
            { key: 'id',       label: 'ID',                   icon: 'tag'        },
            { key: 'document', label: 'Documento',            icon: 'badge'      },
            { key: 'dob',      label: 'Fecha de Nacimiento',  icon: 'cake'       },
            { key: 'sex',      label: 'Sexo',                 icon: 'wc'         },
            { key: 'userId',   label: 'ID de Usuario',        icon: 'manage_accounts' },
          ],
          primaryActionLabel: 'Editar',
          primaryActionIcon:  'edit',
          sections: this.buildDetailSections(patient),
        });

        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Error al cargar el paciente', 'error');
        this.closePanel();
      },
    });
  }

  openEdit(patientId: number): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.isViewMode.set(false);

    this.patientService.findById(patientId).subscribe({
      next: (patientResponse) => {
        const patient = patientResponse.data ?? null;
        if (!patient) { this.closePanel(); return; }

        this.userService.getUsers().subscribe({
          next: (userResponse) => {
            const users: User[] = userResponse.data ?? [];
            this.buildFormConfig(2, patient, users);
            this.panelLoading.set(false);
            this.cdr.detectChanges();
          },
          error: () => {
            this.showToast('Error al cargar el catálogo de usuarios', 'error');
            this.closePanel();
          },
        });
      },
      error: () => {
        this.showToast('Error al cargar el paciente', 'error');
        this.closePanel();
      },
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.isViewMode.set(false);
    this.formConfig.set(null);
    this.detailConfig.set(null);
    this.currentPatientId.set(null);
    this.panelLoading.set(false);
  }

  // ─── FORM BUILDER ─────────────────────────────────────────────────────────────

  buildFormConfig(mode: 1 | 2, model: PatientExtended | null, users: User[]): void {
    const userOptions = users
      .filter(u => u.id)
      .map(u => ({ value: u.id, label: u.email || u.id || 'Sin correo' }));

    const userIdValue = mode === 2 && model?.userInfo ? model.userInfo.id : (model?.userId ?? null);

    this.formConfig.set({
      mode,
      model: model ? { ...model, userId: userIdValue } : null,
      fields: [
        {
          name:   'id',
          label:  'ID',
          type:   'text',
          hidden: mode === 1,
        },
        {
          name:        'document',
          label:       'Documento',
          type:        'text',
          placeholder: 'Ingresa el documento del paciente',
          validators:  [Validators.required, Validators.minLength(4)],
        },
        {
          name:        'dob',
          label:       'Fecha de Nacimiento',
          type:        'date',
          placeholder: 'Selecciona la fecha de nacimiento',
          validators:  [Validators.required],
        },
        {
          name:       'sex',
          label:      'Sexo',
          type:       'select',
          placeholder: 'Selecciona el sexo',
          validators: [Validators.required],
          options:    this.sexOptions,
        },
        {
          name:        'userId',
          label:       'Usuario asociado',
          type:        'select',
          placeholder: 'Selecciona un usuario',
          validators:  [Validators.required],
          options:     userOptions,
        },
      ],
    });
  }

  private buildDetailSections(patient: PatientExtended): DetailSectionConfig[] {
    const sections: DetailSectionConfig[] = [];

    if (patient.userInfo) {
      sections.push({
        title: 'Información del usuario',
        icon:  'manage_accounts',
        data:  { ...patient.userInfo, id: patient.userId },
        fields: [
          { key: 'id',    label: 'ID',     icon: 'badge'  },
          { key: 'name',  label: 'Nombre', icon: 'person' },
          { key: 'email', label: 'Email',  icon: 'email'  },
        ],
      });
    }

    return sections;
  }

  // ─── SUBMIT / CANCEL ──────────────────────────────────────────────────────────

  handleFormSubmit(data: any): void {
    const mode = this.formConfig()?.mode;

    if (mode === 1) {
      this.patientService.create(data).subscribe({
        next: () => {
          this.showToast('Paciente creado exitosamente', 'success');
          this.closePanel();
          this.loadPatients();
        },
        error: () => this.showToast('Error al crear paciente', 'error'),
      });
    } else if (mode === 2) {
      this.patientService.update(Number(data.id), data).subscribe({
        next: () => {
          this.showToast('Paciente actualizado exitosamente', 'success');
          this.closePanel();
          this.loadPatients();
        },
        error: () => this.showToast('Error al actualizar paciente', 'error'),
      });
    }
  }

  handleFormCancel(): void {
    this.closePanel();
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────────

  delete(patientId: number): void {
    this.patientService.delete(patientId).subscribe({
      next: () => {
        this.showToast('Paciente eliminado exitosamente', 'success');
        this.loadPatients();
      },
      error: () => this.showToast('Error al eliminar paciente', 'error'),
    });
  }

  // ─── TOAST ────────────────────────────────────────────────────────────────────

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }
}
