import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { MedicalDiagnosticService } from '@app/services/ms-clasificator/medical-diagnostic.service';
import { MedicalDiagnostic } from '@app/models/ms-clasificator';

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
    private medicalDiagnosticService: MedicalDiagnosticService,
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
      this.loadDiagnostic(id, 0);

    } else if (routePath === 'edit/:id' && id) {
      this.loadDiagnostic(id, 2);

    } else {
      console.warn('[ManageComponent] Ruta no reconocida:', routePath);
      this.router.navigate(['medical-diagnostics/list']);
    }
  }

  private loadDiagnostic(id: string, mode: 0 | 2): void {
    this.medicalDiagnosticService.findById(Number(id)).subscribe({
      next: (response) => {
        const diagnostic = response?.data ?? null;

        if (!diagnostic) {
          alert('Error: No se pudo cargar el diagnóstico');
          this.router.navigate(['medical-diagnostics/list']);
          return;
        }

        this.buildConfig(mode, diagnostic);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Error: No se pudo cargar el diagnóstico');
        this.router.navigate(['medical-diagnostics/list']);
      }
    });
  }

  buildConfig(mode: 0 | 1 | 2, model: MedicalDiagnostic | null): void {
    this.formConfig = {
      mode,
      model,
      fields: [
        { name: 'id', label: 'ID', type: 'text' },
        { name: 'diagnosticCode', label: 'Código', type: 'text', placeholder: 'Código del diagnóstico', validators: [Validators.required, Validators.minLength(2)] },
        { name: 'diagnosticName', label: 'Nombre', type: 'text', placeholder: 'Nombre del diagnóstico', validators: [Validators.required, Validators.minLength(2)] },
        { name: 'parentDiagnosticId', label: 'ID Padre', type: 'text', placeholder: 'ID del diagnóstico padre' }
      ]
    };
  }

  handleFormSubmit(data: any): void {
    const mode = this.formConfig.mode;

    if (mode === 1) {
      this.medicalDiagnosticService.create(data).subscribe({
        next: () => {
          alert('Diagnóstico creado exitosamente');
          this.router.navigate(['medical-diagnostics/list']);
        },
        error: (error) => {
          console.error('Error al crear diagnóstico:', error);
          alert('Error al crear diagnóstico');
        }
      });

    } else if (mode === 2) {
      this.medicalDiagnosticService.update(Number(data.id), data).subscribe({
        next: () => {
          alert('Diagnóstico actualizado exitosamente');
          this.router.navigate(['medical-diagnostics/list']);
        },
        error: (error) => {
          console.error('Error al actualizar diagnóstico:', error);
          alert('Error al actualizar diagnóstico');
        }
      });
    }
  }

  handleFormCancel(): void { this.router.navigate(['medical-diagnostics/list']); }
}
