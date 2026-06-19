import {
  Component, OnInit, signal, inject, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { DynamicTableComponent, TableAction, TableColumn } from '@app/components/dynamic-table/dynamic-table.component';
import { EntityDetailComponent, EntityDetailConfig } from '@app/components/entity-detail/entity-detail.component';
import { ConfirmDeleteComponent } from '@app/components/confirm-delete/confirm-delete.component';
import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';

import { PrimitiveDatum, PrimitiveDatumType, PrimitiveUnit } from '@app/models/ms-clasificator/PrimitiveDatum/PrimitiveDatum';
import { MedicalImageType, MedicalImageTypeExtended } from '@app/models/ms-clasificator/MedicalImageType/MedicalImageType';

import { PrimitiveDatumService }   from '@app/services/ms-clasificator/primitive-datum.service';
import { MedicalImageTypeService } from '@app/services/ms-clasificator/medical-image-type.service';
import { EvaluationAreaService }   from '@app/services/ms-clasificator/evaluation-area.service';
import { EvaluationArea }          from '@app/models/ms-clasificator/EvaluationArea/EvaluationArea';

type ActiveTab = 'primitivos' | 'imagenes';
type PanelMode = 'create' | 'edit' | 'view' | 'assign-area';
type DataKind  = 'primitiveDatum' | 'medicalImageType';

interface Toast { message: string; type: 'success' | 'error'; }

@Component({
  selector: 'app-system-data-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DynamicTableComponent,
    EntityDetailComponent,
    ConfirmDeleteComponent,
    DynamicFormComponent,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './list.component.html',
  styleUrl:    './list.component.scss',
})
export class SystemDataListComponent implements OnInit {

  private cdr       = inject(ChangeDetectorRef);
  private fb        = inject(FormBuilder);
  private toastTimer: any;

  // ─── DATA ────────────────────────────────────────────────────────────────────
  primitiveDatums   = signal<PrimitiveDatum[]>([]);
  imageTypes        = signal<MedicalImageType[]>([]);
  loading           = signal(true);

  // ─── TAB ─────────────────────────────────────────────────────────────────────
  activeTab = signal<ActiveTab>('primitivos');

  // ─── PANEL ───────────────────────────────────────────────────────────────────
  panelOpen    = signal(false);
  panelLoading = signal(false);
  panelMode    = signal<PanelMode>('create');
  currentId    = signal<number | null>(null);

  formConfig    = signal<DynamicFormConfig | null>(null);
  detailConfig  = signal<EntityDetailConfig | null>(null);
  currentDetail = signal<MedicalImageTypeExtended | null>(null);
  toast         = signal<Toast | null>(null);

  // ─── CONFIRM DELETE ───────────────────────────────────────────────────────────
  showDeleteConfirm    = signal(false);
  deleteTargetId       = signal<number | null>(null);
  deleteConfirmMessage = signal('');

  // ─── CREATE FORM ─────────────────────────────────────────────────────────────
  createForm!: FormGroup;
  selectedKind    = signal<DataKind | null>(null);
  evaluationAreas = signal<EvaluationArea[]>([]);

  // ─── ASSIGN AREA FORM ────────────────────────────────────────────────────────
  assignAreaForm!: FormGroup;

  // ─── ENUM OPTIONS ─────────────────────────────────────────────────────────────
  readonly primitiveTypeOptions = [
    { value: 'STRING',   label: 'String (texto)'           },
    { value: 'INTEGER',  label: 'Integer (entero)'          },
    { value: 'DOUBLE',   label: 'Double (decimal)'          },
    { value: 'BOOLEAN',  label: 'Boolean (verdadero/falso)' },
    { value: 'DATE',     label: 'Date (fecha)'              },
    { value: 'DATETIME', label: 'DateTime'                  },
    { value: 'TIME',     label: 'Time (hora)'               },
    { value: 'BINARY',   label: 'Binary (archivo)'          },
    { value: 'TEXT',     label: 'Text (texto largo)'        },
  ];

  readonly primitiveUnitOptions = [
    { value: 'NONE',                    label: 'Sin unidad'                },
    { value: 'KILOGRAM',                label: 'Kilogramo (kg)'            },
    { value: 'GRAM',                    label: 'Gramo (g)'                 },
    { value: 'MILLIGRAM',               label: 'Miligramo (mg)'            },
    { value: 'MICROGRAM',               label: 'Microgramo (µg)'           },
    { value: 'LITER',                   label: 'Litro (L)'                 },
    { value: 'MILLILITER',              label: 'Mililitro (mL)'            },
    { value: 'METER',                   label: 'Metro (m)'                 },
    { value: 'CENTIMETER',              label: 'Centímetro (cm)'           },
    { value: 'MILLIMETER',              label: 'Milímetro (mm)'            },
    { value: 'CELSIUS',                 label: 'Celsius (°C)'              },
    { value: 'FAHRENHEIT',              label: 'Fahrenheit (°F)'           },
    { value: 'MMHG',                    label: 'mmHg (presión)'            },
    { value: 'BPM',                     label: 'BPM (lat/min)'             },
    { value: 'RESPIRATIONS_PER_MINUTE', label: 'Resp/min'                  },
    { value: 'PERCENT',                 label: 'Porcentaje (%)'            },
    { value: 'SECOND',                  label: 'Segundo (s)'               },
    { value: 'MINUTE',                  label: 'Minuto (min)'              },
    { value: 'HOUR',                    label: 'Hora (h)'                  },
    { value: 'DAY',                     label: 'Día (d)'                   },
    { value: 'MG_DL',                   label: 'mg/dL (glucosa)'           },
    { value: 'MMOL_L',                  label: 'mmol/L'                    },
    { value: 'UNIT',                    label: 'Unidad (U)'                },
    { value: 'INTERNATIONAL_UNIT',      label: 'UI (Unidad Internacional)' },
    { value: 'KG_M2',                   label: 'kg/m² (IMC)'               },
  ];

  // ─── TABLE COLUMNS ────────────────────────────────────────────────────────────
  primitiveCols: TableColumn[] = [
    { key: 'id',   label: 'ID'           },
    { key: 'name', label: 'Nombre'       },
    { key: 'type', label: 'Tipo de dato' },
    { key: 'unit', label: 'Unidad'       },
  ];

  imageCols: TableColumn[] = [
    { key: 'id',   label: 'ID'     },
    { key: 'name', label: 'Nombre' },
  ];

  primitiveActionButtons: TableAction[] = [
    { action: 'view',   icon: 'visibility', class: 'btn-view'   },
    { action: 'edit',   icon: 'edit',       class: 'btn-edit'   },
    { action: 'delete', icon: 'delete',     class: 'btn-delete' },
  ];

  imageTypeActionButtons: TableAction[] = [
    { action: 'view',       icon: 'visibility', class: 'btn-view'         },
    { action: 'edit',       icon: 'edit',       class: 'btn-edit'         },
    { action: 'delete',     icon: 'delete',     class: 'btn-delete'       },
    { action: 'assignArea', icon: 'link',       class: 'btn-manage-roles' },
  ];

  constructor(
    private primitiveDatumService:   PrimitiveDatumService,
    private medicalImageTypeService: MedicalImageTypeService,
    private evaluationAreaService:   EvaluationAreaService,
  ) {}

  ngOnInit(): void {
    this.initCreateForm();
    this.initAssignAreaForm();
    this.loadAll();
  }

  // ─── LOAD ────────────────────────────────────────────────────────────────────

  loadAll(): void {
    this.loading.set(true);
    let done = 0;
    const checkDone = () => { if (++done === 3) this.loading.set(false); };

    this.primitiveDatumService.findAll().subscribe({
      next: r => { this.primitiveDatums.set(r.data ?? []); checkDone(); },
      error: () => checkDone(),
    });

    this.medicalImageTypeService.findAll().subscribe({
      next: r => { this.imageTypes.set(r.data ?? []); checkDone(); },
      error: () => checkDone(),
    });

    this.evaluationAreaService.findAll().subscribe({
      next: r => { this.evaluationAreas.set(r.data ?? []); checkDone(); },
      error: () => checkDone(),
    });
  }

  get evaluationAreaOptions() {
    return this.evaluationAreas().map(a => ({ value: a.id!, label: `${a.codeArea} – ${a.name}` }));
  }

  // ─── TABS ────────────────────────────────────────────────────────────────────

  setTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
    this.closePanel();
  }

  // ─── TABLE ACTIONS ───────────────────────────────────────────────────────────

  handleAction(event: { action: string; row: any }): void {
    const { action, row } = event;
    if (action === 'view')       this.openView(row.id);
    if (action === 'edit')       this.openEdit(row.id);
    if (action === 'delete')     this.openDeleteConfirm(row.id);
    if (action === 'assignArea') this.openAssignArea(row.id);
  }

  // ─── OPEN PANEL ──────────────────────────────────────────────────────────────

  openCreate(): void {
    this.panelMode.set('create');
    this.panelOpen.set(true);
    this.initCreateForm();
    this.initAssignAreaForm();
    this.formConfig.set(null);
    this.detailConfig.set(null);
    this.currentDetail.set(null);

    if (this.activeTab() === 'imagenes') {
      this.createForm.get('dataKind')!.setValue('medicalImageType');
    }
  }

  openView(id: number): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.panelMode.set('view');
    this.currentId.set(id);

    if (this.activeTab() === 'primitivos') {
      this.primitiveDatumService.findById(id).subscribe({
        next: r => {
          const d = r.data!;
          this.detailConfig.set({
            title: 'Detalle del Dato Primitivo', subtitle: d.name,
            icon: 'data_object', data: d,
            fields: [
              { key: 'id',   label: 'ID',          icon: 'tag'        },
              { key: 'name', label: 'Nombre',       icon: 'label'      },
              { key: 'type', label: 'Tipo de dato', icon: 'code'       },
              { key: 'unit', label: 'Unidad',       icon: 'straighten' },
            ],
            primaryActionLabel: 'Editar', primaryActionIcon: 'edit', sections: [],
          });
          this.panelLoading.set(false);
          this.cdr.detectChanges();
        },
        error: () => { this.showToast('Error al cargar dato primitivo', 'error'); this.closePanel(); },
      });
    } else {
      this.medicalImageTypeService.findById(id).subscribe({
        next: r => {
          const d = r.data!;
          this.currentDetail.set(d);
          this.detailConfig.set({
            title: 'Detalle del Tipo de Imagen', subtitle: d.name,
            icon: 'image', data: {
              id:       d.id,
              name:     d.name,
              areaName: d.evaluationArea?.name    ?? '—',
              areaCode: d.evaluationArea?.codeArea ?? '—',
            },
            fields: [
              { key: 'id',       label: 'ID',                 icon: 'tag'        },
              { key: 'name',     label: 'Nombre',              icon: 'label'      },
              { key: 'areaName', label: 'Área de evaluación',  icon: 'area_chart' },
              { key: 'areaCode', label: 'Código del área',     icon: 'qr_code'   },
            ],
            primaryActionLabel: 'Editar', primaryActionIcon: 'edit', sections: [],
          });
          this.panelLoading.set(false);
          this.cdr.detectChanges();
        },
        error: () => { this.showToast('Error al cargar tipo de imagen', 'error'); this.closePanel(); },
      });
    }
  }

  openEdit(id: number): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.panelMode.set('edit');
    this.currentId.set(id);
    this.detailConfig.set(null);

    if (this.activeTab() === 'primitivos') {
      this.primitiveDatumService.findById(id).subscribe({
        next: r => {
          const d = r.data!;
          this.formConfig.set({
            mode: 2,
            model: d,
            fields: [
              { name: 'id',   label: 'ID',          type: 'text',   hidden: false, disabled: true },
              { name: 'name', label: 'Nombre',       type: 'text',   validators: [Validators.required] },
              { name: 'type', label: 'Tipo de dato', type: 'select',
                options: this.primitiveTypeOptions,  validators: [Validators.required] },
              { name: 'unit', label: 'Unidad',       type: 'select',
                options: this.primitiveUnitOptions,  validators: [Validators.required] },
            ],
          });
          this.panelLoading.set(false);
          this.cdr.detectChanges();
        },
        error: () => { this.showToast('Error al cargar dato primitivo', 'error'); this.closePanel(); },
      });
    } else {
      this.medicalImageTypeService.findById(id).subscribe({
        next: r => {
          const d = r.data!;
          this.formConfig.set({
            mode: 2,
            model: { id: d.id, name: d.name },
            fields: [
              { name: 'id',   label: 'ID',     type: 'text', hidden: false, disabled: true },
              { name: 'name', label: 'Nombre', type: 'text',
                validators: [Validators.required, Validators.minLength(2)] },
            ],
          });
          this.panelLoading.set(false);
          this.cdr.detectChanges();
        },
        error: () => { this.showToast('Error al cargar tipo de imagen', 'error'); this.closePanel(); },
      });
    }
  }

  openAssignArea(id: number): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.panelMode.set('assign-area');
    this.currentId.set(id);
    this.formConfig.set(null);
    this.detailConfig.set(null);
    this.initAssignAreaForm();

    this.medicalImageTypeService.findById(id).subscribe({
      next: r => {
        const d = r.data!;
        this.currentDetail.set(d);
        if (d.evaluationArea?.id) {
          this.assignAreaForm.get('evaluationAreaId')!.setValue(d.evaluationArea.id);
        }
        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => { this.showToast('Error al cargar tipo de imagen', 'error'); this.closePanel(); },
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.panelMode.set('create');
    this.currentId.set(null);
    this.formConfig.set(null);
    this.detailConfig.set(null);
    this.panelLoading.set(false);
    this.selectedKind.set(null);
    this.currentDetail.set(null);
    this.initCreateForm();
    this.initAssignAreaForm();
  }

  // ─── CREATE FORM ─────────────────────────────────────────────────────────────

  initCreateForm(): void {
    this.createForm = this.fb.group({
      dataKind:      [''],
      primName:      [''],
      primType:      [''],
      primUnit:      ['NONE'],
      imgTypeName:   [''],
      imgTypeAreaId: [null],
    });

    this.createForm.get('dataKind')!.valueChanges.subscribe(kind => {
      this.selectedKind.set(kind || null);
      this.updateCreateValidators(kind);
    });
  }

  initAssignAreaForm(): void {
    this.assignAreaForm = this.fb.group({
      evaluationAreaId: [null],
    });
  }

  updateCreateValidators(kind: DataKind | null): void {
    const primName    = this.createForm.get('primName')!;
    const primType    = this.createForm.get('primType')!;
    const primUnit    = this.createForm.get('primUnit')!;
    const imgTypeName = this.createForm.get('imgTypeName')!;

    [primName, primType, primUnit, imgTypeName].forEach(c => c.clearValidators());

    if (kind === 'primitiveDatum') {
      primName.setValidators([Validators.required]);
      primType.setValidators([Validators.required]);
      primUnit.setValidators([Validators.required]);
    } else if (kind === 'medicalImageType') {
      imgTypeName.setValidators([Validators.required, Validators.minLength(2)]);
    }

    [primName, primType, primUnit, imgTypeName].forEach(c => c.updateValueAndValidity());
  }

  // ─── SUBMIT CREATE ───────────────────────────────────────────────────────────

  submitCreate(): void {
    const kind = this.selectedKind();
    this.createForm.markAllAsTouched();
    if (!kind || this.createForm.invalid) return;

    const raw = this.createForm.getRawValue();

    if (kind === 'primitiveDatum') {
      const name = raw.primName?.trim();
      if (!name) { this.showToast('El nombre es obligatorio', 'error'); return; }

      this.primitiveDatumService.create({
        name,
        type: raw.primType as PrimitiveDatumType,
        unit: (raw.primUnit as PrimitiveUnit) || PrimitiveUnit.NONE,
      }).subscribe({
        next: r => {
          this.showToast(r.message || 'Dato primitivo creado', 'success');
          this.closePanel(); this.loadAll();
        },
        error: () => this.showToast('Error al crear dato primitivo', 'error'),
      });

    } else if (kind === 'medicalImageType') {
      const name = raw.imgTypeName?.trim();
      const areaId = raw.imgTypeAreaId as number | null;
      if (!name) { this.showToast('El nombre es obligatorio', 'error'); return; }

      this.medicalImageTypeService.create({ name }).subscribe({
        next: created => {
          const newId = created.data?.id;
          const afterCreate = () => {
            this.showToast('Tipo de imagen creado', 'success');
            this.closePanel(); this.loadAll();
          };

          if (newId && areaId) {
            this.medicalImageTypeService.assignEvaluationArea(newId, areaId).subscribe({
              next: () => afterCreate(),
              error: () => { this.showToast('Tipo creado, error al asignar área', 'error'); afterCreate(); },
            });
          } else {
            afterCreate();
          }
        },
        error: () => this.showToast('Error al crear tipo de imagen', 'error'),
      });
    }
  }

  // ─── EDIT SUBMIT ─────────────────────────────────────────────────────────────

  handleFormSubmit(data: any): void {
    if (this.activeTab() === 'primitivos') {
      const id = Number(data.id);
      this.primitiveDatumService.update(id, data).subscribe({
        next: r => {
          this.showToast(r.message || 'Dato actualizado', 'success');
          this.closePanel(); this.loadAll();
        },
        error: () => this.showToast('Error al actualizar dato primitivo', 'error'),
      });
    } else {
      const id = Number(data.id);
      this.medicalImageTypeService.update(id, { name: data.name?.trim() }).subscribe({
        next: r => {
          this.showToast(r.message || 'Tipo de imagen actualizado', 'success');
          this.closePanel(); this.loadAll();
        },
        error: () => this.showToast('Error al actualizar tipo de imagen', 'error'),
      });
    }
  }

  handleFormCancel(): void { this.closePanel(); }

  // ─── ASSIGN / REMOVE AREA ────────────────────────────────────────────────────

  submitAssignArea(): void {
    const areaId = this.assignAreaForm.value.evaluationAreaId;
    const id = this.currentId()!;

    if (!areaId) {
      this.showToast('Selecciona un área de evaluación', 'error');
      return;
    }

    this.medicalImageTypeService.assignEvaluationArea(id, areaId).subscribe({
      next: r => {
        this.showToast('Área de evaluación asignada', 'success');
        this.currentDetail.set(r.data ?? null);
        this.loadAll();
      },
      error: () => this.showToast('Error al asignar área de evaluación', 'error'),
    });
  }

  removeArea(): void {
    const id = this.currentId()!;
    this.medicalImageTypeService.removeEvaluationArea(id).subscribe({
      next: r => {
        this.showToast('Área de evaluación removida', 'success');
        this.currentDetail.set(r.data ?? null);
        this.loadAll();
      },
      error: () => this.showToast('Error al remover área de evaluación', 'error'),
    });
  }

  // ─── DELETE ──────────────────────────────────────────────────────────────────

  openDeleteConfirm(id: number): void {
    this.deleteTargetId.set(id);
    const label = this.activeTab() === 'primitivos' ? 'dato primitivo' : 'tipo de imagen';
    this.deleteConfirmMessage.set(`¿Está seguro que desea eliminar el ${label} con ID "${id}"?`);
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
    if (this.activeTab() === 'primitivos') {
      this.primitiveDatumService.delete(id).subscribe({
        next: () => { this.showToast('Dato primitivo eliminado', 'success'); this.deleteTargetId.set(null); this.loadAll(); },
        error: () => { this.showToast('Error al eliminar dato primitivo', 'error'); this.deleteTargetId.set(null); },
      });
    } else {
      this.medicalImageTypeService.delete(id).subscribe({
        next: () => { this.showToast('Tipo de imagen eliminado', 'success'); this.deleteTargetId.set(null); this.loadAll(); },
        error: () => { this.showToast('Error al eliminar tipo de imagen', 'error'); this.deleteTargetId.set(null); },
      });
    }
  }

  // ─── TOAST ───────────────────────────────────────────────────────────────────

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }
}
