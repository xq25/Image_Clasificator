import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MedicalImg, EvaluationArea, Patient, ApiResponse } from '@app/models/ms-clasificator';
import { EvaluationAreaService } from '@app/services/ms-clasificator/evaluation-area.service';
import { MedicalImageService } from '@app/services/ms-clasificator/medical-image.service';
import { PatientService } from '@app/services/ms-clasificator/patient.service';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-medical-image-manage',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './manage.component.html',
  styleUrl: './manage.component.scss',
})
export class ManageComponent implements OnInit {

  loading = true;
  savingUpload = false;
  savingPatient = false;
  savingArea = false;

  imageId!: string;
  mode: 0 | 1 = 1;

  image = signal<MedicalImg | null>(null);
  evaluationAreas = signal<EvaluationArea[]>([]);
  patients = signal<Patient[]>([]);
  toast = signal<Toast | null>(null);
  selectedFileName = signal('');
  

  private toastTimer: any;

  uploadForm = this.fb.group({
    file: [null as File | null, Validators.required],
    evaluationAreaId: [null as number | null, Validators.required],
    patientId: [null as number | null],
    folder: ['diagnostics', Validators.required],
  });

  relationForm = this.fb.group({
    patientId: [null as number | null],
    evaluationAreaId: [null as number | null, Validators.required],
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private medicalImageService: MedicalImageService,
    private evaluationAreaService: EvaluationAreaService,
    private patientService: PatientService,
  ) {}

  ngOnInit(): void {
    const routePath = this.route.snapshot.routeConfig?.path ?? '';
    const id = this.route.snapshot.paramMap.get('id');

    if (routePath === 'create') {
      this.mode = 1;
      this.loadContext();
      return;
    }

    if (routePath === 'view/:id' && id) {
      this.mode = 0;
      this.imageId = id;
      this.loadContext(id);
      return;
    }

    this.router.navigate(['medical-images/list']);
  }

  private loadContext(imageId?: string): void {
    this.loading = true;

    if (imageId) {
      forkJoin({
        areas: this.evaluationAreaService.findAll(),
        patients: this.patientService.findAll(),
        image: this.medicalImageService.findById(Number(imageId)),
      }).subscribe({
        next: (response: { areas: EvaluationArea[]; patients: Patient[]; image: ApiResponse<MedicalImg> }) => {
          this.evaluationAreas.set(response.areas ?? []);
          this.patients.set(response.patients ?? []);

          const image = response.image?.data ?? null;

          if (!image) {
            alert('Error: No se pudo cargar la imagen médica');
            this.router.navigate(['medical-images/list']);
            return;
          }

          this.image.set(image);
          this.relationForm.reset({
            patientId: image.patientId ?? null,
            evaluationAreaId: image.evaluationAreaId ?? null,
          });

          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          alert('No se pudo cargar la información necesaria');
          this.router.navigate(['medical-images/list']);
        }
      });
      return;
    }

    forkJoin({
      areas: this.evaluationAreaService.findAll(),
      patients: this.patientService.findAll(),
    }).subscribe({
      next: (response: { areas: EvaluationArea[]; patients: Patient[] }) => {
        this.evaluationAreas.set(response.areas ?? []);
        this.patients.set(response.patients ?? []);
        this.image.set(null);
        this.relationForm.reset({
          patientId: null,
          evaluationAreaId: null,
        });

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('No se pudo cargar la información necesaria');
        this.router.navigate(['medical-images/list']);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.uploadForm.patchValue({ file });
    this.selectedFileName.set(file?.name ?? '');
  }

  handleUpload(): void {
    if (this.uploadForm.invalid) {
      this.uploadForm.markAllAsTouched();
      return;
    }

    const file = this.uploadForm.value.file;
    const evaluationAreaId = this.uploadForm.value.evaluationAreaId;

    if (!file || evaluationAreaId == null) {
      return;
    }

    const patientId = this.uploadForm.value.patientId ?? undefined;
    const folder = (this.uploadForm.value.folder ?? 'diagnostics').toString().trim() || 'diagnostics';

    this.savingUpload = true;

    this.medicalImageService.upload(file, evaluationAreaId, patientId ?? undefined, folder).subscribe({
      next: () => {
        this.savingUpload = false;
        this.showToast('Imagen médica subida exitosamente', 'success');
        this.router.navigate(['medical-images/list']);
      },
      error: (error) => {
        console.error('Error al subir imagen médica:', error);
        this.savingUpload = false;
        this.showToast('Error al subir la imagen médica', 'error');
      }
    });
  }

  assignPatient(): void {
    const image = this.image();
    const patientId = this.relationForm.value.patientId;

    if (!image?.id) {
      this.showToast('No se pudo determinar la imagen médica', 'error');
      return;
    }

    if (patientId == null) {
      this.showToast('Seleccione un paciente', 'error');
      return;
    }

    this.savingPatient = true;

    this.medicalImageService.assignPatient(image.id, patientId).subscribe({
      next: (response) => {
        this.savingPatient = false;
        this.showToast('Paciente asignado exitosamente', 'success');
        this.image.set(response?.data ?? image);
        this.loadContext(this.imageId);
      },
      error: (error) => {
        console.error('Error asignando paciente:', error);
        this.savingPatient = false;
        this.showToast('Error al asignar el paciente', 'error');
      }
    });
  }

  removePatient(): void {
    const image = this.image();

    if (!image?.id) {
      this.showToast('No se pudo determinar la imagen médica', 'error');
      return;
    }

    this.savingPatient = true;

    this.medicalImageService.removePatient(image.id).subscribe({
      next: (response) => {
        this.savingPatient = false;
        this.showToast('Paciente removido exitosamente', 'success');
        this.image.set(response?.data ?? { ...image, patientId: undefined });
        this.loadContext(this.imageId);
      },
      error: (error) => {
        console.error('Error removiendo paciente:', error);
        this.savingPatient = false;
        this.showToast('Error al remover el paciente', 'error');
      }
    });
  }

  changeEvaluationArea(): void {
    const image = this.image();
    const evaluationAreaId = this.relationForm.value.evaluationAreaId;

    if (!image?.id) {
      this.showToast('No se pudo determinar la imagen médica', 'error');
      return;
    }

    if (evaluationAreaId == null) {
      this.showToast('Seleccione un área de evaluación', 'error');
      return;
    }

    this.savingArea = true;

    this.medicalImageService.changeEvaluationArea(image.id, evaluationAreaId).subscribe({
      next: (response) => {
        this.savingArea = false;
        this.showToast('Área de evaluación actualizada exitosamente', 'success');
        this.image.set(response?.data ?? image);
        this.loadContext(this.imageId);
      },
      error: (error) => {
        console.error('Error cambiando área de evaluación:', error);
        this.savingArea = false;
        this.showToast('Error al cambiar el área de evaluación', 'error');
      }
    });
  }

  backToList(): void {
    this.router.navigate(['medical-images/list']);
  }

  getEvaluationAreaLabel(evaluationAreaId: number | null | undefined): string {
    if (evaluationAreaId == null) {
      return 'Sin área';
    }

    const area = this.evaluationAreas().find(item => item.id === evaluationAreaId);
    if (!area) {
      return `Área #${evaluationAreaId}`;
    }

    return `${area.name} (${area.codeArea})`;
  }

  getPatientLabel(patientId: number | null | undefined): string {
    if (patientId == null) {
      return 'Sin paciente';
    }

    const patient = this.patients().find(item => item.id === patientId);
    if (!patient) {
      return `Paciente #${patientId}`;
    }

    return `${patient.document} (${patient.userId})`;
  }

  formatDate(value?: Date | string): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
  }

  formatBytes(bytes?: number): string {
    if (!bytes || bytes <= 0) {
      return '-';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }

    return `${value.toFixed(value < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }

}