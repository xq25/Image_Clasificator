import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { UIConfigService } from '@app/services/ms-clasificator/ui-config.service';
import { MedicalDiagnosticService } from '@app/services/ms-clasificator/medical-diagnostic.service';
import { UIConfig, MedicalDiagnostic } from '@app/models/ms-clasificator';

@Component({
  selector: 'app-ui-config-manage',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './manage.component.html',
  styleUrl: './manage.component.scss',
})
export class ManageComponent implements OnInit {

  formConfig!: DynamicFormConfig;
  loading = true;
  medicalDiagnostics: MedicalDiagnostic[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private uiConfigService: UIConfigService,
    private medicalDiagnosticService: MedicalDiagnosticService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const routePath = this.route.snapshot.routeConfig?.path ?? '';
    const id = this.route.snapshot.paramMap.get('id');

    // Primero cargar diagnósticos médicos para poblar el select
    this.medicalDiagnosticService.findAll().subscribe({
      next: (list) => {
        this.medicalDiagnostics = list || [];

        if (routePath === 'create') {
          this.buildConfig(1, null);
          this.loading = false;
          this.cdr.detectChanges();

        } else if (routePath === 'view/:id' && id) {
          this.loadConfig(id, 0);

        } else if (routePath === 'edit/:id' && id) {
          this.loadConfig(id, 2);

        } else {
          console.warn('[ManageComponent] Ruta no reconocida:', routePath);
          this.router.navigate(['ui-configs/list']);
        }
      },
      error: (err) => {
        console.error('Error al cargar diagnósticos médicos:', err);
        // Intentar continuar aunque fallen los diagnósticos
        if (routePath === 'create') {
          this.buildConfig(1, null);
          this.loading = false;
          this.cdr.detectChanges();
        } else if (routePath === 'view/:id' && id) {
          this.loadConfig(id, 0);
        } else if (routePath === 'edit/:id' && id) {
          this.loadConfig(id, 2);
        } else {
          this.router.navigate(['ui-configs/list']);
        }
      }
    });
  }

  private loadConfig(id: string, mode: 0 | 2): void {
    this.uiConfigService.findById(Number(id)).subscribe({
      next: (response) => {
        const config = (response as any)?.data ?? null;

        if (!config) {
          alert('Error: No se pudo cargar la configuración');
          this.router.navigate(['ui-configs/list']);
          return;
        }

        this.buildConfig(mode, config as UIConfig);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Error: No se pudo cargar la configuración');
        this.router.navigate(['ui-configs/list']);
      }
    });
  }

  buildConfig(mode: 0 | 1 | 2, model: UIConfig | null): void {
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
          name: 'medicalDiagnosticId',
          label: 'Diagnóstico Médico',
          type: 'select',
          options: this.medicalDiagnostics.map(d => ({
            value: d.id,
            label: `${d.diagnosticName ?? d.diagnosticCode} (${d.diagnosticCode})`
          })),
          validators: [Validators.required]
        }
      ]
    };
  }

  handleFormSubmit(data: any): void {
    const mode = this.formConfig.mode;

    if (mode === 1) {
      this.uiConfigService.create(data).subscribe({
        next: () => {
          alert('Configuración creada exitosamente');
          this.router.navigate(['ui-configs/list']);
        },
        error: (error) => {
          console.error('Error al crear configuración:', error);
          alert('Error al crear configuración');
        }
      });

    } else if (mode === 2) {
      this.uiConfigService.update(Number(data.id), data).subscribe({
        next: () => {
          alert('Configuración actualizada exitosamente');
          this.router.navigate(['ui-configs/list']);
        },
        error: (error) => {
          console.error('Error al actualizar configuración:', error);
          alert('Error al actualizar configuración');
        }
      });
    }
  }

  handleFormCancel(): void {
    this.router.navigate(['ui-configs/list']);
  }
}
