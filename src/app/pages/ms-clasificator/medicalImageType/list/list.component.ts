import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
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
import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';

import { MedicalImageType, MedicalImageTypeExtended } from '@app/models/ms-clasificator/MedicalImageType/MedicalImageType';
import { EvaluationArea } from '@app/models/ms-clasificator/EvaluationArea/EvaluationArea';

import { MedicalImageTypeService } from '@app/services/ms-clasificator/medical-image-type.service';
import { EvaluationAreaService } from '@app/services/ms-clasificator/evaluation-area.service';

type PanelMode = 'create' | 'edit' | 'view' | 'assign-area';

interface Toast { message: string; type: 'success' | 'error'; }

@Component({
  selector: 'app-medical-image-type-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DynamicTableComponent,
    EntityDetailComponent,
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
  styleUrl: './list.component.scss',
})
export class MedicalImageTypeListComponent implements OnInit {

  private cdr        = inject(ChangeDetectorRef);
  private fb         = inject(FormBuilder);
  private toastTimer: any;

  // ─── DATA ────────────────────────────────────────────────────────────────────
  imageTypes       = signal<MedicalImageType[]>([]);
  evaluationAreas  = signal<EvaluationArea[]>([]);
  loading          = signal(true);

  // ─── PANEL ───────────────────────────────────────────────────────────────────
  panelOpen    = signal(false);
  panelLoading = signal(false);
  panelMode    = signal<PanelMode>('create');
  currentId    = signal<number | null>(null);

  formConfig   = signal<DynamicFormConfig | null>(null);
  detailConfig = signal<EntityDetailConfig | null>(null);
  toast        = signal<Toast | null>(null);

  // ─── ASSIGN AREA ─────────────────────────────────────────────────────────────
  assignAreaForm!: FormGroup;
  currentDetail = signal<MedicalImageTypeExtended | null>(null);

  // ─── TABLE COLUMNS ────────────────────────────────────────────────────────────
  columns: TableColumn[] = [
    { key: 'id',   label: 'ID'             },
    { key: 'name', label: 'Nombre'         },
  ];

  actionButtons: TableAction[] = [
    { action: 'view',       icon: 'visibility',  class: 'btn-view'         },
    { action: 'edit',       icon: 'edit',        class: 'btn-edit'         },
    { action: 'delete',     icon: 'delete',      class: 'btn-delete'       },
    { action: 'assignArea', icon: 'link',        class: 'btn-manage-roles' },
  ];

  constructor(
    private medicalImageTypeService: MedicalImageTypeService,
    private evaluationAreaService: EvaluationAreaService,
  ) {}

  ngOnInit(): void {
    this.initAssignAreaForm();
    this.loadAll();
  }

  // ─── LOAD ────────────────────────────────────────────────────────────────────

  loadAll(): void {
    this.loading.set(true);
    let done = 0;
    const checkDone = () => { if (++done === 2) this.loading.set(false); };

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

  // ─── TABLE ACTIONS ───────────────────────────────────────────────────────────

  handleAction(event: { action: string; row: any }): void {
    const { action, row } = event;
    if (action === 'view')       this.openView(row.id);
    if (action === 'edit')       this.openEdit(row.id);
    if (action === 'delete')     this.delete(row.id);
    if (action === 'assignArea') this.openAssignArea(row.id);
  }

  // ─── OPEN PANEL ──────────────────────────────────────────────────────────────

  openCreate(): void {
    this.panelMode.set('create');
    this.panelOpen.set(true);
    this.currentId.set(null);
    this.currentDetail.set(null);
    this.formConfig.set({
      mode: 1,
      model: null,
      fields: [
        {
          name: 'name', label: 'Nombre del tipo de imagen',
          type: 'text', placeholder: 'Ej. Radiografía de tórax',
          validators: [Validators.required, Validators.minLength(2)],
        },
      ],
    });
    this.detailConfig.set(null);
  }

  openView(id: number): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.panelMode.set('view');
    this.currentId.set(id);

    this.medicalImageTypeService.findById(id).subscribe({
      next: r => {
        const d = r.data!;
        this.currentDetail.set(d);
        this.detailConfig.set({
          title: 'Detalle del Tipo de Imagen', subtitle: d.name,
          icon: 'image', data: {
            id: d.id,
            name: d.name,
            areaName: d.evaluationArea?.name ?? '—',
            areaCode: d.evaluationArea?.codeArea ?? '—',
          },
          fields: [
            { key: 'id',       label: 'ID',                  icon: 'tag'         },
            { key: 'name',     label: 'Nombre',              icon: 'label'       },
            { key: 'areaName', label: 'Área de evaluación',  icon: 'area_chart'  },
            { key: 'areaCode', label: 'Código del área',     icon: 'qr_code'     },
          ],
          primaryActionLabel: 'Editar', primaryActionIcon: 'edit', sections: [],
        });
        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => { this.showToast('Error al cargar tipo de imagen', 'error'); this.closePanel(); },
    });
  }

  openEdit(id: number): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.panelMode.set('edit');
    this.currentId.set(id);
    this.detailConfig.set(null);

    this.medicalImageTypeService.findById(id).subscribe({
      next: r => {
        const d = r.data!;
        this.formConfig.set({
          mode: 2,
          model: { id: d.id, name: d.name },
          fields: [
            { name: 'id',   label: 'ID',     type: 'text', hidden: false, disabled: true },
            {
              name: 'name', label: 'Nombre', type: 'text',
              validators: [Validators.required, Validators.minLength(2)],
            },
          ],
        });
        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => { this.showToast('Error al cargar tipo de imagen', 'error'); this.closePanel(); },
    });
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
    this.currentDetail.set(null);
    this.initAssignAreaForm();
  }

  // ─── FORM ────────────────────────────────────────────────────────────────────

  initAssignAreaForm(): void {
    this.assignAreaForm = this.fb.group({
      evaluationAreaId: [null],
    });
  }

  handleFormSubmit(data: any): void {
    const mode = this.formConfig()?.mode;

    if (mode === 1) {
      this.medicalImageTypeService.create({ name: data.name?.trim() }).subscribe({
        next: r => {
          this.showToast(r.message || 'Tipo de imagen creado', 'success');
          this.closePanel(); this.loadAll();
        },
        error: () => this.showToast('Error al crear tipo de imagen', 'error'),
      });
    } else if (mode === 2) {
      this.medicalImageTypeService.update(Number(data.id), { name: data.name?.trim() }).subscribe({
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

  delete(id: number): void {
    this.medicalImageTypeService.delete(id).subscribe({
      next: () => { this.showToast('Tipo de imagen eliminado', 'success'); this.loadAll(); },
      error: () => this.showToast('Error al eliminar tipo de imagen', 'error'),
    });
  }

  // ─── TOAST ───────────────────────────────────────────────────────────────────

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }
}
