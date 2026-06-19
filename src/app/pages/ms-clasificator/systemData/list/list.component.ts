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
import { MedicalImg } from '@app/models/ms-clasificator/MedicalImage/MedicalImg';
import { MedicalImageType } from '@app/models/ms-clasificator/MedicalImageType/MedicalImageType';

import { PrimitiveDatumService }   from '@app/services/ms-clasificator/primitive-datum.service';
import { MedicalImageService }     from '@app/services/ms-clasificator/medical-image.service';
import { MedicalImageTypeService } from '@app/services/ms-clasificator/medical-image-type.service';
import { EvaluationAreaService }   from '@app/services/ms-clasificator/evaluation-area.service';
import { EvaluationArea }          from '@app/models/ms-clasificator/EvaluationArea/EvaluationArea';

type ActiveTab = 'primitivos' | 'imagenes';
type PanelMode = 'create' | 'edit' | 'view';
type DataKind  = 'primitiveDatum' | 'medicalImage';

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
  medicalImages     = signal<MedicalImg[]>([]);
  imageTypes        = signal<MedicalImageType[]>([]);
  loading           = signal(true);

  // ─── TAB ─────────────────────────────────────────────────────────────────────
  activeTab = signal<ActiveTab>('primitivos');

  // ─── PANEL ───────────────────────────────────────────────────────────────────
  panelOpen    = signal(false);
  panelLoading = signal(false);
  panelMode    = signal<PanelMode>('create');
  currentId    = signal<number | null>(null);

  formConfig   = signal<DynamicFormConfig | null>(null);
  detailConfig = signal<EntityDetailConfig | null>(null);
  toast        = signal<Toast | null>(null);

  // ─── CONFIRM DELETE ───────────────────────────────────────────────────────────
  showDeleteConfirm    = signal(false);
  deleteTargetId       = signal<number | null>(null);
  deleteConfirmMessage = signal('');

  // ─── CREATE FORM ─────────────────────────────────────────────────────────────
  createForm!: FormGroup;
  selectedKind      = signal<DataKind | null>(null);
  showNewTypeForm   = signal(false);
  newTypeForm!: FormGroup;
  selectedFile      = signal<File | null>(null);
  filePreviewUrl    = signal<string | null>(null);
  viewImageUrl      = signal<string | null>(null);
  evaluationAreas   = signal<EvaluationArea[]>([]);

  // ─── ENUM OPTIONS ─────────────────────────────────────────────────────────────
  readonly primitiveTypeOptions = [
    { value: 'STRING',   label: 'String (texto)'          },
    { value: 'INTEGER',  label: 'Integer (entero)'         },
    { value: 'DOUBLE',   label: 'Double (decimal)'         },
    { value: 'BOOLEAN',  label: 'Boolean (verdadero/falso)'},
    { value: 'DATE',     label: 'Date (fecha)'             },
    { value: 'DATETIME', label: 'DateTime'                 },
    { value: 'TIME',     label: 'Time (hora)'              },
    { value: 'BINARY',   label: 'Binary (archivo)'         },
    { value: 'TEXT',     label: 'Text (texto largo)'       },
  ];

  readonly primitiveUnitOptions = [
    { value: 'NONE',                    label: 'Sin unidad'               },
    { value: 'KILOGRAM',                label: 'Kilogramo (kg)'           },
    { value: 'GRAM',                    label: 'Gramo (g)'                },
    { value: 'MILLIGRAM',               label: 'Miligramo (mg)'           },
    { value: 'MICROGRAM',               label: 'Microgramo (µg)'          },
    { value: 'LITER',                   label: 'Litro (L)'                },
    { value: 'MILLILITER',              label: 'Mililitro (mL)'           },
    { value: 'METER',                   label: 'Metro (m)'                },
    { value: 'CENTIMETER',              label: 'Centímetro (cm)'          },
    { value: 'MILLIMETER',              label: 'Milímetro (mm)'           },
    { value: 'CELSIUS',                 label: 'Celsius (°C)'             },
    { value: 'FAHRENHEIT',              label: 'Fahrenheit (°F)'          },
    { value: 'MMHG',                    label: 'mmHg (presión)'           },
    { value: 'BPM',                     label: 'BPM (lat/min)'            },
    { value: 'RESPIRATIONS_PER_MINUTE', label: 'Resp/min'                 },
    { value: 'PERCENT',                 label: 'Porcentaje (%)'           },
    { value: 'SECOND',                  label: 'Segundo (s)'              },
    { value: 'MINUTE',                  label: 'Minuto (min)'             },
    { value: 'HOUR',                    label: 'Hora (h)'                 },
    { value: 'DAY',                     label: 'Día (d)'                  },
    { value: 'MG_DL',                   label: 'mg/dL (glucosa)'          },
    { value: 'MMOL_L',                  label: 'mmol/L'                   },
    { value: 'UNIT',                    label: 'Unidad (U)'               },
    { value: 'INTERNATIONAL_UNIT',      label: 'UI (Unidad Internacional)'},
    { value: 'KG_M2',                   label: 'kg/m² (IMC)'              },
  ];

  // ─── TABLE COLUMNS ────────────────────────────────────────────────────────────
  primitiveCols: TableColumn[] = [
    { key: 'id',   label: 'ID'           },
    { key: 'name', label: 'Nombre'       },
    { key: 'type', label: 'Tipo de dato' },
    { key: 'unit', label: 'Unidad'       },
  ];

  imageCols: TableColumn[] = [
    { key: 'id',                   label: 'ID'          },
    { key: 'medicalImageTypeName', label: 'Tipo'        },
    { key: 'contentType',          label: 'Formato'     },
    { key: 'fileSize',             label: 'Tamaño (B)'  },
    { key: 'createdAt',            label: 'Creada'      },
  ];

  actionButtons: TableAction[] = [
    { action: 'view',   icon: 'visibility', class: 'btn-view'   },
    { action: 'delete', icon: 'delete',     class: 'btn-delete' },
  ];

  primitiveActionButtons: TableAction[] = [
    { action: 'view',   icon: 'visibility', class: 'btn-view'   },
    { action: 'edit',   icon: 'edit',       class: 'btn-edit'   },
    { action: 'delete', icon: 'delete',     class: 'btn-delete' },
  ];

  constructor(
    private primitiveDatumService:   PrimitiveDatumService,
    private medicalImageService:     MedicalImageService,
    private medicalImageTypeService: MedicalImageTypeService,
    private evaluationAreaService:   EvaluationAreaService,
  ) {}

  ngOnInit(): void {
    this.initCreateForm();
    this.initNewTypeForm();
    this.loadAll();
  }

  // ─── LOAD ────────────────────────────────────────────────────────────────────

  loadAll(): void {
    this.loading.set(true);
    let done = 0;
    const checkDone = () => { if (++done === 4) this.loading.set(false); };

    this.primitiveDatumService.findAll().subscribe({
      next: r => { this.primitiveDatums.set(r.data ?? []); checkDone(); },
      error: () => checkDone(),
    });

    this.medicalImageService.findAll().subscribe({
      next: r => { this.medicalImages.set(r.data ?? []); checkDone(); },
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

  get imageTypeOptions() {
    return this.imageTypes().map(t => ({ value: t.id!, label: t.name }));
  }

  // ─── TABS ────────────────────────────────────────────────────────────────────

  setTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
    this.closePanel();
  }

  // ─── TABLE ACTIONS ───────────────────────────────────────────────────────────

  handleAction(event: { action: string; row: any }): void {
    const { action, row } = event;
    if (action === 'view')   this.openView(row.id);
    if (action === 'edit')   this.openEdit(row.id);
    if (action === 'delete') this.openDeleteConfirm(row.id);
  }

  // ─── OPEN PANEL ──────────────────────────────────────────────────────────────

  openCreate(): void {
    this.panelMode.set('create');
    this.panelOpen.set(true);
    this.initCreateForm();
    this.initNewTypeForm();
    this.formConfig.set(null);
    this.detailConfig.set(null);
    this.showNewTypeForm.set(false);
    this.selectedFile.set(null);
    this.filePreviewUrl.set(null);
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
      this.medicalImageService.findById(id).subscribe({
        next: r => {
          const d = r.data!;
          this.viewImageUrl.set(d.imageUrl ?? null);
          const flat = {
            id:            d.id,
            imageKey:      d.imageKey,
            provider:      d.provider,
            contentType:   d.contentType   ?? '—',
            fileSize:      d.fileSize      ?? '—',
            createdAt:     d.createdAt     ?? '—',
            imageTypeName: d.medicalImageType?.name ?? '—',
            imageTypeId:   d.medicalImageType?.id   ?? '—',
          };
          this.detailConfig.set({
            title: 'Detalle de Imagen Médica', subtitle: d.medicalImageType?.name ?? '',
            icon: 'image', data: flat,
            fields: [
              { key: 'id',           label: 'ID',          icon: 'tag'           },
              { key: 'imageTypeName',label: 'Tipo',         icon: 'category'      },
              { key: 'contentType',  label: 'Formato',      icon: 'description'   },
              { key: 'fileSize',     label: 'Tamaño (B)',   icon: 'storage'       },
              { key: 'provider',     label: 'Proveedor',    icon: 'cloud'         },
              { key: 'imageKey',     label: 'Clave',        icon: 'key'           },
              { key: 'createdAt',    label: 'Fecha',        icon: 'calendar_today'},
            ],
            primaryActionLabel: '', primaryActionIcon: '', sections: [],
          });
          this.panelLoading.set(false);
          this.cdr.detectChanges();
        },
        error: () => { this.showToast('Error al cargar imagen médica', 'error'); this.closePanel(); },
      });
    }
  }

  openEdit(id: number): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.panelMode.set('edit');
    this.currentId.set(id);
    this.detailConfig.set(null);

    this.primitiveDatumService.findById(id).subscribe({
      next: r => {
        const d = r.data!;
        this.formConfig.set({
          mode: 2,
          model: d,
          fields: [
            { name: 'id',   label: 'ID',                type: 'text',   hidden: false, disabled: true },
            { name: 'name', label: 'Nombre',             type: 'text',   validators: [Validators.required] },
            { name: 'type', label: 'Tipo de dato',       type: 'select',
              options: this.primitiveTypeOptions,         validators: [Validators.required] },
            { name: 'unit', label: 'Unidad',             type: 'select',
              options: this.primitiveUnitOptions,         validators: [Validators.required] },
          ],
        });
        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => { this.showToast('Error al cargar dato primitivo', 'error'); this.closePanel(); },
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
    this.showNewTypeForm.set(false);
    this.selectedFile.set(null);
    this.filePreviewUrl.set(null);
    this.viewImageUrl.set(null);
    this.initCreateForm();
    this.initNewTypeForm();
  }

  // ─── CREATE FORM ─────────────────────────────────────────────────────────────

  initCreateForm(): void {
    this.createForm = this.fb.group({
      dataKind:          [''],
      primName:          [''],
      primType:          [''],
      primUnit:          ['NONE'],
      imgTypeId:         [null],
    });

    this.createForm.get('dataKind')!.valueChanges.subscribe(kind => {
      this.selectedKind.set(kind || null);
      this.updateCreateValidators(kind);
    });
  }

  initNewTypeForm(): void {
    this.newTypeForm = this.fb.group({
      typeName:        ['', [Validators.required, Validators.minLength(2)]],
      evaluationAreaId: [null],
    });
  }

  updateCreateValidators(kind: DataKind | null): void {
    const primName  = this.createForm.get('primName')!;
    const primType  = this.createForm.get('primType')!;
    const primUnit  = this.createForm.get('primUnit')!;
    const imgTypeId = this.createForm.get('imgTypeId')!;

    [primName, primType, primUnit, imgTypeId].forEach(c => c.clearValidators());

    if (kind === 'primitiveDatum') {
      primName.setValidators([Validators.required]);
      primType.setValidators([Validators.required]);
      primUnit.setValidators([Validators.required]);
    } else if (kind === 'medicalImage') {
      imgTypeId.setValidators([Validators.required]);
    }

    [primName, primType, primUnit, imgTypeId].forEach(c => c.updateValueAndValidity());
  }

  // ─── FILE UPLOAD ─────────────────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0] ?? null;
    this.selectedFile.set(file);

    if (file) {
      const url = URL.createObjectURL(file);
      this.filePreviewUrl.set(url);
    } else {
      this.filePreviewUrl.set(null);
    }
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.filePreviewUrl.set(null);
  }

  // ─── NUEVO TIPO INLINE ───────────────────────────────────────────────────────

  toggleNewTypeForm(): void {
    this.showNewTypeForm.update(v => !v);
    if (!this.showNewTypeForm()) this.initNewTypeForm();
  }

  submitNewType(): void {
    this.newTypeForm.markAllAsTouched();
    if (this.newTypeForm.invalid) return;

    const name = this.newTypeForm.value.typeName?.trim();
    const areaId = this.newTypeForm.value.evaluationAreaId as number | null;
    if (!name) return;

    this.medicalImageTypeService.create({ name }).subscribe({
      next: created => {
        const newId = created.data?.id;
        const afterCreate = () => {
          this.showToast('Tipo de imagen creado', 'success');
          this.medicalImageTypeService.findAll().subscribe({
            next: res => {
              this.imageTypes.set(res.data ?? []);
              const newType = res.data?.find(t => t.name === name);
              if (newType?.id) this.createForm.get('imgTypeId')!.setValue(newType.id);
            },
          });
          this.showNewTypeForm.set(false);
          this.initNewTypeForm();
        };

        if (newId && areaId) {
          this.medicalImageTypeService.assignEvaluationArea(newId, areaId).subscribe({
            next: () => afterCreate(),
            error: () => {
              this.showToast('Tipo creado, pero error al asignar área', 'error');
              afterCreate();
            },
          });
        } else {
          afterCreate();
        }
      },
      error: () => this.showToast('Error al crear tipo de imagen', 'error'),
    });
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

    } else {
      const file = this.selectedFile();
      if (!file) { this.showToast('Selecciona un archivo de imagen', 'error'); return; }

      const typeId = Number(raw.imgTypeId);
      if (!typeId) { this.showToast('Selecciona un tipo de imagen', 'error'); return; }

      this.medicalImageService.upload(file, typeId).subscribe({
        next: r => {
          this.showToast(r.message || 'Imagen médica cargada exitosamente', 'success');
          this.closePanel(); this.loadAll();
        },
        error: () => this.showToast('Error al cargar imagen médica', 'error'),
      });
    }
  }

  // ─── EDIT SUBMIT ─────────────────────────────────────────────────────────────

  handleFormSubmit(data: any): void {
    const id = Number(data.id);
    this.primitiveDatumService.update(id, data).subscribe({
      next: r => {
        this.showToast(r.message || 'Dato actualizado', 'success');
        this.closePanel(); this.loadAll();
      },
      error: () => this.showToast('Error al actualizar dato primitivo', 'error'),
    });
  }

  handleFormCancel(): void { this.closePanel(); }

  // ─── DELETE ──────────────────────────────────────────────────────────────────

  openDeleteConfirm(id: number): void {
    this.deleteTargetId.set(id);
    const label = this.activeTab() === 'primitivos' ? 'dato primitivo' : 'imagen médica';
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
      this.medicalImageService.delete(id).subscribe({
        next: () => { this.showToast('Imagen médica eliminada', 'success'); this.deleteTargetId.set(null); this.loadAll(); },
        error: () => { this.showToast('Error al eliminar imagen médica', 'error'); this.deleteTargetId.set(null); },
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
