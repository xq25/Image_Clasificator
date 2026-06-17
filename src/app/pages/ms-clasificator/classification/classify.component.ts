import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, switchMap, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { DatasetService } from '@app/services/ms-clasificator/dataset.service';
import { DatasetCategoryService } from '@app/services/ms-clasificator/dataset-category.service';
import { DiagnosticCategoryDatasetService } from '@app/services/ms-clasificator/diagnostic-category-dataset.service';
import { InternalServicesService } from '@app/services/ms-clasificator/internal-services.service';
import { DoctorService } from '@app/services/ms-clasificator/doctor.service';
import { MedicalImageTypeService } from '@app/services/ms-clasificator/medical-image-type.service';
import { SecurityService } from '@app/services/ms-security/security';
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
    private internalService:                  InternalServicesService,
    private doctorService:                    DoctorService,
    private medicalImageTypeService:          MedicalImageTypeService,
    private securityService:                  SecurityService,
  ) {}

  ngOnInit(): void {
    const imageTypeId = Number(this.route.snapshot.paramMap.get('imageTypeId'));
    if (!imageTypeId) { this.router.navigate(['/datasets']); return; }

    const userId = this.securityService.getCurrentSession()?.user?.id;
    if (!userId) { this.router.navigate(['/login']); return; }

    this.validateAndLoad(imageTypeId, userId);
  }

  private validateAndLoad(imageTypeId: number, userId: string): void {
    this.loading.set(true);

    // 1. Verificar que el usuario es doctor
    this.internalService.existRelationWithDoctor(userId).pipe(
      switchMap((isDoctor) => {
        if (!isDoctor) {
          this.showToast('Acceso restringido: no tiene perfil de médico.', 'error');
          setTimeout(() => this.router.navigate(['/datasets']), 2000);
          return of(null);
        }
        // 2. Doctor, tipo de imagen y dataset en paralelo
        return forkJoin({
          doctor:    this.doctorService.findByUserId(userId),
          imageType: this.medicalImageTypeService.findById(imageTypeId),
          dataset:   this.datasetService.findByMedicalImageTypeId(imageTypeId),
        });
      }),
      switchMap((result) => {
        if (!result) return of(null);

        const doctor    = result.doctor.data;
        const imageType = result.imageType.data;
        const dataset   = result.dataset.data;

        if (!doctor || !imageType) {
          this.showToast('No se pudo obtener la información necesaria.', 'error');
          setTimeout(() => this.router.navigate(['/datasets']), 2000);
          return of(null);
        }

        if (!dataset) {
          this.showToast(
            `La clasificación de "${imageType.name}" no está disponible: aún no se ha definido un dataset para este tipo de imagen.`,
            'error'
          );
          setTimeout(() => this.router.navigate(['/datasets']), 3500);
          return of(null);
        }

        this.dataset.set(dataset);

        const evaluationAreaId = imageType.evaluationArea?.id;
        if (!evaluationAreaId) {
          this.showToast(`El tipo de imagen "${imageType.name}" no tiene área de evaluación asignada.`, 'error');
          setTimeout(() => this.router.navigate(['/datasets']), 2000);
          return of(null);
        }

        // 3. Verificar que el doctor pertenece al área del tipo de imagen
        return this.internalService.existsDoctorInArea(doctor.id!, evaluationAreaId).pipe(
          switchMap((hasAccess) => {
            if (!hasAccess) {
              this.showToast('No tiene permisos para clasificar este tipo de imagen médica.', 'error');
              setTimeout(() => this.router.navigate(['/datasets']), 2000);
              return of(null);
            }
            return of(dataset.id!);
          })
        );
      })
    ).subscribe({
      next: (authorizedDatasetId) => {
        if (authorizedDatasetId !== null && authorizedDatasetId !== undefined) {
          this.loadCategories(authorizedDatasetId);
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.showToast('Error al validar el acceso.', 'error');
        this.loading.set(false);
      },
    });
  }

  private loadCategories(datasetId: number): void {
    this.datasetCategoryService.findByDatasetId(datasetId).subscribe({
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
