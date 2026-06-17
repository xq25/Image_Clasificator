import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { forkJoin } from 'rxjs';

import { DatasetService } from '@app/services/ms-clasificator/dataset.service';
import { DatasetCategoryService } from '@app/services/ms-clasificator/dataset-category.service';
import { DiagnosticCategoryDatasetService } from '@app/services/ms-clasificator/diagnostic-category-dataset.service';
import { MedicalDiagnosticService } from '@app/services/ms-clasificator/medical-diagnostic.service';
import { MedicalImageTypeService } from '@app/services/ms-clasificator/medical-image-type.service';

import { MedicalDiagnostic, MedicalDiagnosticExtended } from '@app/models/ms-clasificator/MedicalDiagnostic/MedicalDiagnostic';
import { MedicalImageType } from '@app/models/ms-clasificator/MedicalImageType/MedicalImageType';

interface Toast { message: string; type: 'success' | 'error'; }

interface DiagAssociation {
  assocId: number;
  diagnostic: MedicalDiagnostic;
}

export interface CategoryRow {
  numValue:     number;
  categoryId?:  number;
  associations: DiagAssociation[];
  searchValue:  string;
  showDropdown: boolean;
  filteredOptions: MedicalDiagnostic[];
  saving:       boolean;
}

const CATEGORY_COLORS = [
  '#22c55e', '#eab308', '#8b5cf6', '#3b82f6',
  '#ec4899', '#9ca3af', '#f97316', '#06b6d4', '#ef4444', '#84cc16',
];

const TINDER_POSITIONS: { label: string; icon: string }[] = [
  { label: 'Arriba',    icon: 'arrow_upward'   },
  { label: 'Izquierda', icon: 'arrow_back'     },
  { label: 'Derecha',   icon: 'arrow_forward'  },
  { label: 'Abajo',     icon: 'arrow_downward' },
];

@Component({
  selector: 'app-create-dataset',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss',
})
export class CreateDatasetComponent implements OnInit {

  private fb     = inject(FormBuilder);
  private router = inject(Router);
  private toastTimer: any;

  // ─── WIZARD ──────────────────────────────────────────────────────────────────
  currentStep = signal<1 | 2 | 3 | 4>(1);

  // ─── DATASET PERSISTIDO ──────────────────────────────────────────────────────
  createdDatasetId = signal<number | null>(null);

  // ─── CATÁLOGOS ───────────────────────────────────────────────────────────────
  diagnostics      = signal<MedicalDiagnosticExtended[]>([]);
  imageTypes       = signal<MedicalImageType[]>([]);
  subDiagnostics   = signal<MedicalDiagnostic[]>([]);
  loadingCatalogs  = signal(true);

  // ─── ICD-10 SEARCH (step 1) ──────────────────────────────────────────────────
  diagnosticSearch    = signal('');
  filteredDiagnostics = signal<MedicalDiagnosticExtended[]>([]);

  // ─── FORMULARIO ──────────────────────────────────────────────────────────────
  form!: FormGroup;
  selectedDiagnostic = signal<MedicalDiagnosticExtended | null>(null);
  selectedImageType  = signal<MedicalImageType | null>(null);

  // ─── CATEGORÍAS ──────────────────────────────────────────────────────────────
  categories = signal<CategoryRow[]>([]);

  // ─── FLAGS ───────────────────────────────────────────────────────────────────
  submittingStep1 = signal(false);
  toast           = signal<Toast | null>(null);

  // ─── COMPUTED (step 3) ───────────────────────────────────────────────────────
  readonly tinderMode = computed(() => this.categories().length <= 4);

  readonly tinderSlots = computed(() =>
    this.categories().map((cat, i) => ({
      cat,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      label: TINDER_POSITIONS[i]?.label ?? `Categoría ${cat.numValue}`,
      icon:  TINDER_POSITIONS[i]?.icon  ?? 'category',
      isLast: i === this.categories().length - 1,
    }))
  );

  readonly buttonSlots = computed(() =>
    this.categories().map((cat, i) => ({
      cat,
      color:       CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      displayName: this.getCategoryName(cat),
      codeCount:   cat.associations.length,
    }))
  );

  readonly totalCodes = computed(() =>
    this.categories().reduce((sum, c) => sum + c.associations.length, 0)
  );

  readonly hasPendingSaves = computed(() =>
    this.categories().some(c => c.saving)
  );

  readonly step2CanAdvance = computed(() =>
    this.categories().length > 0 &&
    !this.hasPendingSaves() &&
    this.categories().every(c => c.associations.length > 0)
  );

  constructor(
    private datasetService:                   DatasetService,
    private datasetCategoryService:           DatasetCategoryService,
    private diagnosticCategoryDatasetService: DiagnosticCategoryDatasetService,
    private medicalDiagnosticService:         MedicalDiagnosticService,
    private medicalImageTypeService:          MedicalImageTypeService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name:                ['', [Validators.required, Validators.minLength(3)]],
      medicalDiagnosticId: [null, Validators.required],
      medicalImageTypeId:  [null, Validators.required],
    });

    forkJoin([
      this.medicalDiagnosticService.findAll(),
      this.medicalImageTypeService.findAll(),
    ]).subscribe({
      next: ([diagRes, imageTypeRes]) => {
        this.diagnostics.set(diagRes ?? []);
        this.imageTypes.set(imageTypeRes.data ?? []);
        this.filteredDiagnostics.set(diagRes ?? []);
        this.loadingCatalogs.set(false);
      },
      error: () => {
        this.showToast('Error al cargar catálogos', 'error');
        this.loadingCatalogs.set(false);
      },
    });
  }

  // ─── ICD-10 SEARCH ───────────────────────────────────────────────────────────

  onSearchChange(value: string): void {
    this.diagnosticSearch.set(value);
    const q = value.toLowerCase().trim();
    this.filteredDiagnostics.set(
      !q ? this.diagnostics()
         : this.diagnostics().filter(d =>
             d.diagnosticCode.toLowerCase().includes(q) ||
             d.diagnosticName.toLowerCase().includes(q)
           )
    );
  }

  selectDiagnostic(d: MedicalDiagnosticExtended): void {
    this.selectedDiagnostic.set(d);
    this.form.patchValue({ medicalDiagnosticId: d.id });
    this.diagnosticSearch.set(`${d.diagnosticCode} – ${d.diagnosticName}`);
    this.filteredDiagnostics.set([]);
  }

  clearDiagnostic(): void {
    this.selectedDiagnostic.set(null);
    this.form.patchValue({ medicalDiagnosticId: null });
    this.diagnosticSearch.set('');
    this.filteredDiagnostics.set(this.diagnostics());
  }

  selectImageType(imageType: MedicalImageType): void {
    if (this.selectedImageType()?.id === imageType.id) {
      this.selectedImageType.set(null);
      this.form.patchValue({ medicalImageTypeId: null });
    } else {
      this.selectedImageType.set(imageType);
      this.form.patchValue({ medicalImageTypeId: imageType.id });
    }
  }

  // ─── STEP 1 → Siguiente ──────────────────────────────────────────────────────

  step1Next(): void {
    this.form.get('name')?.markAsTouched();
    this.form.get('medicalDiagnosticId')?.markAsTouched();
    this.form.get('medicalImageTypeId')?.markAsTouched();
    if (!this.step1Valid()) return;

    this.submittingStep1.set(true);
    const raw = this.form.getRawValue();

    if (this.createdDatasetId() === null) {
      this.datasetService.create({
        name: raw.name,
        medicalDiagnosticId: raw.medicalDiagnosticId,
        medicalImageTypeId: raw.medicalImageTypeId,
      } as any).subscribe({
        next: (res) => {
          this.createdDatasetId.set(res.data?.id!);
          this.afterStep1(raw.medicalDiagnosticId);
        },
        error: (err) => {
          this.showToast(err?.error?.message ?? 'Error al crear el dataset', 'error');
          this.submittingStep1.set(false);
        },
      });
    } else {
      const id = this.createdDatasetId()!;
      this.datasetService.update(id, {
        medicalDiagnosticId: raw.medicalDiagnosticId,
        medicalImageTypeId: raw.medicalImageTypeId,
      } as any).subscribe({
        next: () => this.afterStep1(raw.medicalDiagnosticId),
        error: (err) => {
          this.showToast(err?.error?.message ?? 'Error al actualizar el dataset', 'error');
          this.submittingStep1.set(false);
        },
      });
    }
  }

  private afterStep1(diagnosticId: number): void {
    this.medicalDiagnosticService.findByParentId(diagnosticId).subscribe({
      next: (res) => {
        this.subDiagnostics.set(res.data ?? []);
        if (this.categories().length > 0) {
          this.categories.update(cats =>
            cats.map(c => ({
              ...c,
              filteredOptions: (res.data ?? []).filter(s => !c.associations.some(a => a.diagnostic.id === s.id)),
            }))
          );
        }
        this.submittingStep1.set(false);
        this.currentStep.set(2);
      },
      error: () => { this.showToast('Error al cargar sub-diagnósticos', 'error'); this.submittingStep1.set(false); },
    });
  }

  // ─── CATEGORÍAS — creación inmediata ─────────────────────────────────────────

  addCategory(): void {
    const numValue    = this.categories().length + 1;
    const datasetId   = this.createdDatasetId()!;

    this.categories.update(cats => [
      ...cats,
      {
        numValue,
        categoryId:   undefined,
        associations: [],
        searchValue:  '',
        showDropdown: false,
        filteredOptions: [...this.subDiagnostics()],
        saving: true,
      },
    ]);

    this.datasetCategoryService.create({ numValue, datasetId } as any).subscribe({
      next: (res) => {
        const categoryId = res.data?.id;
        this.categories.update(cats =>
          cats.map(c => c.numValue === numValue ? { ...c, categoryId, saving: false } : c)
        );
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Error al crear la categoría';
        this.showToast(msg, 'error');
        this.categories.update(cats => cats.filter(c => c.numValue !== numValue));
      },
    });
  }

  removeCategory(index: number): void {
    const cat = this.categories()[index];

    const removeFromSignal = () =>
      this.categories.update(cats =>
        cats.filter((_, i) => i !== index).map((c, i) => ({ ...c, numValue: i + 1 }))
      );

    if (!cat.categoryId) { removeFromSignal(); return; }

    this.datasetCategoryService.delete(cat.categoryId).subscribe({
      next:  () => removeFromSignal(),
      error: (err) => {
        const msg = err?.error?.message ?? 'Error al eliminar la categoría';
        this.showToast(msg, 'error');
      },
    });
  }

  // ─── SUB-DIAGNÓSTICOS — creación/eliminación inmediata ───────────────────────

  onCategorySearch(index: number, value: string): void {
    this.categories.update(cats =>
      cats.map((c, i) => {
        if (i !== index) return c;
        const q = value.toLowerCase().trim();
        return {
          ...c,
          searchValue:  value,
          showDropdown: true,
          filteredOptions: !q
            ? this.subDiagnostics().filter(s => !c.associations.some(a => a.diagnostic.id === s.id))
            : this.subDiagnostics().filter(s =>
                !c.associations.some(a => a.diagnostic.id === s.id) &&
                (s.diagnosticCode.toLowerCase().includes(q) || s.diagnosticName.toLowerCase().includes(q))
              ),
        };
      })
    );
  }

  openDropdown(index: number): void {
    this.categories.update(cats =>
      cats.map((c, i) => i !== index
        ? { ...c, showDropdown: false }
        : { ...c, showDropdown: true,
            filteredOptions: this.subDiagnostics().filter(s => !c.associations.some(a => a.diagnostic.id === s.id)) }
      )
    );
  }

  closeDropdown(index: number): void {
    setTimeout(() => {
      this.categories.update(cats =>
        cats.map((c, i) => i === index ? { ...c, showDropdown: false, searchValue: '' } : c)
      );
    }, 200);
  }

  addSubDiagnosticToCategory(catIndex: number, diag: MedicalDiagnostic): void {
    const cat = this.categories()[catIndex];

    if (!cat.categoryId) {
      this.showToast('La categoría aún se está guardando, intenta de nuevo', 'error');
      return;
    }

    this.diagnosticCategoryDatasetService.create({
      medicalDiagnosticId: diag.id,
      datasetCategoryId:   cat.categoryId,
    } as any).subscribe({
      next: (res) => {
        const assocId = res.data?.id!;
        this.categories.update(cats =>
          cats.map((c, i) => {
            if (i !== catIndex) return c;
            const associations = [...c.associations, { assocId, diagnostic: diag }];
            return {
              ...c,
              associations,
              searchValue:  '',
              showDropdown: false,
              filteredOptions: this.subDiagnostics().filter(s =>
                !associations.some(a => a.diagnostic.id === s.id)
              ),
            };
          })
        );
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Error al asociar el sub-diagnóstico';
        this.showToast(msg, 'error');
      },
    });
  }

  removeSubDiagnostic(catIndex: number, assocId: number): void {
    this.diagnosticCategoryDatasetService.delete(assocId).subscribe({
      next: () => {
        this.categories.update(cats =>
          cats.map((c, i) => {
            if (i !== catIndex) return c;
            const associations = c.associations.filter(a => a.assocId !== assocId);
            return {
              ...c,
              associations,
              filteredOptions: this.subDiagnostics().filter(s =>
                !associations.some(a => a.diagnostic.id === s.id)
              ),
            };
          })
        );
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Error al eliminar el sub-diagnóstico';
        this.showToast(msg, 'error');
      },
    });
  }

  // ─── STEP 2 → Siguiente ──────────────────────────────────────────────────────

  step2Next(): void {
    if (this.hasPendingSaves()) {
      this.showToast('Espera a que terminen de guardarse las categorías', 'error');
      return;
    }
    if (this.categories().length === 0) {
      this.showToast('Agrega al menos una categoría', 'error');
      return;
    }
    const invalid = this.categories().find(c => c.associations.length === 0);
    if (invalid) {
      this.showToast(`La categoría ${invalid.numValue} necesita al menos un sub-diagnóstico`, 'error');
      return;
    }
    this.currentStep.set(3);
  }

  // ─── STEP 3 ──────────────────────────────────────────────────────────────────

  getCategoryName(cat: CategoryRow): string {
    if (cat.associations.length === 0) return `Categoría ${cat.numValue}`;
    if (cat.associations.length === 1)  return cat.associations[0].diagnostic.diagnosticName;
    return cat.associations.map(a => a.diagnostic.diagnosticCode).join(', ');
  }

  getCategoryColor(index: number): string {
    return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  }

  step3Next(): void { this.currentStep.set(4); }

  // ─── NAVEGACIÓN ──────────────────────────────────────────────────────────────

  goBack(): void {
    const s = this.currentStep();
    if (s === 1) this.router.navigate(['/datasets']);
    else if (s === 2) this.currentStep.set(1);
    else if (s === 3) this.currentStep.set(2);
    else if (s === 4) this.currentStep.set(3);
  }

  finish(): void { this.router.navigate(['/datasets']); }
  cancel(): void { this.router.navigate(['/datasets']); }

  step1Valid(): boolean {
    return !!this.form.get('name')?.valid &&
           !!this.selectedDiagnostic() &&
           !!this.selectedImageType();
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3500);
  }
}
