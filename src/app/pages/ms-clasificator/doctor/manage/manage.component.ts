import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';

import { DynamicFormComponent, DynamicFormConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { DoctorService } from '@app/services/ms-clasificator/doctor.service';
import { UserService } from '@app/services/ms-security/user-service';
import { Doctor } from '@app/models/ms-clasificator';
import { User } from '@app/models/User';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

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
  allUsers: User[] = [];
  toast = signal<Toast | null>(null);

  private toastTimer: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private doctorService: DoctorService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const routePath = this.route.snapshot.routeConfig?.path ?? '';
    const id = this.route.snapshot.paramMap.get('id');

    if (routePath === 'create') {
      this.loadUsersAndBuildConfig(1, null);

    } else if (routePath === 'view/:id' && id) {
      this.loadDoctor(id, 0);

    } else if (routePath === 'edit/:id' && id) {
      this.loadDoctor(id, 2);

    } else {
      console.warn('[ManageComponent] Ruta no reconocida:', routePath);
      this.router.navigate(['doctors/list']);
    }
  }

  private loadUsersAndBuildConfig(mode: 0 | 1 | 2, model: Doctor | null): void {
    this.loading = true;

    this.userService.getUsers().subscribe({
      next: (response) => {
        this.allUsers = response.data ?? [];
        this.buildConfig(mode, model);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Error: No se pudo cargar el catálogo de usuarios');
        this.router.navigate(['doctors/list']);
      }
    });
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
    const userOptions = mode === 1
      ? this.allUsers
        .filter(user => user.id)
        .map(user => ({
          value: user.id,
          label: user.email || user.id || 'Sin correo'
        }))
      : [];

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
          type: mode === 1 ? 'select' : 'text',
          placeholder: mode === 1 ? 'Selecciona un usuario' : 'ID del usuario asociado',
          disabled: mode === 2,
          validators: [Validators.required],
          options: userOptions
        }
      ]
    };
  }

  handleFormSubmit(data: any): void {
    const mode = this.formConfig.mode;

    if (mode === 1) {
      this.doctorService.create(data).subscribe({
        next: () => {
          this.showToast('Doctor creado exitosamente', 'success');
          this.navigateAfterToast();
        },
        error: (error) => {
          console.error('Error al crear doctor:', error);
          this.showToast('Error al crear doctor', 'error');
        }
      });

    } else if (mode === 2) {
      this.doctorService.update(Number(data.id), data).subscribe({
        next: () => {
          this.showToast('Doctor actualizado exitosamente', 'success');
          this.navigateAfterToast();
        },
        error: (error) => {
          console.error('Error al actualizar doctor:', error);
          this.showToast('Error al actualizar doctor', 'error');
        }
      });
    }
  }

  handleFormCancel(): void {
    this.router.navigate(['doctors/list']);
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }

  private navigateAfterToast(): void {
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toast.set(null);
      this.router.navigate(['doctors/list']);
    }, 1500);
  }
}