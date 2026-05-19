import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UIConfig, UIState, MedicalDiagnostic } from '@app/models/ms-clasificator';
import { UIConfigService } from '@app/services/ms-clasificator/ui-config.service';
import { UIStateService } from '@app/services/ms-clasificator/ui-state.service';
import { MedicalDiagnosticService } from '@app/services/ms-clasificator/medical-diagnostic.service';

type PreviewCard = {
  title: string;
  indicator: string;
  description: string;
};

@Component({
  selector: 'app-ui-config-manage-state',
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
    MatProgressSpinnerModule
  ],
  templateUrl: './manage-state.component.html',
  styleUrl: './manage-state.component.scss'
})
export class ManageStateComponent implements OnInit {
  loading = true;
  saving = false;

  uiConfigId!: number;
  uiConfig: UIConfig | null = null;
  configDiagnostic: MedicalDiagnostic | null = null;
  uiStates: UIState[] = [];
  medicalDiagnostics: MedicalDiagnostic[] = [];
  availableSubDiagnostics: MedicalDiagnostic[] = [];

  previewCards: PreviewCard[] = [
    {
      title: 'Vista 1',
      indicator: 'Configuración avanzada',
      description: 'Previsualización de la experiencia de clasificación principal.'
    },
    {
      title: 'Vista 2',
      indicator: 'Vista alternativa',
      description: 'Segundo ejemplo de visualización para comparar comportamientos.'
    }
  ];

  stateForm = this.fb.group({
    medicalDiagnosticId: [null as number | null, Validators.required]
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private uiConfigService: UIConfigService,
    private uiStateService: UIStateService,
    private medicalDiagnosticService: MedicalDiagnosticService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      this.router.navigate(['ui-configs/list']);
      return;
    }

    this.uiConfigId = Number(idParam);

    this.medicalDiagnosticService.findAll().subscribe({
      next: (diagnostics) => {
        this.medicalDiagnostics = diagnostics ?? [];
        this.refreshAvailableSubDiagnostics();
        this.loadContext();
      },
      error: () => {
        this.medicalDiagnostics = [];
        this.availableSubDiagnostics = [];
        this.loadContext();
      }
    });
  }

  private loadContext(): void {
    this.uiConfigService.findById(this.uiConfigId).subscribe({
      next: (response) => {
        this.uiConfig = (response as any)?.data ?? null;

        if (!this.uiConfig) {
          alert('No se pudo cargar la UI Config');
          this.router.navigate(['ui-configs/list']);
          return;
        }

        this.configDiagnostic = this.findDiagnosticById(this.uiConfig.medicalDiagnosticId);
        this.refreshAvailableSubDiagnostics();
        this.loadStates();
      },
      error: () => {
        alert('No se pudo cargar la UI Config');
        this.router.navigate(['ui-configs/list']);
      }
    });
  }

  private loadStates(): void {
    this.uiStateService.findByUiConfigId(this.uiConfigId).subscribe({
      next: (response) => {
        this.uiStates = (response as any)?.data ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar UIStates:', error);
        this.uiStates = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getDiagnosticLabel(medicalDiagnosticId: number | null | undefined): string {
    if (medicalDiagnosticId == null) {
      return 'Sin diagnóstico';
    }

    const diagnostic = this.findDiagnosticById(medicalDiagnosticId);
    if (!diagnostic) {
      return `Diagnóstico #${medicalDiagnosticId}`;
    }

    return `${diagnostic.diagnosticName ?? diagnostic.diagnosticCode} (${diagnostic.diagnosticCode})`;
  }

  getSubDiagnosticOptions(): MedicalDiagnostic[] {
    return this.availableSubDiagnostics;
  }

  private findDiagnosticById(id: number): MedicalDiagnostic | null {
    return this.medicalDiagnostics.find(diagnostic => diagnostic.id === id) ?? null;
  }

  private refreshAvailableSubDiagnostics(): void {
    const parentDiagnosticId = this.uiConfig?.medicalDiagnosticId;

    if (parentDiagnosticId == null) {
      this.availableSubDiagnostics = [];
      return;
    }

    this.availableSubDiagnostics = this.medicalDiagnostics.filter(
      diagnostic => diagnostic.parentDiagnosticId === parentDiagnosticId
    );
  }

  handleAddState(): void {
    if (this.stateForm.invalid) {
      this.stateForm.markAllAsTouched();
      return;
    }

    const medicalDiagnosticId = this.stateForm.value.medicalDiagnosticId;
    if (medicalDiagnosticId == null) {
      return;
    }

    this.saving = true;
    this.uiStateService.create({
      uiConfigId: this.uiConfigId,
      medicalDiagnosticId
    }).subscribe({
      next: () => {
        this.stateForm.reset({ medicalDiagnosticId: null });
        this.saving = false;
        this.loadStates();
      },
      error: (error) => {
        this.saving = false;
        console.error('Error al crear UIState:', error);
        alert('No se pudo agregar el estado UI');
      }
    });
  }

  removeState(uiState: UIState): void {
    if (!uiState.id) {
      return;
    }

    if (!confirm('¿Quieres eliminar este estado UI?')) {
      return;
    }

    this.uiStateService.delete(uiState.id).subscribe({
      next: () => this.loadStates(),
      error: (error) => {
        console.error('Error al eliminar UIState:', error);
        alert('No se pudo eliminar el estado UI');
      }
    });
  }

  backToList(): void {
    this.router.navigate(['ui-configs/list']);
  }
}
