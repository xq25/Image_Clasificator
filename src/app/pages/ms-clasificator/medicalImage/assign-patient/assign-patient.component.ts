import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { Patient } from '@app/models/ms-clasificator';
import { PatientService } from '@app/services/ms-clasificator/patient.service';
import { MedicalImageService } from '@app/services/ms-clasificator/medical-image.service';

@Component({
  selector: 'app-assign-patient',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './assign-patient.component.html',
})
export class AssignPatientComponent implements OnInit {
  loading = true;
  saving = false;
  patients = signal<Patient[]>([]);

  imageId!: string;

  form = this.fb.group({
    patientId: [null as number | null, Validators.required]
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private patientService: PatientService,
    private medicalImageService: MedicalImageService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/medical-images/list']);
      return;
    }
    this.imageId = id;
    this.loadPatients();
  }

  back(): void {
    this.router.navigate(['/medical-images/list']);
  }

  loadPatients(): void {
    this.loading = true;
    this.patientService.findAll().subscribe({
      next: (patients) => {
        this.patients.set(patients ?? []);
        this.loading = false;
      },
      error: () => {
        this.patients.set([]);
        this.loading = false;
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const patientId = this.form.value.patientId;
    if (patientId == null) return;

    this.saving = true;
    this.medicalImageService.assignPatient(Number(this.imageId), patientId).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate([`/medical-images/view/${this.imageId}`]);
      },
      error: (err) => {
        console.error('Error assigning patient', err);
        this.saving = false;
      }
    });
  }
}
