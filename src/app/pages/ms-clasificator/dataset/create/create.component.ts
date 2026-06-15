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
import { forkJoin, from, concatMap } from 'rxjs';

import { DatasetService } from '@app/services/ms-clasificator/dataset.service';
import { DatasetCategoryService } from '@app/services/ms-clasificator/dataset-category.service';
import { DiagnosticCategoryDatasetService } from '@app/services/ms-clasificator/diagnostic-category-dataset.service';
import { MedicalDiagnosticService } from '@app/services/ms-clasificator/medical-diagnostic.service';
import { EvaluationAreaService } from '@app/services/ms-clasificator/evaluation-area.service';

import { MedicalDiagnostic, MedicalDiagnosticExtended } from '@app/models/ms-clasificator/MedicalDiagnostic/MedicalDiagnostic';
import { EvaluationArea } from '@app/models/ms-clasificator';

interface Toast { message: string; type: 'success' | 'error'; }

export interface CategoryRow {
  numValue: number;
  selectedDiagnostics: MedicalDiagnostic[];
  searchValue: string;
  showDropdown: boolean;
  filteredOptions: MedicalDiagnostic[];
}

// Colores predefinidos para las categorías
const CATEGORY_COLORS = [
  '#22c55e', '#eab308', '#8b5cf6', '#3b82f6',
  '#ec4899', '#9ca3af', '#f97316', '#06b6d4', '#ef4444', '#84cc16',
];

// Posiciones tinder para ≤ 4 categorías
const TINDER_POSITIONS: { label: string; icon: string; pos: 'top' | 'left' | 'right' | 'bottom' }[] = [
  { label: 'Arriba',    icon: 'arrow_upward',    pos: 'top'    },
  { label: 'Izquierda', icon: 'arrow_back',      pos: 'left'   },
  { label: 'Derecha',   icon: 'arrow_forward',   pos: 'right'  },
  { label: 'Abajo',     icon: 'arrow_downward',  pos: 'bottom' },
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
  createdDatasetId  = signal<number | null>(null);
  categoriesSaved   = signal(false);

  // ─── CATÁLOGOS ───────────────────────────────────────────────────────────────
  diagnostics     = signal<MedicalDiagnosticExtended[]>([]);
  evaluationAreas = signal<EvaluationArea[]>([]);
  subDiagnostics  = signal<MedicalDiagnostic[]>([]);
  loadingCatalogs = signal(true);

  // ─── ICD-10 SEARCH ───────────────────────────────────────────────────────────
  diagnosticSearch    = signal('');
  filteredDiagnostics = signal<MedicalDiagnosticExtended[]>([]);

  // ─── FORMULARIO ──────────────────────────────────────────────────────────────
  form!: FormGroup;
  selectedDiagnostic = signal<MedicalDiagnosticExtended | null>(null);
  selectedArea       = signal<EvaluationArea | null>(null);

  // ─── CATEGORÍAS ──────────────────────────────────────────────────────────────
  categories = signal<CategoryRow[]>([]);

  // ─── FLAGS ───────────────────────────────────────────────────────────────────
  submittingStep1 = signal(false);
  submittingStep2 = signal(false);
  toast           = signal<Toast | null>(null);

  // ─── COMPUTED (step 3) ───────────────────────────────────────────────────────
  readonly tinderMode = computed(() => this.categories().length <= 4);

  readonly tinderSlots = computed(() =>
    this.categories().map((cat, i) => ({
      cat,
      color:    CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      label:    TINDER_POSITIONS[i]?.label ?? `Categoría ${cat.numValue}`,
      icon:     TINDER_POSITIONS[i]?.icon  ?? 'category',
      pos:      TINDER_POSITIONS[i]?.pos   ?? 'bottom',
      isLast:   i === this.categories().length - 1,
    }))
  );

  readonly buttonSlots = computed(() =>
    this.categories().map((cat, i) => ({
      cat,
      color:       CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      displayName: this.getCategoryName(cat),
      codeCount:   cat.selectedDiagnostics.length,
    }))
  );

  readonly totalCodes = computed(() =>
    this.categories().reduce((sum, c) => sum + c.selectedDiagnostics.length, 0)
  );

  constructor(
    private datasetService:                   DatasetService,
    private datasetCategoryService:           DatasetCategoryService,
    private diagnosticCategoryDatasetService: DiagnosticCategoryDatasetService,
    private medicalDiagnosticService:         MedicalDiagnosticService,
    private evaluationAreaService:            EvaluationAreaService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name:                ['', [Validators.required, Validators.minLength(3)]],
      medicalDiagnosticId: [null, Validators.required],
      evaluationAreaId:    [null],
    });

    forkJoin([
      this.medicalDiagnosticService.findAll(),
      this.evaluationAreaService.findAll(),
    ]).subscribe({
      next: ([diagRes, areaRes]) => {
        this.diagnostics.set(diagRes ?? []);
        this.evaluationAreas.set(areaRes.data ?? []);
        this.filteredDiagnostics.set(diagRes ?? []);
        this.loadingCatalogs.set(false);
      },
      error: () => {
        this.showToast('Error al cargar catálogos', 'error');
        this.loadingCatalogs.set(false);
      },
    });
  }

  // ─── ICD-10 ──────────────────────────────────────────────────────────────────

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

  selectArea(area: EvaluationArea): void {
    if (this.selectedArea()?.id === area.id) {
      this.selectedArea.set(null);
      this.form.patchValue({ evaluationAreaId: null });
    } else {
      this.selectedArea.set(area);
      this.form.patchValue({ evaluationAreaId: area.id });
    }
  }

  // ─── STEP 1 → Siguiente ──────────────────────────────────────────────────────

  step1Next(): void {
    this.form.get('name')?.markAsTouched();
    this.form.get('medicalDiagnosticId')?.markAsTouched();
    if (!this.step1Valid()) return;

    this.submittingStep1.set(true);
    const raw = this.form.getRawValue();

    if (this.createdDatasetId() === null) {
      this.datasetService.create({ name: raw.name, medicalDiagnosticId: raw.medicalDiagnosticId } as any)
        .subscribe({
          next: (res) => {
            const id = res.data?.id!;
            this.createdDatasetId.set(id);
            if (raw.evaluationAreaId) {
              this.datasetService.assignEvaluationArea(id, raw.evaluationAreaId).subscribe({
                next:  () => this.afterStep1(id, raw.medicalDiagnosticId),
                error: () => this.afterStep1(id, raw.medicalDiagnosticId),
              });
            } else {
              this.afterStep1(id, raw.medicalDiagnosticId);
            }
          },
          error: () => { this.showToast('Error al crear el dataset', 'error'); this.submittingStep1.set(false); },
        });
    } else {
      const id = this.createdDatasetId()!;
      this.datasetService.changeDiagnostic(id, { medicalDiagnosticId: raw.medicalDiagnosticId } as any).subscribe({
        next: () => {
          if (raw.evaluationAreaId) {
            this.datasetService.assignEvaluationArea(id, raw.evaluationAreaId).subscribe({
              next:  () => this.afterStep1(id, raw.medicalDiagnosticId),
              error: () => this.afterStep1(id, raw.medicalDiagnosticId),
            });
          } else {
            this.afterStep1(id, raw.medicalDiagnosticId);
          }
        },
        error: () => { this.showToast('Error al actualizar el dataset', 'error'); this.submittingStep1.set(false); },
      });
    }
  }

  private afterStep1(datasetId: number, diagnosticId: number): void {
    this.medicalDiagnosticService.findByParentId(diagnosticId).subscribe({
      next: (res) => {
        this.subDiagnostics.set(res.data ?? []);
        if (this.categories().length === 0) this.addCategory();
        else {
          this.categories.update(cats =>
            cats.map(c => ({
              ...c,
              selectedDiagnostics: c.selectedDiagnostics.filter(sd =>
                (res.data ?? []).some(s => s.id === sd.id)
              ),
              filteredOptions: res.data ?? [],
            }))
          );
        }
        this.submittingStep1.set(false);
        this.currentStep.set(2);
      },
      error: () => { this.showToast('Error al cargar sub-diagnósticos', 'error'); this.submittingStep1.set(false); },
    });
  }

  // ─── CATEGORÍAS ──────────────────────────────────────────────────────────────

  addCategory(): void {
    const next = this.categories().length + 1;
    this.categories.update(cats => [
      ...cats,
      { numValue: next, selectedDiagnostics: [], searchValue: '', showDropdown: false, filteredOptions: [...this.subDiagnostics()] },
    ]);
  }

  removeCategory(index: number): void {
    this.categories.update(cats =>
      cats.filter((_, i) => i !== index).map((c, i) => ({ ...c, numValue: i + 1 }))
    );
  }

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
            ? this.subDiagnostics().filter(s => !c.selectedDiagnostics.some(sd => sd.id === s.id))
            : this.subDiagnostics().filter(s =>
                !c.selectedDiagnostics.some(sd => sd.id === s.id) &&
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
        : { ...c, showDropdown: true, filteredOptions: this.subDiagnostics().filter(s => !c.selectedDiagnostics.some(sd => sd.id === s.id)) }
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
    this.categories.update(cats =>
      cats.map((c, i) => {
        if (i !== catIndex) return c;
        const updated = [...c.selectedDiagnostics, diag];
        return { ...c, selectedDiagnostics: updated, searchValue: '', showDropdown: false,
          filteredOptions: this.subDiagnostics().filter(s => !updated.some(sd => sd.id === s.id)) };
      })
    );
  }

  removeSubDiagnostic(catIndex: number, diagId: number): void {
    this.categories.update(cats =>
      cats.map((c, i) => i !== catIndex ? c :
        { ...c, selectedDiagnostics: c.selectedDiagnostics.filter(sd => sd.id !== diagId) }
      )
    );
  }

  // ─── STEP 2 → Siguiente ──────────────────────────────────────────────────────

  step2Next(): void {
    // Si ya están guardadas, sólo avanzar de step
    if (this.categoriesSaved()) { this.currentStep.set(3); return; }

    const cats = this.categories();
    if (cats.length === 0) { this.showToast('Agrega al menos una categoría', 'error'); return; }
    if (cats.some(c => c.selectedDiagnostics.length === 0)) {
      this.showToast('Cada categoría debe tener al menos un sub-diagnóstico', 'error'); return;
    }

    this.submittingStep2.set(true);
    const datasetId = this.createdDatasetId()!;

    from(cats).pipe(
      concatMap(cat => this.datasetCategoryService.create({ numValue: cat.numValue, datasetId } as any))
    ).subscribe({
      next:  () => {},
      error: () => { this.showToast('Error al guardar las categorías', 'error'); this.submittingStep2.set(false); },
      complete: () => {
        this.datasetCategoryService.findByDatasetId(datasetId).subscribe({
          next: (res) => {
            const createdCats = res.data ?? [];
            const associations: { categoryId: number; diagId: number }[] = [];

            cats.forEach(cat => {
              const created = createdCats.find(c => c.numValue === cat.numValue);
              if (!created?.id) return;
              cat.selectedDiagnostics.forEach(d => associations.push({ categoryId: created.id!, diagId: d.id! }));
            });

            from(associations).pipe(
              concatMap(a => this.diagnosticCategoryDatasetService.create(
                { medicalDiagnosticId: a.diagId, datasetCategoryId: a.categoryId } as any
              ))
            ).subscribe({
              next:     () => {},
              error:    () => { this.showToast('Error al asociar sub-diagnósticos', 'error'); this.submittingStep2.set(false); },
              complete: () => {
                this.categoriesSaved.set(true);
                this.submittingStep2.set(false);
                this.currentStep.set(3);
              },
            });
          },
          error: () => { this.showToast('Error al verificar categorías', 'error'); this.submittingStep2.set(false); },
        });
      },
    });
  }

  // ─── STEP 3 (preview) ────────────────────────────────────────────────────────

  getCategoryName(cat: CategoryRow): string {
    if (cat.selectedDiagnostics.length === 0) return `Categoría ${cat.numValue}`;
    if (cat.selectedDiagnostics.length === 1) return cat.selectedDiagnostics[0].diagnosticName;
    return cat.selectedDiagnostics.map(d => d.diagnosticCode).join(', ');
  }

  getCategoryColor(index: number): string {
    return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  }

  // ─── NAVEGACIÓN ──────────────────────────────────────────────────────────────

  goBack(): void {
    const s = this.currentStep();
    if (s === 1) this.router.navigate(['/datasets']);
    else if (s === 2) this.currentStep.set(1);
    else if (s === 3) this.currentStep.set(2);
    else if (s === 4) this.currentStep.set(3);
  }

  step3Next(): void { this.currentStep.set(4); }

  finish(): void { this.router.navigate(['/datasets']); }

  cancel(): void { this.router.navigate(['/datasets']); }

  step1Valid(): boolean {
    return !!this.form.get('name')?.valid && !!this.selectedDiagnostic();
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3500);
  }
}
