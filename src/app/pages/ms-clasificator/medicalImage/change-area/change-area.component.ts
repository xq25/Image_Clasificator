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

import { EvaluationArea } from '@app/models/ms-clasificator';
import { EvaluationAreaService } from '@app/services/ms-clasificator/evaluation-area.service';
import { MedicalImageService } from '@app/services/ms-clasificator/medical-image.service';

@Component({
  selector: 'app-change-area',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './change-area.component.html',
})
export class ChangeAreaComponent implements OnInit {
  loading = true;
  saving = false;
  areas = signal<EvaluationArea[]>([]);

  imageId!: string;

  form = this.fb.group({
    evaluationAreaId: [null as number | null, Validators.required]
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private evaluationAreaService: EvaluationAreaService,
    private medicalImageService: MedicalImageService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/medical-images/list']);
      return;
    }
    this.imageId = id;
    this.loadAreas();
  }

  back(): void {
    this.router.navigate(['/medical-images/list']);
  }

  loadAreas(): void {
    this.loading = true;
    this.evaluationAreaService.findAll().subscribe({
      next: (areas) => {
        this.areas.set(areas ?? []);
        this.loading = false;
      },
      error: () => {
        this.areas.set([]);
        this.loading = false;
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const evaluationAreaId = this.form.value.evaluationAreaId;
    if (evaluationAreaId == null) return;

    this.saving = true;
    this.medicalImageService.changeEvaluationArea(Number(this.imageId), evaluationAreaId).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate([`/medical-images/view/${this.imageId}`]);
      },
      error: (err) => {
        console.error('Error changing area', err);
        this.saving = false;
      }
    });
  }
}
