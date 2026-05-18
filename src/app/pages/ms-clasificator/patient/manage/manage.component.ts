import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { PatientService } from '@app/services/ms-clasificator/patient.service';
import { Patient } from '@app/models/ms-clasificator';

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
    private patientService: PatientService,
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
      this.loadPatient(id, 0);

    } else if (routePath === 'edit/:id' && id) {
      this.loadPatient(id, 2);

    } else {
      console.warn('[ManageComponent] Ruta no reconocida:', routePath);
      this.router.navigate(['patients/list']);
    }
  }

  private loadPatient(id: string, mode: 0 | 2): void {
    this.patientService.findById(Number(id)).subscribe({
      next: (response) => {
        const patient = response?.data ?? null;

        if (!patient) {
          alert('Error: No se pudo cargar el paciente');
          this.router.navigate(['patients/list']);
          return;
        }

        this.buildConfig(mode, patient);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Error: No se pudo cargar el paciente');
        this.router.navigate(['patients/list']);
      }
    });
  }

  buildConfig(mode: 0 | 1 | 2, model: Patient | null): void {
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
          name: 'document',
          label: 'Documento',
          type: 'text',
          placeholder: 'Ingresa el documento del paciente',
          validators: [Validators.required, Validators.minLength(4)]
        },
        {
          name: 'years',
          label: 'Años',
          type: 'number',
          placeholder: 'Ingresa la edad en años',
          validators: [Validators.required, Validators.min(0)]
        },
        {
          name: 'userId',
          label: 'ID de usuario',
          type: 'text',
          placeholder: 'ID del usuario asociado',
          disabled: mode === 2,
          validators: [Validators.required]
        }
      ]
    };
  }

  handleFormSubmit(data: any): void {
    const mode = this.formConfig.mode;

    if (mode === 1) {
      this.patientService.create(data).subscribe({
        next: () => {
          alert('Paciente creado exitosamente');
          this.router.navigate(['patients/list']);
        },
        error: (error) => {
          console.error('Error al crear paciente:', error);
          alert('Error al crear paciente');
        }
      });

    } else if (mode === 2) {
      this.patientService.update(Number(data.id), data).subscribe({
        next: () => {
          alert('Paciente actualizado exitosamente');
          this.router.navigate(['patients/list']);
        },
        error: (error) => {
          console.error('Error al actualizar paciente:', error);
          alert('Error al actualizar paciente');
        }
      });
    }
  }

  handleFormCancel(): void {
    this.router.navigate(['patients/list']);
  }
}