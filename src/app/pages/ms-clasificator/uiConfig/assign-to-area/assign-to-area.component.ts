import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { EvaluationArea, UIConfig } from '@app/models/ms-clasificator';
import { EvaluationAreaService } from '@app/services/ms-clasificator/evaluation-area.service';
import { UIConfigService } from '@app/services/ms-clasificator/ui-config.service';

@Component({
  selector: 'app-ui-config-assign-to-area',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent, MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './assign-to-area.component.html',
  styleUrl: './assign-to-area.component.scss'
})
export class AssignToAreaComponent implements OnInit {
  loading = true;
  saving = false;

  uiConfigId!: number;
  uiConfig: UIConfig | null = null;
  evaluationAreas: EvaluationArea[] = [];

  formConfig!: DynamicFormConfig;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private uiConfigService: UIConfigService,
    private evaluationAreaService: EvaluationAreaService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      this.router.navigate(['ui-configs/list']);
      return;
    }

    this.uiConfigId = Number(idParam);
    this.loadContext();
  }

  private loadContext(): void {
    this.loading = true;

    this.evaluationAreaService.findAll().subscribe({
      next: (areas) => {
        this.evaluationAreas = areas ?? [];
        this.loadUiConfig();
      },
      error: (error) => {
        console.error('Error al cargar áreas de evaluación:', error);
        this.evaluationAreas = [];
        this.loadUiConfig();
      }
    });
  }

  private loadUiConfig(): void {
    this.uiConfigService.findById(this.uiConfigId).subscribe({
      next: (response) => {
        this.uiConfig = (response as any)?.data ?? null;

        if (!this.uiConfig) {
          alert('No se pudo cargar la configuración UI');
          this.router.navigate(['ui-configs/list']);
          return;
        }

        this.buildForm(this.uiConfig);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar UI Config:', error);
        alert('No se pudo cargar la configuración UI');
        this.router.navigate(['ui-configs/list']);
      }
    });
  }

  buildForm(model: UIConfig): void {
    this.formConfig = {
      mode: 2,
      model,
      fields: [
        {
          name: 'id',
          label: 'ID',
          type: 'text',
          disabled: true
        },
        {
          name: 'medicalDiagnosticId',
          label: 'Diagnóstico médico',
          type: 'text',
          disabled: true
        },
        {
          name: 'evaluationAreaId',
          label: 'Área de evaluación',
          type: 'select',
          options: this.evaluationAreas.map(area => ({
            value: area.id,
            label: `${area.name} (${area.codeArea})`
          })),
          validators: [Validators.required]
        }
      ]
    };
  }

  handleFormSubmit(data: any): void {
    if (data.evaluationAreaId == null) {
      alert('Selecciona un área de evaluación');
      return;
    }

    this.saving = true;

    this.uiConfigService.assignToEvaluationArea(this.uiConfigId, Number(data.evaluationAreaId)).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['ui-configs/list']);
      },
      error: (error) => {
        console.error('Error al asignar el área de evaluación:', error);
        this.saving = false;
        alert('No se pudo asignar el área de evaluación');
      }
    });
  }

  handleFormCancel(): void {
    this.router.navigate(['ui-configs/list']);
  }

  removeFromArea(): void {
    if (!confirm('¿Quieres quitar esta UI Config de su área de evaluación actual?')) {
      return;
    }

    this.saving = true;

    this.uiConfigService.removeFromEvaluationArea(this.uiConfigId).subscribe({
      next: () => {
        this.saving = false;
        this.loadUiConfig();
      },
      error: (error) => {
        console.error('Error al remover el área de evaluación:', error);
        this.saving = false;
        alert('No se pudo remover el área de evaluación');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['ui-configs/list']);
  }
}