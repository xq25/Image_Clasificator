import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { EvaluationAreaService } from '@app/services/ms-clasificator/evaluation-area.service';
import { EvaluationArea } from '@app/models/ms-clasificator';

@Component({
  selector: 'app-manage',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './manage.component.html',
  styleUrl: './manage.component.scss',
})
export class ManageComponent implements OnInit {

  formConfig!: DynamicFormConfig;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evaluationAreaService: EvaluationAreaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const routePath = this.route.snapshot.routeConfig?.path ?? '';
    const id = this.route.snapshot.paramMap.get('id');

    if (routePath === 'create') {
      this.buildConfig(1, null);
      this.loading = false;
      this.cdr.detectChanges();

    } else if (routePath === 'view/:id' && id) {
      this.loadEvaluationArea(id, 0);

    } else if (routePath === 'edit/:id' && id) {
      this.loadEvaluationArea(id, 2);

    } else {
      console.warn('[ManageComponent] Ruta no reconocida:', routePath);
      this.router.navigate(['evaluation-areas/list']);
    }
  }

  private loadEvaluationArea(id: string, mode: 0 | 2): void {
    this.evaluationAreaService.findById(Number(id)).subscribe({
      next: (response) => {
        const evaluationArea = response?.data ?? null;

        if (!evaluationArea) {
          alert('Error: No se pudo cargar el área de evaluación');
          this.router.navigate(['evaluation-areas/list']);
          return;
        }

        this.buildConfig(mode, evaluationArea);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Error: No se pudo cargar el área de evaluación');
        this.router.navigate(['evaluation-areas/list']);
      }
    });
  }

  buildConfig(mode: 0 | 1 | 2, model: EvaluationArea | null): void {
    this.formConfig = {
      mode,
      model,
      fields: [
        {
          name: 'id',
          label: 'ID',
          type: 'text'
        },
        {
          name: 'codeArea',
          label: 'Código de área',
          type: 'text',
          placeholder: 'Ingresa el código del área',
          validators: [Validators.required, Validators.minLength(2)]
        },
        {
          name: 'name',
          label: 'Nombre',
          type: 'text',
          placeholder: 'Ingresa el nombre del área',
          validators: [Validators.required, Validators.minLength(2)]
        }
      ]
    };
  }

  handleFormSubmit(data: any): void {
    const mode = this.formConfig.mode;

    if (mode === 1) {
      this.evaluationAreaService.create(data).subscribe({
        next: () => {
          alert('Área de evaluación creada exitosamente');
          this.router.navigate(['evaluation-areas/list']);
        },
        error: (error) => {
          console.error('Error al crear área de evaluación:', error);
          alert('Error al crear área de evaluación');
        }
      });

    } else if (mode === 2) {
      this.evaluationAreaService.update(Number(data.id), data).subscribe({
        next: () => {
          alert('Área de evaluación actualizada exitosamente');
          this.router.navigate(['evaluation-areas/list']);
        },
        error: (error) => {
          console.error('Error al actualizar área de evaluación:', error);
          alert('Error al actualizar área de evaluación');
        }
      });
    }
  }

  handleFormCancel(): void {
    this.router.navigate(['evaluation-areas/list']);
  }
}