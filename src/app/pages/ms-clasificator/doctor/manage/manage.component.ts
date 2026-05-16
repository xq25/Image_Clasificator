import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { DoctorService } from '@app/services/ms-clasificator/doctor.service';
import { Doctor } from '@app/models/ms-clasificator';

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
    private doctorService: DoctorService,
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
      this.loadDoctor(id, 0);

    } else if (routePath === 'edit/:id' && id) {
      this.loadDoctor(id, 2);

    } else {
      console.warn('[ManageComponent] Ruta no reconocida:', routePath);
      this.router.navigate(['doctors/list']);
    }
  }

  private loadDoctor(id: string, mode: 0 | 2): void {
    this.doctorService.findById(Number(id)).subscribe({
      next: (response) => {
        const doctor = response?.data ?? null;

        if (!doctor) {
          alert('Error: No se pudo cargar el doctor');
          this.router.navigate(['doctors/list']);
          return;
        }

        this.buildConfig(mode, doctor);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Error: No se pudo cargar el doctor');
        this.router.navigate(['doctors/list']);
      }
    });
  }

  buildConfig(mode: 0 | 1 | 2, model: Doctor | null): void {
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
          name: 'code',
          label: 'Código',
          type: 'text',
          placeholder: 'Ingresa el código del doctor',
          validators: [Validators.required, Validators.minLength(2)]
        },
        {
          name: 'userId',
          label: 'ID de usuario',
          type: 'text',
          placeholder: 'ID del usuario asociado',
          validators: [Validators.required]
        }
      ]
    };
  }

  handleFormSubmit(data: any): void {
    const mode = this.formConfig.mode;

    if (mode === 1) {
      this.doctorService.create(data).subscribe({
        next: () => {
          alert('Doctor creado exitosamente');
          this.router.navigate(['doctors/list']);
        },
        error: (error) => {
          console.error('Error al crear doctor:', error);
          alert('Error al crear doctor');
        }
      });

    } else if (mode === 2) {
      this.doctorService.update(Number(data.id), data).subscribe({
        next: () => {
          alert('Doctor actualizado exitosamente');
          this.router.navigate(['doctors/list']);
        },
        error: (error) => {
          console.error('Error al actualizar doctor:', error);
          alert('Error al actualizar doctor');
        }
      });
    }
  }

  handleFormCancel(): void {
    this.router.navigate(['doctors/list']);
  }
}