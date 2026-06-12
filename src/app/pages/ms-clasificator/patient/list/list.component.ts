import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DynamicTableComponent, TableColumn, TableAction } from '@app/components/dynamic-table/dynamic-table.component';
import { DynamicFormComponent, DynamicFormConfig, RelatedEntityConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { PatientService } from '@app/services/ms-clasificator/patient.service';
import { UserService } from '@app/services/ms-security/user-service';
import { Patient, PatientExtended } from '@app/models/ms-clasificator/Patient/Patient';
import { User } from '@app/models/User';

type FormMode = 0 | 1 | 2;

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

  // ─── TABLE STATE ──────────────────────────────────────────────────────────────
  patients = signal<Patient[]>([]);
  loading = signal(true);

  // ─── PANEL STATE ──────────────────────────────────────────────────────────────
  panelOpen = signal(false);
  panelLoading = signal(false);
  formConfig = signal<DynamicFormConfig | null>(null);
  toast = signal<Toast | null>(null);

  // ─── TABLE CONFIG ─────────────────────────────────────────────────────────────
  columns: TableColumn[] = [
    { key: 'id',       label: 'ID' },
    { key: 'document', label: 'Documento' },
    { key: 'years',    label: 'Años' },
    { key: 'userId',   label: 'ID Usuario' },
  ];

  actionButtons: TableAction[] = [
    { action: 'view',   icon: 'visibility', class: 'btn-view' },
    { action: 'edit',   icon: 'edit',       class: 'btn-edit' },
    { action: 'delete', icon: 'delete',     class: 'btn-delete' },
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
      case 'view':   this.openView(row.id);   break;
      case 'edit':   this.openEdit(row.id);   break;
      case 'delete': this.delete(row.id);     break;
    }
  }

  // ─── APERTURA DEL PANEL ───────────────────────────────────────────────────────

  openCreate(): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);

    this.userService.getUsers().subscribe({
      next: (response) => {
        const users: User[] = response.data ?? [];
        this.buildConfig(1, null, users);
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

    this.patientService.findById(patientId).subscribe({
      next: (response) => {
        const patient = response.data ?? null;
        if (!patient) { this.closePanel(); return; }
        this.buildConfig(0, patient, []);
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

    this.patientService.findById(patientId).subscribe({
      next: (response) => {
        const patient = response.data ?? null;
        if (!patient) { this.closePanel(); return; }

        this.userService.getUsers().subscribe({
          next: (userResponse) => {
            const users: User[] = userResponse.data ?? [];
            this.buildConfig(2, patient, users);
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
    this.formConfig.set(null);
    this.panelLoading.set(false);
  }

  // ─── FORM BUILDER ─────────────────────────────────────────────────────────────

  buildConfig(mode: FormMode, model: PatientExtended | null, users: User[]): void {
    const userOptions = users
      .filter(u => u.id)
      .map(u => ({ value: u.id, label: u.email || u.id || 'Sin correo' }));

    const userDisplayValue = mode === 0 && model?.userInfo
      ? (model.userInfo.email ?? model.userId ?? 'Sin información')
      : undefined;

    const userIdValue = mode === 2 && model?.userInfo
      ? model.userInfo.id
      : (model?.userId ?? null);

    this.formConfig.set({
      mode,
      model: model ? { ...model, userId: userIdValue } : null,
      relatedEntities: this.buildRelatedEntities(mode, model),
      fields: [
        {
          name: 'id',
          label: 'ID',
          type: 'text',
        },
        {
          name: 'document',
          label: 'Documento',
          type: 'text',
          placeholder: 'Ingresa el documento del paciente',
          validators: [Validators.required, Validators.minLength(4)],
        },
        {
          name: 'years',
          label: 'Años',
          type: 'number',
          placeholder: 'Ingresa la edad en años',
          validators: [Validators.required, Validators.min(0)],
        },
        {
          name: 'userId',
          label: mode === 0 ? 'Usuario asociado' : 'ID de usuario',
          type: mode !== 0 ? 'select' : 'text',
          placeholder: mode === 1
            ? 'Selecciona un usuario'
            : mode === 2 ? 'Selecciona un usuario' : userDisplayValue,
          validators: mode !== 0 ? [Validators.required] : [],
          options: mode !== 0 ? userOptions : [],
          ...(mode === 0 && { value: userDisplayValue }),
        },
      ],
    });
  }

  private buildRelatedEntities(mode: FormMode, model: PatientExtended | null): RelatedEntityConfig[] {
    if (mode !== 0 || !model) return [];

    const entities: RelatedEntityConfig[] = [];

    if (model.userInfo) {
      entities.push({
        title: 'Información del usuario',
        icon: 'manage_accounts',
        data: { ...model.userInfo, id: model.userId },
        fields: [
          { key: 'id',    label: 'ID',     icon: 'badge' },
          { key: 'name',  label: 'Nombre', icon: 'person' },
          { key: 'email', label: 'Email',  icon: 'email' },
        ],
      });
    }

    return entities;
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
    if (!confirm('¿Estás seguro de que quieres eliminar este paciente?')) return;

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