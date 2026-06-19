import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { PatientDatumService }      from '@app/services/ms-clasificator/patient-datum.service';
import { MedicalImageService }      from '@app/services/ms-clasificator/medical-image.service';
import { PrimitiveDatumService }    from '@app/services/ms-clasificator/primitive-datum.service';
import { MedicalImageTypeService }  from '@app/services/ms-clasificator/medical-image-type.service';
import { ClinicalRecordService }    from '@app/services/ms-clasificator/clinical-record.service';
import { DiagnosisService }         from '@app/services/ms-clasificator/diagnosis.service';
import { MedicalDiagnosticService } from '@app/services/ms-clasificator/medical-diagnostic.service';

import { PrimitiveDatum }       from '@app/models/ms-clasificator/PrimitiveDatum/PrimitiveDatum';
import { MedicalImageType }     from '@app/models/ms-clasificator/MedicalImageType/MedicalImageType';
import { PatientDatumExtended } from '@app/models/ms-clasificator/PatientDatum/PatientDatum';
import { MedicalImg }           from '@app/models/ms-clasificator/MedicalImage/MedicalImg';
import { ClinicalRecordExtended } from '@app/models/ms-clasificator/ClinicalRecord/ClinicalRecord';
import { DiagnosisExtended }    from '@app/models/ms-clasificator/Diagnosis/Diagnosis';
import { MedicalDiagnosticExtended } from '@app/models/ms-clasificator/MedicalDiagnostic/MedicalDiagnostic';

interface Toast { message: string; type: 'success' | 'error'; }

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss',
})
export class UploadComponent implements OnInit {

  private fb    = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastTimer: any;

  clinicalRecordId = signal<number | null>(null);
  patientId        = signal<number | null>(null);
  clinicalRecord   = signal<ClinicalRecordExtended | null>(null);

  // ─── CATÁLOGOS ───────────────────────────────────────────────────────────────
  primitiveDatums    = signal<PrimitiveDatum[]>([]);
  imageTypes         = signal<MedicalImageType[]>([]);
  medicalDiagnostics = signal<MedicalDiagnosticExtended[]>([]);
  loadingCatalogs    = signal(true);

  // ─── HISTORIAL CARGADO EN SESIÓN ─────────────────────────────────────────────
  uploadedDatums    = signal<PatientDatumExtended[]>([]);
  uploadedImages    = signal<MedicalImg[]>([]);
  uploadedDiagnoses = signal<DiagnosisExtended[]>([]);

  // ─── FORMULARIOS ─────────────────────────────────────────────────────────────
  datumForm!:     FormGroup;
  imageForm!:     FormGroup;
  diagnosisForm!: FormGroup;

  submittingDatum      = signal(false);
  submittingImage      = signal(false);
  submittingDiagnosis  = signal(false);

  selectedFile     = signal<File | null>(null);
  filePreviewUrl   = signal<string | null>(null);

  toast = signal<Toast | null>(null);

  constructor(
    private patientDatumService:      PatientDatumService,
    private medicalImageService:      MedicalImageService,
    private primitiveDatumService:    PrimitiveDatumService,
    private imageTypeService:         MedicalImageTypeService,
    private clinicalRecordService:    ClinicalRecordService,
    private diagnosisService:         DiagnosisService,
    private medicalDiagnosticService: MedicalDiagnosticService,
  ) {}

  ngOnInit(): void {
    const id        = Number(this.route.snapshot.paramMap.get('id'));
    const patientId = Number(this.route.snapshot.paramMap.get('patientId'));
    this.clinicalRecordId.set(id);
    this.patientId.set(patientId);

    this.initForms(id);
    this.loadCatalogs(id);
  }

  // ─── INIT ────────────────────────────────────────────────────────────────────

  initForms(clinicalRecordId: number): void {
    this.datumForm = this.fb.group({
      primitiveDatumId: [null, Validators.required],
      description:      ['',   Validators.required],
      clinicalRecordId: [clinicalRecordId],
    });

    this.imageForm = this.fb.group({
      medicalImageTypeId: [null, Validators.required],
    });

    this.diagnosisForm = this.fb.group({
      medicalDiagnosticId: [null, Validators.required],
      clinicalRecordId:    [clinicalRecordId],
    });
  }

  loadCatalogs(clinicalRecordId: number): void {
    this.loadingCatalogs.set(true);
    let done = 0;
    const checkDone = () => { if (++done === 4) this.loadingCatalogs.set(false); };

    this.primitiveDatumService.findAll().subscribe({
      next: r => { this.primitiveDatums.set(r.data ?? []); checkDone(); },
      error: () => checkDone(),
    });

    this.imageTypeService.findAll().subscribe({
      next: r => { this.imageTypes.set(r.data ?? []); checkDone(); },
      error: () => checkDone(),
    });

    this.clinicalRecordService.findById(clinicalRecordId).subscribe({
      next: r => { this.clinicalRecord.set(r.data ?? null); checkDone(); },
      error: () => checkDone(),
    });

    this.medicalDiagnosticService.findAll().subscribe({
      next: r => { this.medicalDiagnostics.set(r ?? []); checkDone(); },
      error: () => checkDone(),
    });
  }

  // ─── SELECTED PRIMITIVE INFO ─────────────────────────────────────────────────

  get selectedPrimitive(): PrimitiveDatum | null {
    const id = this.datumForm.get('primitiveDatumId')?.value;
    return this.primitiveDatums().find(p => p.id === id) ?? null;
  }

  // ─── FILE ────────────────────────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.selectedFile.set(file);
    this.filePreviewUrl.set(file ? URL.createObjectURL(file) : null);
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.filePreviewUrl.set(null);
  }

  // ─── SUBMIT DATUM ─────────────────────────────────────────────────────────────

  submitDatum(): void {
    this.datumForm.markAllAsTouched();
    if (this.datumForm.invalid) return;

    this.submittingDatum.set(true);
    const raw = this.datumForm.getRawValue();

    this.patientDatumService.create({
      primitiveDatumId: raw.primitiveDatumId,
      description:      raw.description,
      clinicalRecordId: raw.clinicalRecordId,
    }).subscribe({
      next: r => {
        this.showToast('Dato del paciente registrado', 'success');
        this.uploadedDatums.update(list => [r.data!, ...list]);
        this.datumForm.get('primitiveDatumId')!.reset();
        this.datumForm.get('description')!.reset();
        this.submittingDatum.set(false);
      },
      error: () => {
        this.showToast('Error al registrar dato del paciente', 'error');
        this.submittingDatum.set(false);
      },
    });
  }

  // ─── SUBMIT IMAGE ─────────────────────────────────────────────────────────────

  submitImage(): void {
    this.imageForm.markAllAsTouched();
    const file = this.selectedFile();
    if (this.imageForm.invalid || !file) {
      if (!file) this.showToast('Selecciona un archivo de imagen', 'error');
      return;
    }

    this.submittingImage.set(true);
    const typeId = Number(this.imageForm.value.medicalImageTypeId);

    this.medicalImageService.upload(file, typeId, 'diagnostics', this.clinicalRecordId()!).subscribe({
      next: r => {
        this.showToast('Imagen médica cargada', 'success');
        this.uploadedImages.update(list => [r.data!, ...list]);
        this.imageForm.reset();
        this.removeFile();
        this.submittingImage.set(false);
      },
      error: () => {
        this.showToast('Error al cargar imagen médica', 'error');
        this.submittingImage.set(false);
      },
    });
  }

  // ─── SUBMIT DIAGNOSIS ────────────────────────────────────────────────────────

  submitDiagnosis(): void {
    this.diagnosisForm.markAllAsTouched();
    if (this.diagnosisForm.invalid) return;

    this.submittingDiagnosis.set(true);
    const raw = this.diagnosisForm.getRawValue();

    this.diagnosisService.create({
      medicalDiagnosticId: raw.medicalDiagnosticId,
      clinicalRecordId:    raw.clinicalRecordId,
    }).subscribe({
      next: r => {
        this.showToast('Diagnóstico registrado', 'success');
        this.uploadedDiagnoses.update(list => [r.data!, ...list]);
        this.diagnosisForm.get('medicalDiagnosticId')!.reset();
        this.submittingDiagnosis.set(false);
      },
      error: () => {
        this.showToast('Error al registrar diagnóstico', 'error');
        this.submittingDiagnosis.set(false);
      },
    });
  }

  // ─── NAVIGATION ──────────────────────────────────────────────────────────────

  goBack(): void {
    this.router.navigate([`/clinical-records/${this.clinicalRecordId()}/info/${this.patientId()}`]);
  }

  // ─── TOAST ───────────────────────────────────────────────────────────────────

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3500);
  }
}
