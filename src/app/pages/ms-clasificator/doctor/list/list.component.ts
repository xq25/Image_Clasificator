import { Component, OnInit, signal, inject, ChangeDetectorRef, computed } from '@angular/core';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { DynamicTableComponent, TableColumn, TableAction } from '@app/components/dynamic-table/dynamic-table.component';
import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { EntityDetailComponent, EntityDetailConfig, DetailSectionConfig } from '@app/components/entity-detail/entity-detail.component';
import { DoctorService } from '@app/services/ms-clasificator/doctor.service';
import { DoctorAreaService } from '@app/services/ms-clasificator/doctor-area.service';
import { EvaluationAreaService } from '@app/services/ms-clasificator/evaluation-area.service';
import { UserService } from '@app/services/ms-security/user-service';
import { Doctor, DoctorExtended } from '@app/models/ms-clasificator/Doctor/Doctor';
import { EvaluationArea } from '@app/models/ms-clasificator/EvaluationArea/EvaluationArea';
import { DoctorArea } from '@app/models/ms-clasificator/DoctorArea/DoctorArea';
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
    MatInputModule,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class ListComponent implements OnInit {

  private cdr = inject(ChangeDetectorRef);
  private toastTimer: any;

  // ─── TABLE STATE ─────────────────────────────────────────────────────────────
  doctors = signal<Doctor[]>([]);
  loading = signal(true);

  // ─── PANEL STATE ─────────────────────────────────────────────────────────────
  panelOpen       = signal(false);
  panelLoading    = signal(false);
  isViewMode      = signal(false);
  isAreasMode     = signal(false);
  formConfig      = signal<DynamicFormConfig | null>(null);
  detailConfig    = signal<EntityDetailConfig | null>(null);
  currentDoctorId = signal<number | null>(null);
  toast           = signal<Toast | null>(null);

  // ─── AREAS PANEL STATE ────────────────────────────────────────────────────
  managedDoctor        = signal<DoctorExtended | null>(null);
  doctorAreas          = signal<EvaluationArea[]>([]);
  allAreas             = signal<EvaluationArea[]>([]);
  areasLoading         = signal(false);
  addingArea           = signal(false);
  removingAreaId       = signal<number | null>(null);
  selectedAreaIdValue: number | null = null;
  areasPage            = signal(0);
  readonly AREAS_PAGE_SIZE = 5;
  private doctorAreaMap = new Map<number, number>();

  // ─── CREAR NUEVA ÁREA (inline) ────────────────────────────────────────────
  showNewAreaForm  = signal(false);
  newAreaCode      = '';
  newAreaName      = '';
  creatingArea     = signal(false);

  availableAreas = computed(() => {
    const assigned = new Set(this.doctorAreas().map(a => a.id));
    return this.allAreas().filter(a => !assigned.has(a.id));
  });

  pagedAreas = computed(() => {
    const start = this.areasPage() * this.AREAS_PAGE_SIZE;
    return this.doctorAreas().slice(start, start + this.AREAS_PAGE_SIZE);
  });

  totalAreasPages = computed(() =>
    Math.ceil(this.doctorAreas().length / this.AREAS_PAGE_SIZE)
  );

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
    private doctorService: DoctorService,
    private doctorAreaService: DoctorAreaService,
    private evaluationAreaService: EvaluationAreaService,
    private userService: UserService,
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
      case 'manageAreas': this.manageAreas(row); break;
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

  openManageAreas(doctor: Doctor): void {
    this.panelOpen.set(true);
    this.isViewMode.set(false);
    this.isAreasMode.set(true);
    this.areasPage.set(0);
    this.doctorAreas.set([]);
    this.allAreas.set([]);
    this.selectedAreaIdValue = null;
    this.doctorAreaMap.clear();
    this.areasLoading.set(true);

    this.doctorService.findById(doctor.id!).subscribe({
      next: (res) => this.managedDoctor.set(res.data ?? null),
      error: () => {},
    });

    this.evaluationAreaService.findAll().subscribe({
      next: (areasRes) => {
        this.allAreas.set(areasRes.data ?? []);

        this.doctorAreaService.findByDoctorId(doctor.id!).subscribe({
          next: (res) => {
            const relations: DoctorArea[] = res.data ?? [];
            this.doctorAreaMap.clear();
            relations.forEach(da => {
              if (da.evaluationAreaId && da.id) {
                this.doctorAreaMap.set(da.evaluationAreaId, da.id);
              }
            });
            const areaIds = relations.map(r => r.evaluationAreaId).filter((id): id is number => !!id);
            const filtered = this.allAreas().filter(a => areaIds.includes(a.id!));
            this.doctorAreas.set(filtered);
            this.areasLoading.set(false);
          },
          error: () => {
            this.showToast('Error al cargar áreas del doctor', 'error');
            this.areasLoading.set(false);
          },
        });
      },
      error: () => {
        this.showToast('Error al cargar la lista de áreas', 'error');
        this.areasLoading.set(false);
      },
    });
  }

  toggleNewAreaForm(): void {
    this.showNewAreaForm.update(v => !v);
    this.newAreaCode = '';
    this.newAreaName = '';
  }

  createAndAssignArea(): void {
    const code = this.newAreaCode.trim();
    const name = this.newAreaName.trim();
    const doctorId = this.managedDoctor()?.id;
    if (!code || !name || !doctorId) return;

    this.creatingArea.set(true);
    this.evaluationAreaService.create({ codeArea: code, name }).subscribe({
      next: (res) => {
        const newArea = res.data;
        if (!newArea?.id) {
          this.showToast('Área creada pero sin ID retornado', 'error');
          this.creatingArea.set(false);
          return;
        }
        this.allAreas.update(list => [...list, newArea]);
        this.doctorAreaService.create({ doctorId, evaluationAreaId: newArea.id }).subscribe({
          next: (daRes) => {
            if (daRes.data?.id && newArea.id) {
              this.doctorAreaMap.set(newArea.id, daRes.data.id);
            }
            this.doctorAreas.update(list => [...list, newArea]);
            this.newAreaCode = '';
            this.newAreaName = '';
            this.showNewAreaForm.set(false);
            this.creatingArea.set(false);
            this.showToast('Área creada y asignada al doctor', 'success');
          },
          error: () => {
            this.creatingArea.set(false);
            this.showToast('Área creada pero no se pudo asignar al doctor', 'error');
          },
        });
      },
      error: () => {
        this.creatingArea.set(false);
        this.showToast('Error al crear el área de evaluación', 'error');
      },
    });
  }

  addAreaToDoctor(): void {
    const areaId = this.selectedAreaIdValue;
    const doctorId = this.managedDoctor()?.id;
    if (!areaId || !doctorId) return;

    this.addingArea.set(true);
    this.doctorAreaService.create({ doctorId, evaluationAreaId: areaId }).subscribe({
      next: (res) => {
        if (res.data?.id && areaId) {
          this.doctorAreaMap.set(areaId, res.data.id);
        }
        const area = this.allAreas().find(a => a.id === areaId)!;
        this.doctorAreas.update(list => [...list, area]);
        this.selectedAreaIdValue = null;
        this.addingArea.set(false);
        this.showToast('Área agregada al doctor', 'success');
      },
      error: () => {
        this.addingArea.set(false);
        this.showToast('Error al agregar el área', 'error');
      },
    });
  }

  removeAreaFromDoctor(area: EvaluationArea): void {
    const doctorId = this.managedDoctor()?.id;
    if (!doctorId || !area.id) return;

    this.removingAreaId.set(area.id);
    const doctorAreaId = this.doctorAreaMap.get(area.id);

    const delete$ = doctorAreaId
      ? this.doctorAreaService.delete(doctorAreaId)
      : this.doctorAreaService.deleteByDoctorAndArea(doctorId, area.id);

    delete$.subscribe({
      next: () => {
        this.doctorAreas.update(list => list.filter(a => a.id !== area.id));
        this.doctorAreaMap.delete(area.id!);
        this.removingAreaId.set(null);
        this.showToast('Área quitada del doctor', 'success');
      },
      error: () => {
        this.removingAreaId.set(null);
        this.showToast('Error al quitar el área', 'error');
      },
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.isViewMode.set(false);
    this.isAreasMode.set(false);
    this.formConfig.set(null);
    this.detailConfig.set(null);
    this.currentDoctorId.set(null);
    this.panelLoading.set(false);
    this.managedDoctor.set(null);
    this.doctorAreas.set([]);
    this.allAreas.set([]);
    this.selectedAreaIdValue = null;
    this.doctorAreaMap.clear();
    this.areasPage.set(0);
    this.showNewAreaForm.set(false);
    this.newAreaCode = '';
    this.newAreaName = '';
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
        next: () => {
          this.showToast('Doctor creado exitosamente', 'success');
          this.closePanel();
          this.loadDoctors();
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
    this.closePanel();
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

  manageAreas(doctor: Doctor): void {
    this.openManageAreas(doctor);
  }

  // ─── TOAST ────────────────────────────────────────────────────────────────────

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }
}