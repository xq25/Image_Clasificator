import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ApiResponse, Doctor, DoctorArea, EvaluationArea, ImageDiagnostic, MedicalDiagnostic, MedicalImg, UIConfig, UIState } from '@app/models/ms-clasificator';
import { DoctorAreaService } from '@app/services/ms-clasificator/doctor-area.service';
import { DoctorService } from '@app/services/ms-clasificator/doctor.service';
import { EvaluationAreaService } from '@app/services/ms-clasificator/evaluation-area.service';
import { ImageDiagnosticService } from '@app/services/ms-clasificator/image-diagnostic.service';
import { MedicalDiagnosticService } from '@app/services/ms-clasificator/medical-diagnostic.service';
import { MedicalImageService } from '@app/services/ms-clasificator/medical-image.service';
import { UIConfigService } from '@app/services/ms-clasificator/ui-config.service';
import { UIStateService } from '@app/services/ms-clasificator/ui-state.service';

type StateLayout = 'left' | 'up' | 'right';

type DoctorOption = Doctor & {
  accessLabel: string;
};

@Component({
  selector: 'app-image-clasificator',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatDividerModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './image-clasificator.component.html',
  styleUrl: './image-clasificator.component.scss'
})
export class ImageClasificatorComponent {
  loading = true;
  saving = false;
  accessDenied = false;

  evaluationAreaId!: number;
  doctorId!: number;

  evaluationArea: EvaluationArea | null = null;
  currentDoctor: Doctor | null = null;
  uiConfig: UIConfig | null = null;

  doctorsWithAccess: DoctorOption[] = [];
  uiStates: UIState[] = [];
  medicalDiagnostics: MedicalDiagnostic[] = [];
  pendingImages: MedicalImg[] = [];
  classifiedImageIds: number[] = [];

  currentImageIndex = 0;
  currentImageMessage = 'Cargando imágenes pendientes...';
  statusMessage = '';
  statusType: 'success' | 'warning' | 'error' | '' = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private uiConfigService: UIConfigService,
    private uiStateService: UIStateService,
    private doctorAreaService: DoctorAreaService,
    private doctorService: DoctorService,
    private medicalImageService: MedicalImageService,
    private imageDiagnosticService: ImageDiagnosticService,
    private evaluationAreaService: EvaluationAreaService,
    private medicalDiagnosticService: MedicalDiagnosticService,
  ) {}

  ngOnInit(): void {
    const evaluationAreaIdParam = Number(this.route.snapshot.paramMap.get('evaluationAreaId'));
    const doctorIdParam = Number(this.route.snapshot.paramMap.get('doctorId'));

    if (!Number.isFinite(evaluationAreaIdParam) || !Number.isFinite(doctorIdParam)) {
      this.setStatus('Parámetros inválidos para la clasificación de imágenes.', 'error');
      this.loading = false;
      return;
    }

    this.evaluationAreaId = evaluationAreaIdParam;
    this.doctorId = doctorIdParam;
    this.loadContext();
  }

  get hasImages(): boolean {
    return this.pendingImages.length > 0;
  }

  get currentImage(): MedicalImg | null {
    return this.pendingImages[this.currentImageIndex] ?? null;
  }

  get canClassify(): boolean {
    return !this.loading && !this.saving && !this.accessDenied && !!this.currentImage?.id;
  }

  get uiStateLayout(): StateLayout[] {
    return ['left', 'up', 'right'];
  }

  get stateButtons(): Array<UIState & { label: string; layout: StateLayout; diagnostic?: MedicalDiagnostic | null }> {
    return this.uiStates.map((state, index) => ({
      ...state,
      label: this.getDiagnosticLabel(state.medicalDiagnosticId),
      layout: this.uiStateLayout[index % this.uiStateLayout.length],
      diagnostic: this.medicalDiagnostics.find((diagnostic) => diagnostic.id === state.medicalDiagnosticId) ?? null,
    }));
  }

  get leftState(): (UIState & { label: string; layout: StateLayout; diagnostic?: MedicalDiagnostic | null }) | null {
    return this.stateButtons[0] ?? null;
  }

  get upState(): (UIState & { label: string; layout: StateLayout; diagnostic?: MedicalDiagnostic | null }) | null {
    return this.stateButtons[1] ?? null;
  }

  get rightState(): (UIState & { label: string; layout: StateLayout; diagnostic?: MedicalDiagnostic | null }) | null {
    return this.stateButtons[2] ?? null;
  }

  private loadContext(): void {
    this.loading = true;

    forkJoin({
      area: this.evaluationAreaService.findById(this.evaluationAreaId),
      currentDoctor: this.doctorService.findById(this.doctorId),
      doctors: this.doctorService.findAll(),
      doctorAreas: this.doctorAreaService.findByEvaluationAreaId(this.evaluationAreaId),
      medicalDiagnostics: this.medicalDiagnosticService.findAll(),
      medicalImages: this.medicalImageService.findByEvaluationAreaId(this.evaluationAreaId),
      imageDiagnostics: this.imageDiagnosticService.findAll(),
      uiConfig: this.uiConfigService.findByEvaluationAreaId(this.evaluationAreaId),
    }).subscribe({
      next: (response) => {
        this.evaluationArea = this.unwrapData(response.area, null);
        this.currentDoctor = this.unwrapData(response.currentDoctor, null);
        this.medicalDiagnostics = response.medicalDiagnostics ?? [];

        const uiConfig = this.unwrapData(response.uiConfig, null);
        this.uiConfig = uiConfig;

        if (!this.evaluationArea || !this.currentDoctor || !uiConfig) {
          this.loading = false;
          this.setStatus('No se pudo cargar el contexto de clasificación.', 'error');
          return;
        }

        const doctors = response.doctors ?? [];
        const doctorAreas = this.unwrapData(response.doctorAreas, []) ?? [];
        const areaDoctorIds = new Set(
          (doctorAreas as DoctorArea[])
            .map((item) => item.doctor?.id)
            .filter((doctorId): doctorId is number => doctorId != null)
        );
        this.doctorsWithAccess = doctors
          .filter((doctor) => doctor.id != null && areaDoctorIds.has(doctor.id))
          .map((doctor) => ({
            ...doctor,
            accessLabel: this.getDoctorLabel(doctor),
          }));

        this.uiStateService.findByUiConfigId(uiConfig.id ?? 0).subscribe({
          next: (statesResponse) => {
            this.uiStates = this.unwrapData(statesResponse, []) ?? [];
            this.loadImages(this.unwrapData(response.medicalImages, []) ?? [], response.imageDiagnostics ?? []);
          },
          error: (error) => {
            console.error('Error al cargar UIStates:', error);
            this.uiStates = [];
            this.loadImages(this.unwrapData(response.medicalImages, []) ?? [], response.imageDiagnostics ?? []);
          }
        });
      },
      error: (error) => {
        console.error('Error al cargar contexto de clasificación:', error);
        this.loading = false;
        this.setStatus('No se pudo preparar la pantalla de clasificación.', 'error');
      }
    });
  }

  private loadImages(images: MedicalImg[], imageDiagnostics: ImageDiagnostic[]): void {
    const pendingImageIds = new Set(
      imageDiagnostics
        .filter((diagnostic) => diagnostic.doctorId === this.doctorId)
        .map((diagnostic) => diagnostic.medicalImgId)
    );

    this.pendingImages = (images ?? []).filter((image) => image.id != null && !pendingImageIds.has(image.id));
    this.classifiedImageIds = (images ?? [])
      .filter((image) => image.id != null && pendingImageIds.has(image.id))
      .map((image) => image.id as number);

    this.currentImageIndex = 0;
    this.currentImageMessage = this.hasImages
      ? 'Imagen lista para clasificar.'
      : 'No hay imágenes pendientes para este doctor en esta área.';
    this.loading = false;
    this.accessDenied = !this.hasDoctorAccess();

    if (this.accessDenied) {
      this.setStatus('Este doctor no tiene acceso a la área de evaluación seleccionada.', 'warning');
    }
  }

  classify(uiState: UIState): void {
    const image = this.currentImage;

    if (!this.canClassify || !image?.id || uiState.medicalDiagnosticId == null) {
      return;
    }

    this.saving = true;
    this.imageDiagnosticService.create({
      doctorId: this.doctorId,
      medicalImgId: image.id,
      medicalDiagnosticId: uiState.medicalDiagnosticId,
      diagnosticDate: new Date().toISOString(),
    }).subscribe({
      next: () => {
        this.saving = false;
        this.classifiedImageIds = [...this.classifiedImageIds, image.id as number];
        this.pendingImages = this.pendingImages.filter((pendingImage) => pendingImage.id !== image.id);

        if (this.currentImageIndex >= this.pendingImages.length) {
          this.currentImageIndex = Math.max(this.pendingImages.length - 1, 0);
        }

        this.currentImageMessage = this.hasImages
          ? 'Siguiente imagen lista para diagnóstico.'
          : 'No quedan imágenes pendientes para este doctor.';
        this.setStatus(`Imagen clasificada como ${this.getDiagnosticLabel(uiState.medicalDiagnosticId)}.`, 'success');
      },
      error: (error) => {
        console.error('Error al clasificar la imagen:', error);
        this.saving = false;
        this.setStatus('No se pudo guardar la clasificación.', 'error');
      }
    });
  }

  skipImage(): void {
    if (!this.hasImages) {
      return;
    }

    this.currentImageIndex = (this.currentImageIndex + 1) % this.pendingImages.length;
    this.setStatus('Imagen omitida temporalmente.', 'warning');
  }

  previousImage(): void {
    if (!this.hasImages) {
      return;
    }

    this.currentImageIndex = this.currentImageIndex === 0
      ? this.pendingImages.length - 1
      : this.currentImageIndex - 1;
    this.setStatus('Imagen anterior cargada.', 'warning');
  }

  nextImage(): void {
    if (!this.hasImages) {
      return;
    }

    this.currentImageIndex = (this.currentImageIndex + 1) % this.pendingImages.length;
    this.setStatus('Siguiente imagen cargada.', 'warning');
  }

  trackByStateId(_: number, state: UIState): number | undefined {
    return state.id;
  }

  getStateButtonClass(index: number): string {
    if (this.uiStates.length <= 3) {
      return `ghost-button ghost-${this.uiStateLayout[index] ?? 'right'}`;
    }

    return 'solid-button';
  }

  getDoctorLabel(doctor: Doctor | null | undefined): string {
    if (!doctor?.id) {
      return 'Doctor desconocido';
    }

    return `${doctor.code} · ${doctor.userId}`;
  }

  getDiagnosticLabel(medicalDiagnosticId: number | null | undefined): string {
    if (medicalDiagnosticId == null) {
      return 'Sin diagnóstico';
    }

    const diagnostic = this.medicalDiagnostics.find((item) => item.id === medicalDiagnosticId);
    if (!diagnostic) {
      return `Diagnóstico #${medicalDiagnosticId}`;
    }

    return `${diagnostic.diagnosticName ?? diagnostic.diagnosticCode} (${diagnostic.diagnosticCode})`;
  }

  getAreaLabel(): string {
    if (!this.evaluationArea?.id) {
      return 'Área de evaluación';
    }

    return `${this.evaluationArea.name} (${this.evaluationArea.codeArea})`;
  }

  getConfigLabel(): string {
    if (!this.uiConfig?.id) {
      return 'Sin UI Config';
    }

    return `UI Config #${this.uiConfig.id}`;
  }

  getImageProgressLabel(): string {
    if (!this.hasImages) {
      return '0 imágenes pendientes';
    }

    return `${this.currentImageIndex + 1} / ${this.pendingImages.length}`;
  }

  openImageInNewTab(): void {
    const image = this.currentImage;
    if (!image?.imageUrl) {
      return;
    }

    window.open(image.imageUrl, '_blank', 'noopener,noreferrer');
  }

  goBack(): void {
    this.router.navigate(['/medical-images/list']);
  }

  private hasDoctorAccess(): boolean {
    if (!this.currentDoctor?.id) {
      return false;
    }

    return this.doctorsWithAccess.some((doctor) => doctor.id === this.currentDoctor?.id);
  }

  private setStatus(message: string, type: 'success' | 'warning' | 'error'): void {
    this.statusMessage = message;
    this.statusType = type;
  }

  private unwrapData<T>(response: ApiResponse<T> | T | null | undefined, fallback: T): T {
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as ApiResponse<T>).data ?? fallback;
    }

    return (response as T) ?? fallback;
  }
}