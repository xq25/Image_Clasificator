import {
  Component, OnInit, OnDestroy, signal, inject, computed,
  HostListener, ElementRef, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, switchMap, of, Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DatasetService } from '@app/services/ms-clasificator/dataset.service';
import { DatasetCategoryService } from '@app/services/ms-clasificator/dataset-category.service';
import { DiagnosticCategoryDatasetService } from '@app/services/ms-clasificator/diagnostic-category-dataset.service';
import { InternalServicesService } from '@app/services/ms-clasificator/internal-services.service';
import { DoctorService } from '@app/services/ms-clasificator/doctor.service';
import { MedicalImageTypeService } from '@app/services/ms-clasificator/medical-image-type.service';
import { MedicalImageService } from '@app/services/ms-clasificator/medical-image.service';
import { ImageDiagnosticService } from '@app/services/ms-clasificator/image-diagnostic.service';
import { ImageDoctorDiagnosticsService } from '@app/services/ms-clasificator/image-doctor-diagnostics.service';
import { SecurityService } from '@app/services/ms-security/security';
import { ImageDiagnostic } from '@app/models/ms-clasificator/ImageDiagnostic/ImageDiagnostic';
import { DatasetExtended } from '@app/models/ms-clasificator/Dataset/Dataset';
import { MedicalDiagnostic } from '@app/models/ms-clasificator/MedicalDiagnostic/MedicalDiagnostic';
import { MedicalImgExtended } from '@app/models/ms-clasificator/MedicalImage/MedicalImg';

interface Toast { message: string; type: 'success' | 'error'; }

export interface ClassifyCategory {
  categoryId: number;
  numValue:   number;
  name:       string;
  codes:      MedicalDiagnostic[];
}

const CATEGORY_COLORS = [
  '#22c55e', '#8b5cf6', '#eab308', '#6b7280',
  '#ec4899', '#3b82f6', '#f97316', '#06b6d4', '#ef4444', '#84cc16',
];

const TINDER_POSITIONS: { label: string; icon: string; key: string }[] = [
  { label: 'Arriba',    icon: 'arrow_upward',   key: '↑' },
  { label: 'Izquierda', icon: 'arrow_back',     key: '←' },
  { label: 'Derecha',   icon: 'arrow_forward',  key: '→' },
  { label: 'Abajo',     icon: 'arrow_downward', key: '↓' },
];

const DRAG_THRESHOLD = 80;

@Component({
  selector: 'app-classify',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './classify.component.html',
  styleUrl: './classify.component.scss',
})
export class ClassifyComponent implements OnInit, OnDestroy {

  @ViewChild('imageCard') imageCardRef!: ElementRef<HTMLDivElement>;

  private route    = inject(ActivatedRoute);
  private router   = inject(Router);
  private toastTimer: any;
  private routeSub!: Subscription;
  private doctorId = 0;

  // ─── DRAG STATE ──────────────────────────────────────────────────────────────
  private dragActive  = false;
  private dragStart   = { x: 0, y: 0 };
  dragOffset          = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  dragDirection       = signal<number | null>(null); // index of highlighted slot

  // ─── STATE ───────────────────────────────────────────────────────────────────
  loading          = signal(true);   // carga inicial de datos
  classifying      = signal(false);  // petición de clasificación en vuelo
  dataset          = signal<DatasetExtended | null>(null);
  categories       = signal<ClassifyCategory[]>([]);
  images           = signal<MedicalImgExtended[]>([]);
  currentIndex     = signal(0);
  classifiedCount  = signal(0);
  showKeyboardHint = signal(false);
  toast            = signal<Toast | null>(null);

  // ─── COMPUTED ────────────────────────────────────────────────────────────────
  readonly tinderMode = computed(() => this.categories().length <= 4);

  readonly tinderSlots = computed(() =>
    this.categories().map((cat, i) => ({
      cat,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      label: TINDER_POSITIONS[i]?.label ?? `Cat. ${cat.numValue}`,
      icon:  TINDER_POSITIONS[i]?.icon  ?? 'category',
      key:   TINDER_POSITIONS[i]?.key   ?? String(i + 1),
      num:   i + 1,
    }))
  );

  readonly buttonSlots = computed(() =>
    this.categories().map((cat, i) => ({
      cat,
      color:       CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      displayName: this.getCategoryName(cat),
      codeCount:   cat.codes.length,
      num:         i + 1,
    }))
  );

  readonly totalCodes = computed(() =>
    this.categories().reduce((sum, c) => sum + c.codes.length, 0)
  );

  readonly totalImages = computed(() => this.images().length);

  readonly currentImage = computed(() =>
    this.images()[this.currentIndex()] ?? null
  );

  readonly progressPct = computed(() => {
    const total = this.totalImages();
    return total > 0 ? Math.round((this.classifiedCount() / total) * 100) : 0;
  });

  readonly dragTransform = computed(() => {
    const { x, y } = this.dragOffset();
    const rot = x * 0.04;
    return `translate(${x}px, ${y}px) rotate(${rot}deg)`;
  });

  readonly dragTargetSlot = computed(() => {
    const dir = this.dragDirection();
    if (dir === null) return null;
    return this.tinderSlots()[dir] ?? null;
  });

  // Aparece a partir de 15px y alcanza opacidad total a la mitad del umbral
  readonly dragProgress = computed(() => {
    const { x, y } = this.dragOffset();
    const dist = Math.max(Math.abs(x), Math.abs(y));
    return Math.min(1, Math.max(0, (dist - 15) / (DRAG_THRESHOLD * 0.5)));
  });

  constructor(
    private datasetService:                   DatasetService,
    private datasetCategoryService:           DatasetCategoryService,
    private diagnosticCategoryDatasetService: DiagnosticCategoryDatasetService,
    private internalService:                  InternalServicesService,
    private doctorService:                    DoctorService,
    private medicalImageTypeService:          MedicalImageTypeService,
    private medicalImageService:              MedicalImageService,
    private imageDiagnosticService:           ImageDiagnosticService,
    private imageDoctorDiagnosticsService:    ImageDoctorDiagnosticsService,
    private securityService:                  SecurityService,
  ) {}

  ngOnInit(): void {
    const userId = this.securityService.getCurrentSession()?.user?.id;
    if (!userId) { this.router.navigate(['/login']); return; }

    this.routeSub = this.route.paramMap.subscribe(params => {
      const imageTypeId = Number(params.get('imageTypeId'));
      if (!imageTypeId) { this.router.navigate(['/datasets']); return; }

      this.dataset.set(null);
      this.categories.set([]);
      this.images.set([]);
      this.currentIndex.set(0);
      this.classifiedCount.set(0);
      this.validateAndLoad(imageTypeId, userId);
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    clearTimeout(this.toastTimer);
  }

  // ─── KEYBOARD ────────────────────────────────────────────────────────────────
  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (this.loading() || this.classifying() || !this.tinderMode()) return;
    const slots = this.tinderSlots();
    switch (e.key) {
      case 'ArrowUp':    e.preventDefault(); this.classifyBySlot(0); break;
      case 'ArrowLeft':  e.preventDefault(); this.classifyBySlot(1); break;
      case 'ArrowRight': e.preventDefault(); this.classifyBySlot(2); break;
      case 'ArrowDown':  e.preventDefault(); this.classifyBySlot(3); break;
      case 'd': case 'D': this.discard(); break;
      case 'Escape': this.showKeyboardHint.set(false); break;
    }
  }

  // ─── DRAG ────────────────────────────────────────────────────────────────────
  onPointerDown(e: PointerEvent): void {
    if (!this.currentImage()) return;
    this.dragActive = true;
    this.dragStart = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.dragActive) return;
    const dx = e.clientX - this.dragStart.x;
    const dy = e.clientY - this.dragStart.y;
    this.dragOffset.set({ x: dx, y: dy });

    // Highlight the target slot while dragging
    const adx = Math.abs(dx), ady = Math.abs(dy);
    if (adx < 20 && ady < 20) { this.dragDirection.set(null); return; }
    if (adx > ady) this.dragDirection.set(dx > 0 ? 2 : 1);
    else           this.dragDirection.set(dy > 0 ? 3 : 0);
  }

  onPointerUp(e: PointerEvent): void {
    if (!this.dragActive) return;
    this.dragActive = false;
    const { x, y } = this.dragOffset();
    const ax = Math.abs(x), ay = Math.abs(y);

    if (Math.max(ax, ay) >= DRAG_THRESHOLD) {
      let slotIndex: number;
      if (ax > ay) slotIndex = x > 0 ? 2 : 1;
      else         slotIndex = y > 0 ? 3 : 0;
      this.classifyBySlot(slotIndex);
    }

    this.dragOffset.set({ x: 0, y: 0 });
    this.dragDirection.set(null);
  }

  // ─── ACTIONS ─────────────────────────────────────────────────────────────────
  classifyBySlot(slotIndex: number): void {
    if (this.classifying()) return;

    const slots = this.tinderMode() ? this.tinderSlots() : this.buttonSlots();
    if (slotIndex >= slots.length) return;

    const image = this.currentImage();
    if (!image?.id) return;

    const cat = slots[slotIndex].cat;
    if (cat.codes.length === 0) return;

    this.classifying.set(true);

    const diagPayload: Partial<ImageDiagnostic> = {
      doctorId:     this.doctorId,
      medicalImgId: image.id,
      diagnosticDate: new Date().toISOString(),
    };

    this.imageDiagnosticService.create(diagPayload).pipe(
      switchMap(res => {
        if (!res.success || !res.data?.id) {
          this.showToast('Error al registrar el diagnóstico.', 'error');
          return of(null);
        }
        const imageDiagnosticId = res.data.id;
        return forkJoin(
          cat.codes.map(code =>
            this.imageDoctorDiagnosticsService.create({
              imageDiagnosticId,
              medicalDiagnosticId: code.id,
            } as any)
          )
        );
      })
    ).subscribe({
      next: (results) => {
        this.classifying.set(false);
        if (results !== null) {
          this.showToast('Clasificación guardada correctamente.', 'success');
          this.advanceImage();
        }
      },
      error: () => {
        this.classifying.set(false);
        this.showToast('Error al guardar la clasificación.', 'error');
      },
    });
  }

  discard(): void {
    this.advanceImage();
  }

  markUnsure(): void {
    this.advanceImage();
  }

  private advanceImage(): void {
    this.classifiedCount.update(c => c + 1);
    this.currentIndex.update(i => i + 1);
  }

  // ─── DATA LOADING ────────────────────────────────────────────────────────────
  private validateAndLoad(imageTypeId: number, userId: string): void {
    this.loading.set(true);

    this.internalService.existRelationWithDoctor(userId).pipe(
      switchMap((isDoctor) => {
        if (!isDoctor) {
          this.showToast('Acceso restringido: no tiene perfil de médico.', 'error');
          setTimeout(() => this.router.navigate(['/datasets']), 2000);
          return of(null);
        }
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
            `La clasificación de "${imageType.name}" no está disponible: aún no se ha definido un dataset.`,
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

        return this.internalService.existsDoctorInArea(doctor.id!, evaluationAreaId).pipe(
          switchMap((hasAccess) => {
            if (!hasAccess) {
              this.showToast('No tiene permisos para clasificar este tipo de imagen médica.', 'error');
              setTimeout(() => this.router.navigate(['/datasets']), 2000);
              return of(null);
            }
            return of({ datasetId: dataset.id!, imageTypeId, doctorId: doctor.id! });
          })
        );
      })
    ).subscribe({
      next: (result) => {
        if (result) {
          this.doctorId = result.doctorId;
          this.loadAll(result.datasetId, result.imageTypeId, result.doctorId);
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

  private loadAll(datasetId: number, imageTypeId: number, doctorId: number): void {
    forkJoin({
      categories: this.datasetCategoryService.findByDatasetId(datasetId),
      images:     this.medicalImageService.findUndiagnosedByDoctorAndMedicalImageType(doctorId, imageTypeId),
    }).subscribe({
      next: ({ categories, images }) => {
        const cats = categories.data ?? [];
        this.images.set(images.data ?? []);

        if (cats.length === 0) { this.loading.set(false); return; }

        forkJoin(
          cats.map(c => this.diagnosticCategoryDatasetService.findByDatasetCategoryId(c.id!))
        ).subscribe({
          next: (assocResults) => {
            const built: ClassifyCategory[] = cats.map((c, i) => ({
              categoryId: c.id!,
              numValue:   c.numValue,
              name:       c.name ?? '',
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
        this.showToast('Error al cargar los datos', 'error');
        this.loading.set(false);
      },
    });
  }

  getCategoryName(cat: ClassifyCategory): string {
    if (cat.name.trim()) return cat.name.trim();
    if (cat.codes.length === 0) return `Categoría ${cat.numValue}`;
    if (cat.codes.length === 1) return cat.codes[0].diagnosticName;
    return cat.codes.map(c => c.diagnosticCode).join(', ');
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3500);
  }
}
