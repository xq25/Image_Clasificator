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
import { DoctorService } from '@app/services/ms-clasificator/doctor.service';
import { UserService } from '@app/services/ms-security/user-service';
import { DoctorAreaService } from '@app/services/ms-clasificator/doctor-area.service';
import { EvaluationAreaService } from '@app/services/ms-clasificator/evaluation-area.service';
import { Doctor, DoctorExtended } from '@app/models/ms-clasificator/Doctor/Doctor';
import { EvaluationArea } from '@app/models/ms-clasificator/EvaluationArea/EvaluationArea';
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

  private initialPath = '/doctors';
  private cdr = inject(ChangeDetectorRef);
  private toastTimer: any;

  // ─── TABLE STATE ─────────────────────────────────────────────────────────────
  doctors = signal<Doctor[]>([]);
  loading = signal(true);

  // ─── PANEL STATE ─────────────────────────────────────────────────────────────
  panelOpen       = signal(false);
  panelLoading    = signal(false);
  isViewMode      = signal(false);
  formConfig      = signal<DynamicFormConfig | null>(null);
  detailConfig    = signal<EntityDetailConfig | null>(null);
  currentDoctorId = signal<number | null>(null);
  toast           = signal<Toast | null>(null);

  // ─── DOCTOR AREA ASSOCIATION STATE ────────────────────────────────────────────
  showDoctorAreaForm    = signal(false);
  doctorAreaFormLoading = signal(false);
  evaluationAreas       = signal<EvaluationArea[]>([]);
  doctorAreaFormConfig  = signal<DynamicFormConfig | null>(null);
  showEvaluationAreaForm = signal(false);
  evaluationAreaFormConfig = signal<DynamicFormConfig | null>(null);

  // ─── TABLE CONFIG ─────────────────────────────────────────────────────────────
  columns: TableColumn[] = [
    { key: 'id',     label: 'ID' },
    { key: 'code',   label: 'Código' },
    { key: 'userId', label: 'ID Usuario' },
  ];

  actionButtons: TableAction[] = [
    { action: 'view',        icon: 'visibility',          class: 'btn-view' },
    { action: 'edit',        icon: 'edit',                class: 'btn-edit' },
    { action: 'delete',      icon: 'delete',              class: 'btn-delete' },
    { action: 'manageAreas', icon: 'medical_services',    class: 'btn-manage-roles' },
  ];

  constructor(
    private router: Router,
    private doctorService: DoctorService,
    private userService: UserService,
    private doctorAreaService: DoctorAreaService,
    private evaluationAreaService: EvaluationAreaService,
  ) {}

  ngOnInit(): void {
    this.loadDoctors();
  }

  // ─── CARGA DE TABLA ───────────────────────────────────────────────────────────

  loadDoctors(): void {
    this.loading.set(true);
    this.doctorService.findAll().subscribe({
      next: (response) => {
        this.doctors.set(response.data ?? []);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar doctores:', error);
        this.loading.set(false);
      },
    });
  }

  // ─── ACCIONES DE TABLA ────────────────────────────────────────────────────────

  handleAction(event: any): void {
    const { action, row } = event;
    switch (action) {
      case 'view':        this.openView(row.id);    break;
      case 'edit':        this.openEdit(row.id);    break;
      case 'delete':      this.delete(row.id);      break;
      case 'manageAreas': this.manageAreas(row.id); break;
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

  openView(doctorId: number): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.isViewMode.set(true);
    this.currentDoctorId.set(doctorId);

    this.doctorService.findById(doctorId).subscribe({
      next: (response) => {
        const doctor = response.data ?? null;
        if (!doctor) { this.closePanel(); return; }

        this.detailConfig.set({
          title:    'Detalle del Doctor',
          subtitle: `ID ${doctor.id}`,
          icon:     'medical_services',
          data:     doctor,
          fields: [
            { key: 'id',     label: 'ID',      icon: 'tag' },
            { key: 'code',   label: 'Código',  icon: 'badge' },
            { key: 'userId', label: 'Usuario', icon: 'person' },
          ],
          primaryActionLabel: 'Editar',
          primaryActionIcon:  'edit',
          sections: this.buildDetailSections(doctor),
        });

        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Error al cargar el doctor', 'error');
        this.closePanel();
      },
    });
  }

  openEdit(doctorId: number): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.isViewMode.set(false);

    this.doctorService.findById(doctorId).subscribe({
      next: (response) => {
        const doctor = response.data ?? null;
        if (!doctor) { this.closePanel(); return; }

        this.userService.getUsers().subscribe({
          next: (userResponse) => {
            const users: User[] = userResponse.data ?? [];
            this.buildConfig(2, doctor, users);
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
        this.showToast('Error al cargar el doctor', 'error');
        this.closePanel();
      },
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.isViewMode.set(false);
    this.formConfig.set(null);
    this.detailConfig.set(null);
    this.currentDoctorId.set(null);
    this.panelLoading.set(false);
  }

  // ─── FORM BUILDER ─────────────────────────────────────────────────────────────

  buildConfig(mode: 1 | 2, model: DoctorExtended | null, users: User[]): void {
    const userOptions = users
      .filter(u => u.id)
      .map(u => ({ value: u.id, label: u.email || u.id || 'Sin correo' }));

    const userIdValue = mode === 2 && model?.userInfo
      ? model.userInfo.id
      : (model?.userId ?? null);

    this.formConfig.set({
      mode,
      model: model ? { ...model, userId: userIdValue } : null,
      fields: [
        {
          name: 'id',
          label: 'ID',
          type: 'text',
        },
        {
          name: 'code',
          label: 'Código',
          type: 'text',
          placeholder: 'Ingresa el código del doctor',
          validators: [Validators.required, Validators.minLength(2)],
        },
        {
          name: 'userId',
          label: 'ID de usuario',
          type: 'select',
          placeholder: 'Selecciona un usuario',
          validators: [Validators.required],
          options: userOptions,
        },
      ],
    });
  }

  private buildDetailSections(model: DoctorExtended): DetailSectionConfig[] {
    const sections: DetailSectionConfig[] = [];

    if (model.userInfo) {
      sections.push({
        title: 'Información del usuario',
        icon:  'manage_accounts',
        data:  { ...model.userInfo, id: model.userId },
        fields: [
          { key: 'id',    label: 'ID',     icon: 'badge' },
          { key: 'name',  label: 'Nombre', icon: 'person' },
          { key: 'email', label: 'Email',  icon: 'email' },
        ],
      });
    }

    return sections;
  }

  // ─── SUBMIT / CANCEL ──────────────────────────────────────────────────────────

  handleFormSubmit(data: any): void {
    const mode = this.formConfig()?.mode;

    if (mode === 1) {
      this.doctorService.create(data).subscribe({
        next: (response) => {
          this.showToast('Doctor creado exitosamente', 'success');
          const doctorId = response.data?.id;
          if (doctorId) {
            this.currentDoctorId.set(doctorId);
            // Cambiar a modo de asociar área
            this.formConfig.set(null);
            this.loadEvaluationAreasForDoctorArea();
          } else {
            this.closePanel();
            this.loadDoctors();
          }
        },
        error: () => this.showToast('Error al crear doctor', 'error'),
      });
    } else if (mode === 2) {
      this.doctorService.update(Number(data.id), data).subscribe({
        next: () => {
          this.showToast('Doctor actualizado exitosamente', 'success');
          this.closePanel();
          this.loadDoctors();
        },
        error: () => this.showToast('Error al actualizar doctor', 'error'),
      });
    }
  }

  handleFormCancel(): void {
    if (this.showDoctorAreaForm()) {
      this.resetDoctorAreaForm();
    } else {
      this.closePanel();
    }
  }

  // ─── DOCTOR AREA ASSOCIATION FLOW ─────────────────────────────────────────────

  loadEvaluationAreasForDoctorArea(): void {
    this.doctorAreaFormLoading.set(true);
    this.evaluationAreaService.findAll().subscribe({
      next: (response) => {
        this.evaluationAreas.set(response.data ?? []);
        this.buildDoctorAreaForm();
        this.showDoctorAreaForm.set(true);
        this.doctorAreaFormLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Error al cargar las áreas de evaluación', 'error');
        this.doctorAreaFormLoading.set(false);
      },
    });
  }

  buildDoctorAreaForm(): void {
    const areaOptions = this.evaluationAreas()
      .filter(area => area.id)
      .map(area => ({ value: area.id, label: area.name }));
      
    //console.log('Opciones de áreas cargadas:', areaOptions);

    this.doctorAreaFormConfig.set({
      mode: 1, // Custom mode for DoctorArea association
      model: null,
      fields: [
        {
          name: 'evaluationAreaId',
          label: 'Área de Evaluación',
          type: 'select',
          placeholder: 'Selecciona un área de evaluación',
          validators: [Validators.required],
          options: areaOptions,
        },
      ],
    });
  }

  handleDoctorAreaFormSubmit(data: any): void {
    const doctorId = this.currentDoctorId();
    const evaluationAreaId = data.evaluationAreaId;

    if (!doctorId || !evaluationAreaId) {
      this.showToast('Error: doctor o área no válidos', 'error');
      return;
    }

    this.doctorAreaFormLoading.set(true);
    this.doctorAreaService.create({ doctorId, evaluationAreaId }).subscribe({
      next: () => {
        this.showToast('Área asociada al doctor exitosamente', 'success');
        this.doctorAreaFormLoading.set(false);
        this.closePanel();
        this.loadDoctors();
      },
      error: () => {
        this.showToast('Error al asociar el área al doctor', 'error');
        this.doctorAreaFormLoading.set(false);
      },
    });
  }

  openCreateEvaluationArea(): void {
    this.showEvaluationAreaForm.set(true);
    this.buildEvaluationAreaForm();
  }

  buildEvaluationAreaForm(): void {
    this.evaluationAreaFormConfig.set({
      mode: 1,
      model: null,
      fields: [
        {
          name: 'codeArea',
          label: 'Código del Área',
          type: 'text',
          placeholder: 'Ej: CARD',
          validators: [Validators.required, Validators.minLength(2)],
        },
        {
          name: 'name',
          label: 'Nombre del Área',
          type: 'text',
          placeholder: 'Ej: Cardiología',
          validators: [Validators.required, Validators.minLength(3)],
        },
      ],
    });
  }

  handleEvaluationAreaFormSubmit(data: any): void {
    this.doctorAreaFormLoading.set(true);
    this.evaluationAreaService.create(data).subscribe({
      next: (response) => {
        const newArea = response.data;
        if (newArea && newArea.id) {
          // Agregar el nuevo área a la lista
          this.evaluationAreas.set([...this.evaluationAreas(), newArea]);
          // Reconstruir el formulario de DoctorArea con la nueva área
          this.buildDoctorAreaForm();
          // Cerrar formulario de evaluación
          this.showEvaluationAreaForm.set(false);
          this.showToast('Área de evaluación creada exitosamente', 'success');
        }
        this.doctorAreaFormLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Error al crear el área de evaluación', 'error');
        this.doctorAreaFormLoading.set(false);
      },
    });
  }

  resetDoctorAreaForm(): void {
    this.showDoctorAreaForm.set(false);
    this.showEvaluationAreaForm.set(false);
    this.doctorAreaFormConfig.set(null);
    this.evaluationAreaFormConfig.set(null);
    this.currentDoctorId.set(null);
  }

  // ─── OTRAS ACCIONES ───────────────────────────────────────────────────────────

  delete(doctorId: number): void {
    this.doctorService.delete(doctorId).subscribe({
      next: () => {
        this.showToast('Doctor eliminado exitosamente', 'success');
        this.loadDoctors();
      },
      error: () => this.showToast('Error al eliminar doctor', 'error'),
    });
  }

  manageAreas(doctorId: number): void {
    this.router.navigate([`${this.initialPath}/doctor-areas/${doctorId}`]);
  }

  // ─── TOAST ────────────────────────────────────────────────────────────────────

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }
}