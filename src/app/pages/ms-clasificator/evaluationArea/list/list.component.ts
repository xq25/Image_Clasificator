import { Component, OnInit, signal, inject, ChangeDetectorRef, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

import { DynamicTableComponent, TableAction, TableColumn } from '@app/components/dynamic-table/dynamic-table.component';
import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { EntityDetailComponent, EntityDetailConfig, DetailSectionConfig } from '@app/components/entity-detail/entity-detail.component';
import { EvaluationArea } from '@app/models/ms-clasificator';
import { EvaluationAreaService } from '@app/services/ms-clasificator/evaluation-area.service';
import { DoctorAreaService } from '@app/services/ms-clasificator/doctor-area.service';
import { DoctorService } from '@app/services/ms-clasificator/doctor.service';
import { Doctor } from '@app/models/ms-clasificator/Doctor/Doctor';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DynamicTableComponent,
    DynamicFormComponent,
    EntityDetailComponent,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class ListComponent implements OnInit {

  private initialPath = '/evaluation-areas';
  private cdr = inject(ChangeDetectorRef);
  private toastTimer: any;

  // ─── TABLE STATE ─────────────────────────────────────────────────────────────
  evaluationAreas    = signal<EvaluationArea[]>([]);
  loading            = signal(true);

  // ─── PANEL STATE ─────────────────────────────────────────────────────────────
  panelOpen              = signal(false);
  panelLoading           = signal(false);
  isViewMode             = signal(false);
  isDoctorsMode          = signal(false);
  formConfig             = signal<DynamicFormConfig | null>(null);
  detailConfig           = signal<EntityDetailConfig | null>(null);
  currentAreaId          = signal<number | null>(null);
  toast                  = signal<Toast | null>(null);

  // ─── DOCTORS PANEL STATE ──────────────────────────────────────────────────
  managedArea            = signal<EvaluationArea | null>(null);
  areaDoctors            = signal<Doctor[]>([]);
  allDoctors             = signal<Doctor[]>([]);
  doctorsLoading         = signal(false);
  addingDoctor           = signal(false);
  removingDoctorId       = signal<number | null>(null);
  selectedDoctorId       = signal<number | null>(null);
  selectedDoctorIdValue: number | null = null;
  doctorsPage            = signal(0);
  readonly DOCTORS_PAGE_SIZE = 5;

  availableDoctors = computed(() => {
    const assigned = new Set(this.areaDoctors().map(d => d.id));
    return this.allDoctors().filter(d => !assigned.has(d.id));
  });

  pagedDoctors = computed(() => {
    const start = this.doctorsPage() * this.DOCTORS_PAGE_SIZE;
    return this.areaDoctors().slice(start, start + this.DOCTORS_PAGE_SIZE);
  });

  totalDoctorsPages = computed(() =>
    Math.ceil(this.areaDoctors().length / this.DOCTORS_PAGE_SIZE)
  );

  // ─── TABLE CONFIG ─────────────────────────────────────────────────────────────
  columns: TableColumn[] = [
    { key: 'id',           label: 'ID'                  },
    { key: 'codeArea',     label: 'Código'              },
    { key: 'name',         label: 'Nombre'              },
    { key: 'doctorsCount', label: 'Doctores asociados'  },
  ];

  actionButtons: TableAction[] = [
    { action: 'view',               icon: 'visibility',     class: 'btn-view'         },
    { action: 'edit',               icon: 'edit',           class: 'btn-edit'         },
    { action: 'delete',             icon: 'delete',         class: 'btn-delete'       },
    { action: 'manageDoctorInArea', icon: 'medical_services', class: 'btn-manage-roles' },
  ];

  constructor(
    private router: Router,
    private evaluationAreaService: EvaluationAreaService,
    private doctorAreaService: DoctorAreaService,
    private doctorService: DoctorService,
  ) {}

  ngOnInit(): void {
    this.loadEvaluationAreas();
  }

  // ─── CARGA DE TABLA ───────────────────────────────────────────────────────────

  loadEvaluationAreas(): void {
    this.loading.set(true);
    this.evaluationAreaService.findAll().subscribe({
      next: (response) => {
        this.evaluationAreas.set(response.data ?? []);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar áreas de evaluación:', error);
        this.loading.set(false);
      },
    });
  }

  // ─── ACCIONES DE TABLA ────────────────────────────────────────────────────────

  handleAction(event: any): void {
    const { action, row } = event;
    switch (action) {
      case 'view':               this.openView(row.id);   break;
      case 'edit':               this.openEdit(row.id);   break;
      case 'delete':             this.delete(row.id);     break;
      case 'manageDoctorInArea': this.openManageDoctors(row); break;
    }
  }

  // ─── APERTURA DEL PANEL ───────────────────────────────────────────────────────

  openCreate(): void {
    this.panelOpen.set(true);
    this.isViewMode.set(false);
    this.buildFormConfig(1, null);
  }

  openView(areaId: number): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.isViewMode.set(true);
    this.currentAreaId.set(areaId);

    this.evaluationAreaService.findById(areaId).subscribe({
      next: (response) => {
        const area = response.data ?? null;
        if (!area) { this.closePanel(); return; }

        this.detailConfig.set({
          title:    'Detalle del Área de Evaluación',
          subtitle: area.name,
          icon:     'area_chart',
          data:     area,
          fields: [
            { key: 'id',       label: 'ID',     icon: 'tag'         },
            { key: 'codeArea', label: 'Código', icon: 'qr_code'     },
            { key: 'name',     label: 'Nombre', icon: 'description' },
          ],
          primaryActionLabel: 'Editar',
          primaryActionIcon:  'edit',
          sections:           [],
        });

        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Error al cargar el área de evaluación', 'error');
        this.closePanel();
      },
    });
  }

  openEdit(areaId: number): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.isViewMode.set(false);

    this.evaluationAreaService.findById(areaId).subscribe({
      next: (response) => {
        const area = response.data ?? null;
        if (!area) { this.closePanel(); return; }
        this.buildFormConfig(2, area);
        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Error al cargar el área de evaluación', 'error');
        this.closePanel();
      },
    });
  }

  openManageDoctors(area: EvaluationArea): void {
    this.panelOpen.set(true);
    this.isViewMode.set(false);
    this.isDoctorsMode.set(true);
    this.managedArea.set(area);
    this.doctorsPage.set(0);
    this.areaDoctors.set([]);
    this.allDoctors.set([]);
    this.selectedDoctorId.set(null);
    this.selectedDoctorIdValue = null;
    this.doctorsLoading.set(true);

    this.doctorService.findAll().subscribe({
      next: (doctorsRes) => {
        this.allDoctors.set(doctorsRes.data ?? []);

        this.doctorAreaService.findByEvaluationAreaId(area.id!).subscribe({
          next: (res) => {
            const relations = res.data ?? [];
            const doctorIds = relations.map(r => r.doctorId).filter((id): id is number => !!id);
            const filtered = this.allDoctors().filter(d => doctorIds.includes(d.id!));
            this.areaDoctors.set(filtered);
            this.doctorsLoading.set(false);
          },
          error: () => {
            this.showToast('Error al cargar doctores del área', 'error');
            this.doctorsLoading.set(false);
          },
        });
      },
      error: () => {
        this.showToast('Error al cargar la lista de doctores', 'error');
        this.doctorsLoading.set(false);
      },
    });
  }

  removeDoctorFromArea(doctor: Doctor): void {
    const areaId = this.managedArea()?.id;
    if (!areaId || !doctor.id) return;

    this.removingDoctorId.set(doctor.id);
    this.doctorAreaService.deleteByDoctorAndArea(doctor.id, areaId).subscribe({
      next: () => {
        this.areaDoctors.update(list => list.filter(d => d.id !== doctor.id));
        this.removingDoctorId.set(null);
        this.showToast('Doctor quitado del área', 'success');
      },
      error: () => {
        this.removingDoctorId.set(null);
        this.showToast('Error al quitar el doctor', 'error');
      },
    });
  }

  addDoctorToArea(): void {
    const doctorId = this.selectedDoctorIdValue;
    const areaId = this.managedArea()?.id;
    if (!doctorId || !areaId) return;

    this.addingDoctor.set(true);
    this.doctorAreaService.create({ doctorId, evaluationAreaId: areaId }).subscribe({
      next: () => {
        const doctor = this.allDoctors().find(d => d.id === doctorId)!;
        this.areaDoctors.update(list => [...list, doctor]);
        this.selectedDoctorIdValue = null;
        this.addingDoctor.set(false);
        this.showToast('Doctor agregado al área', 'success');
      },
      error: () => {
        this.addingDoctor.set(false);
        this.showToast('Error al agregar el doctor', 'error');
      },
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.isViewMode.set(false);
    this.isDoctorsMode.set(false);
    this.formConfig.set(null);
    this.detailConfig.set(null);
    this.currentAreaId.set(null);
    this.panelLoading.set(false);
    this.managedArea.set(null);
    this.areaDoctors.set([]);
    this.allDoctors.set([]);
    this.selectedDoctorId.set(null);
    this.selectedDoctorIdValue = null;
    this.doctorsPage.set(0);
  }

  // ─── FORM BUILDER ─────────────────────────────────────────────────────────────

  buildFormConfig(mode: 1 | 2, model: EvaluationArea | null): void {
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
          name:        'codeArea',
          label:       'Código',
          type:        'text',
          placeholder: 'Código del área',
          validators:  [Validators.required, Validators.minLength(2)],
        },
        {
          name:        'name',
          label:       'Nombre',
          type:        'text',
          placeholder: 'Nombre del área de evaluación',
          validators:  [Validators.required, Validators.minLength(2)],
        },
      ],
    });
  }

  // ─── SUBMIT / CANCEL ──────────────────────────────────────────────────────────

  handleFormSubmit(data: any): void {
    const mode = this.formConfig()?.mode;

    if (mode === 1) {
      this.evaluationAreaService.create(data).subscribe({
        next: (response) => {
          this.showToast(response.message || 'Área creada exitosamente', 'success');
          this.closePanel();
          this.loadEvaluationAreas();
        },
        error: () => this.showToast('Error al crear área de evaluación', 'error'),
      });
    } else if (mode === 2) {
      this.evaluationAreaService.update(Number(data.id), data).subscribe({
        next: (response) => {
          this.showToast(response.message || 'Área actualizada exitosamente', 'success');
          this.closePanel();
          this.loadEvaluationAreas();
        },
        error: () => this.showToast('Error al actualizar área de evaluación', 'error'),
      });
    }
  }

  handleFormCancel(): void {
    this.closePanel();
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────────

  delete(areaId: number): void {
    this.evaluationAreaService.delete(areaId).subscribe({
      next: () => {
        this.showToast('Área eliminada exitosamente', 'success');
        this.loadEvaluationAreas();
      },
      error: () => this.showToast('Error al eliminar área de evaluación', 'error'),
    });
  }

  // ─── TOAST ────────────────────────────────────────────────────────────────────

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }
}
