import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';

import { ClinicalRecordService } from '@app/services/ms-clasificator/clinical-record.service';
import { PatientService } from '@app/services/ms-clasificator/patient.service';
import { PatientDatumService } from '@app/services/ms-clasificator/patient-datum.service';
import { MedicalImageService } from '@app/services/ms-clasificator/medical-image.service';
import { DiagnosisService } from '@app/services/ms-clasificator/diagnosis.service';

import { ClinicalRecordExtended } from '@models/ms-clasificator/ClinicalRecord/ClinicalRecord';
import { PatientExtended } from '@models/ms-clasificator/Patient/Patient';
import { PatientDatumExtended } from '@models/ms-clasificator/PatientDatum/PatientDatum';
import { MedicalImg } from '@models/ms-clasificator/MedicalImage/MedicalImg';
import { Diagnosis } from '@models/ms-clasificator/Diagnosis/Diagnosis';

@Component({
  selector: 'app-info',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatDividerModule,
  ],
  templateUrl: './info.component.html',
  styleUrl: './info.component.scss',
})
export class InfoComponent implements OnInit {

  record    = signal<ClinicalRecordExtended | null>(null);
  patient   = signal<PatientExtended | null>(null);
  datums    = signal<PatientDatumExtended[]>([]);
  images    = signal<MedicalImg[]>([]);
  diagnoses = signal<Diagnosis[]>([]);
  loading   = signal(true);
  error     = signal(false);

  patientInitials = computed(() => {
    const name = this.patient()?.userInfo?.name ?? '';
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  });

  patientDisplayId = computed(() => {
    const id = this.patient()?.id;
    return id ? `PAC-${String(id).padStart(6, '0')}` : '—';
  });

  mainDiagnosis      = computed(() => this.diagnoses()[0] ?? null);
  secondaryDiagnoses = computed(() => this.diagnoses().slice(1));
  previewImages      = computed(() => this.images().slice(0, 2));

  datumColumns = ['tipo', 'valor', 'tipoDato'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clinicalRecordService: ClinicalRecordService,
    private patientService: PatientService,
    private patientDatumService: PatientDatumService,
    private medicalImageService: MedicalImageService,
    private diagnosisService: DiagnosisService,
  ) {}

  ngOnInit(): void {
    const id        = Number(this.route.snapshot.paramMap.get('id'));
    const patientId = Number(this.route.snapshot.paramMap.get('patientId'));
    if (!id || !patientId) { this.error.set(true); this.loading.set(false); return; }
    this.loadAll(id, patientId);
  }

  private loadAll(recordId: number, patientId: number): void {
    forkJoin([
      this.clinicalRecordService.findById(recordId),
      this.patientService.findById(patientId),
      this.patientDatumService.findByClinicalRecordId(recordId),
      this.medicalImageService.findByClinicalRecord(recordId),
      this.diagnosisService.findByClinicalRecordId(recordId),
    ]).subscribe({
      next: ([recRes, patRes, datRes, imgRes, diagRes]) => {
        const record = recRes.data ?? null;
        if (!record) { this.error.set(true); this.loading.set(false); return; }
        this.record.set(record);
        this.patient.set(patRes.data ?? null);
        this.datums.set(datRes.data ?? []);
        this.images.set(imgRes.data ?? []);
        this.diagnoses.set(diagRes.data ?? []);
        this.loading.set(false);
      },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }

  // ── Formatters ──────────────────────────────────────────────────

  formatRecordId(id?: number): string {
    return id ? `REC-${String(id).padStart(6, '0')}` : '—';
  }

  formatVisitDate(date?: Date | string): string {
    if (!date) return '—';
    const str = String(date);
    const [datePart, timePart = ''] = str.split('T');
    const [y, m, d] = datePart.split('-');
    const [hh = '00', mm = '00'] = timePart.split(':');
    return `${d}/${m}/${y} ${hh}:${mm}`;
  }

  formatDob(dob?: Date | string): string {
    if (!dob) return '—';
    const [y, m, d] = String(dob).split('T')[0].split('-');
    const age = new Date().getFullYear() - Number(y);
    return `${d}/${m}/${y} (${age} años)`;
  }

  formatSex(sex?: string): string {
    const map: Record<string, string> = { Male: 'Masculino', Female: 'Femenino', Intersex: 'Intersexo' };
    return sex ? (map[sex] ?? sex) : '—';
  }

  formatDatumType(type?: string | number): string {
    const map: Record<string, string> = {
      STRING: 'Texto', INTEGER: 'Entero', DOUBLE: 'Decimal',
      BOOLEAN: 'Booleano', DATE: 'Fecha', DATETIME: 'Fecha y hora',
      TIME: 'Hora', BINARY: 'Binario', TEXT: 'Texto largo',
      '0': 'Texto', '1': 'Entero', '2': 'Decimal', '3': 'Booleano',
      '4': 'Fecha', '5': 'Fecha y hora', '6': 'Hora', '7': 'Binario', '8': 'Texto largo',
    };
    return type != null ? (map[String(type)] ?? String(type)) : '—';
  }

  goBack(): void {
    const doc = this.patient()?.document ?? this.record()?.patientInfo?.document;
    if (doc) this.router.navigate(['/clinical-records/patient', doc, 'records']);
    else     this.router.navigate(['/clinical-records']);
  }

  goUpload(): void {
    const id        = this.route.snapshot.paramMap.get('id');
    const patientId = this.route.snapshot.paramMap.get('patientId');
    this.router.navigate([`/clinical-records/${id}/upload/${patientId}`]);
  }
}
