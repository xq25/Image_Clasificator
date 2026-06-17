import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { DatasetService } from '@app/services/ms-clasificator/dataset.service';
import { DatasetCategoryService } from '@app/services/ms-clasificator/dataset-category.service';
import { DiagnosticCategoryDatasetService } from '@app/services/ms-clasificator/diagnostic-category-dataset.service';
import { DatasetExtended } from '@app/models/ms-clasificator/Dataset/Dataset';
import { MedicalDiagnostic } from '@app/models/ms-clasificator/MedicalDiagnostic/MedicalDiagnostic';

interface Toast { message: string; type: 'success' | 'error'; }

export interface ClassifyCategory {
  categoryId: number;
  numValue:   number;
  codes:      MedicalDiagnostic[];
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
  selector: 'app-classify',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './classify.component.html',
  styleUrl: './classify.component.scss',
})
export class ClassifyComponent implements OnInit {

  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private toastTimer: any;

  // ─── STATE ───────────────────────────────────────────────────────────────────
  loading    = signal(true);
  dataset    = signal<DatasetExtended | null>(null);
  categories = signal<ClassifyCategory[]>([]);
  toast      = signal<Toast | null>(null);

  // ─── COMPUTED ────────────────────────────────────────────────────────────────
  readonly tinderMode = computed(() => this.categories().length <= 4);

  readonly tinderSlots = computed(() =>
    this.categories().map((cat, i) => ({
      cat,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      label: TINDER_POSITIONS[i]?.label ?? `Categoría ${cat.numValue}`,
      icon:  TINDER_POSITIONS[i]?.icon  ?? 'category',
    }))
  );

  readonly buttonSlots = computed(() =>
    this.categories().map((cat, i) => ({
      cat,
      color:       CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      displayName: this.getCategoryName(cat),
      codeCount:   cat.codes.length,
    }))
  );

  readonly totalCodes = computed(() =>
    this.categories().reduce((sum, c) => sum + c.codes.length, 0)
  );

  constructor(
    private datasetService:                   DatasetService,
    private datasetCategoryService:           DatasetCategoryService,
    private diagnosticCategoryDatasetService: DiagnosticCategoryDatasetService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('datasetId'));
    if (!id) { this.router.navigate(['/datasets']); return; }
    this.loadDataset(id);
  }

  private loadDataset(id: number): void {
    this.loading.set(true);

    this.datasetService.findById(id).subscribe({
      next: (res) => {
        const ds = res.data;
        if (!ds) { this.router.navigate(['/datasets']); return; }
        this.dataset.set(ds);

        this.datasetCategoryService.findByDatasetId(id).subscribe({
          next: (catRes) => {
            const cats = catRes.data ?? [];
            if (cats.length === 0) { this.loading.set(false); return; }

            forkJoin(
              cats.map(c =>
                this.diagnosticCategoryDatasetService.findByDatasetCategoryId(c.id!)
              )
            ).subscribe({
              next: (assocResults) => {
                const built: ClassifyCategory[] = cats.map((c, i) => ({
                  categoryId: c.id!,
                  numValue:   c.numValue,
                  codes:      (assocResults[i].data ?? []).map(a => a.medicalDiagnostic),
                }));
                this.categories.set(built);
                this.loading.set(false);
              },
              error: () => {
                this.showToast('Error al cargar los sub-diagnósticos', 'error');
                this.loading.set(false);
              },
            });
          },
          error: () => {
            this.showToast('Error al cargar las categorías', 'error');
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.showToast('Error al cargar el dataset', 'error');
        this.loading.set(false);
      },
    });
  }

  getCategoryName(cat: ClassifyCategory): string {
    if (cat.codes.length === 0) return `Categoría ${cat.numValue}`;
    if (cat.codes.length === 1) return cat.codes[0].diagnosticName;
    return cat.codes.map(c => c.diagnosticCode).join(', ');
  }

  getCategoryColor(index: number): string {
    return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  }

  goBack(): void { this.router.navigate(['/datasets']); }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3500);
  }
}
