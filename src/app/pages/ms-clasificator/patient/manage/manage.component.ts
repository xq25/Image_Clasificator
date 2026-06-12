import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DynamicFormComponent, DynamicFormConfig, RelatedEntityConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { PatientService } from '@app/services/ms-clasificator/patient.service';
import { UserService } from '@app/services/ms-security/user-service';
import { PatientExtended } from '@app/models/ms-clasificator/Patient/Patient';
import { User } from '@app/models/User';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

type FormMode = 0 | 1 | 2;

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
  toast = signal<Toast | null>(null);

  private toastTimer: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const routePath = this.route.snapshot.routeConfig?.path ?? '';
    const id = this.route.snapshot.paramMap.get('id');

    if (routePath === 'create') {
      this.loadCreateForm();

    } else if (routePath === 'view/:id' && id) {
      this.loadPatientForm(id, 0);

    } else if (routePath === 'edit/:id' && id) {
      this.loadPatientForm(id, 2);

    } else {
      console.warn('[ManageComponent] Ruta no reconocida:', routePath);
      this.router.navigate(['patients/list']);
    }
  }

  // ─── Loaders ────────────────────────────────────────────────────────────────

  private loadCreateForm(): void {
    this.loading = true;

    this.userService.getUsers().subscribe({
      next: (response) => {
        const users: User[] = response.data ?? [];
        this.buildConfig(1, null, users);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Error: No se pudo cargar el catálogo de usuarios');
        this.router.navigate(['patients/list']);
      }
    });
  }

  private loadPatientForm(id: string, mode: Extract<FormMode, 0 | 2>): void {
    this.loading = true;

    this.patientService.findById(Number(id)).subscribe({
      next: (response) => {
        const patient: PatientExtended | null = response?.data ?? null;

        if (!patient) {
          alert('Error: No se pudo cargar el paciente');
          this.router.navigate(['patients/list']);
          return;
        }

        if (mode === 0) {
          this.buildConfig(0, patient, []);
          this.loading = false;
          this.cdr.detectChanges();

        } else {
          this.userService.getUsers().subscribe({
            next: (userResponse) => {
              const users: User[] = userResponse.data ?? [];
              this.buildConfig(2, patient, users);
              this.loading = false;
              this.cdr.detectChanges();
            },
            error: () => {
              alert('Error: No se pudo cargar el catálogo de usuarios');
              this.router.navigate(['patients/list']);
            }
          });
        }
      },
      error: () => {
        alert('Error: No se pudo cargar el paciente');
        this.router.navigate(['patients/list']);
      }
    });
  }

  // ─── Form builder ────────────────────────────────────────────────────────────

  buildConfig(mode: FormMode, model: PatientExtended | null, users: User[]): void {
    const userOptions = users
      .filter(user => user.id)
      .map(user => ({
        value: user.id,
        label: user.email || user.id || 'Sin correo'
      }));

    const userDisplayValue = mode === 0 && model?.userInfo
      ? model.userInfo.email ?? model.userId ?? 'Sin información'
      : undefined;

    const userIdValue = mode === 2 && model?.userInfo
      ? model.userInfo.id
      : model?.userId ?? null;

    this.formConfig = {
      mode,
      model: model ? { ...model, userId: userIdValue } : null,
      relatedEntities: this.buildRelatedEntities(mode, model),
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
          label: mode === 0 ? 'Usuario asociado' : 'ID de usuario',
          type: mode === 1 || mode === 2 ? 'select' : 'text',
          placeholder: mode === 1 ? 'Selecciona un usuario'
            : mode === 2  ? 'Selecciona un usuario'
            : userDisplayValue,
          disabled: false,
          validators: mode !== 0 ? [Validators.required] : [],
          options: mode !== 0 ? userOptions : [],
          ...(mode === 0 && { value: userDisplayValue })
        }
      ]
    };
  }

  // ─── Related entities ────────────────────────────────────────────────────────

  private buildRelatedEntities(mode: FormMode, model: PatientExtended | null): RelatedEntityConfig[] {
    if (mode !== 0 || !model) return [];

    const entities: RelatedEntityConfig[] = [];

    if (model.userInfo) {
      entities.push({
        title: 'Información del usuario',
        icon: 'manage_accounts',
        data: { ...model.userInfo, id: model.userId },
        fields: [
          { key: 'id',    label: 'ID',     icon: 'badge' },
          { key: 'name',  label: 'Nombre', icon: 'person' },
          { key: 'email', label: 'Email',  icon: 'email' },
        ]
      });
    }

    return entities;
  }

  // ─── Handlers ────────────────────────────────────────────────────────────────

  handleFormSubmit(data: any): void {
    const mode = this.formConfig.mode;

    if (mode === 1) {
      this.patientService.create(data).subscribe({
        next: () => {
          this.showToast('Paciente creado exitosamente', 'success');
          this.navigateAfterToast();
        },
        error: (error) => {
          console.error('Error al crear paciente:', error);
          this.showToast('Error al crear paciente', 'error');
        }
      });

    } else if (mode === 2) {
      this.patientService.update(Number(data.id), data).subscribe({
        next: () => {
          this.showToast('Paciente actualizado exitosamente', 'success');
          this.navigateAfterToast();
        },
        error: (error) => {
          console.error('Error al actualizar paciente:', error);
          this.showToast('Error al actualizar paciente', 'error');
        }
      });
    }
  }

  handleFormCancel(): void {
    this.router.navigate(['patients/list']);
  }

  // ─── Toast helpers ───────────────────────────────────────────────────────────

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }

  private navigateAfterToast(): void {
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toast.set(null);
      this.router.navigate(['patients/list']);
    }, 1500);
  }
}