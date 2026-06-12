import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DynamicFormComponent, DynamicFormConfig, RelatedEntityConfig } from '@app/components/dynamic-form/dynamic-form.component';
import { DoctorService } from '@app/services/ms-clasificator/doctor.service';
import { UserService } from '@app/services/ms-security/user-service';
import { DoctorExtended } from '@app/models/ms-clasificator/Doctor/Doctor';
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
    private doctorService: DoctorService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const routePath = this.route.snapshot.routeConfig?.path ?? '';
    const id = this.route.snapshot.paramMap.get('id');

    if (routePath === 'create') {
      this.loadCreateForm();

    } else if (routePath === 'view/:id' && id) {
      this.loadDoctorForm(id, 0);

    } else if (routePath === 'edit/:id' && id) {
      this.loadDoctorForm(id, 2);

    } else {
      console.warn('[ManageComponent] Ruta no reconocida:', routePath);
      this.router.navigate(['doctors/list']);
    }
  }

  // ─── Loaders ────────────────────────────────────────────────────────────────

  /**
   * Modo CREATE (mode=1): solo necesitamos el catálogo de usuarios.
   */
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
        this.router.navigate(['doctors/list']);
      }
    });
  }

  /**
   * Modo VIEW (mode=0) y EDIT (mode=2): cargamos el doctor.
   * - En VIEW, usamos userInfo del doctor para mostrar datos legibles.
   * - En EDIT, necesitamos además el catálogo de usuarios para el select.
   */
  private loadDoctorForm(id: string, mode: Extract<FormMode, 0 | 2>): void {
    this.loading = true;

    this.doctorService.findById(Number(id)).subscribe({
      next: (response) => {
        const doctor: DoctorExtended | null = response?.data ?? null;

        if (!doctor) {
          alert('Error: No se pudo cargar el doctor');
          this.router.navigate(['doctors/list']);
          return;
        }

        if (mode === 0) {
          // VIEW: userInfo ya viene en el doctor, no hace falta cargar usuarios
          this.buildConfig(0, doctor, []);
          this.loading = false;
          this.cdr.detectChanges();

        } else {
          // EDIT: necesitamos el catálogo para poblar el select
          this.userService.getUsers().subscribe({
            next: (userResponse) => {
              const users: User[] = userResponse.data ?? [];
              this.buildConfig(2, doctor, users);
              this.loading = false;
              this.cdr.detectChanges();
            },
            error: () => {
              alert('Error: No se pudo cargar el catálogo de usuarios');
              this.router.navigate(['doctors/list']);
            }
          });
        }
      },
      error: () => {
        alert('Error: No se pudo cargar el doctor');
        this.router.navigate(['doctors/list']);
      }
    });
  }

  // ─── Form builder ────────────────────────────────────────────────────────────

  buildConfig(mode: FormMode, model: DoctorExtended | null, users: User[]): void {

    // Opciones del select: se usan en CREATE y EDIT
    const userOptions = users
      .filter(user => user.id)
      .map(user => ({
        value: user.id,
        label: user.email || user.id || 'Sin correo'
      }));

    // En VIEW mostramos el email (o nombre) proveniente de userInfo
    const userDisplayValue = mode === 0 && model?.userInfo
      ? model.userInfo.email ?? model.userInfo.id ?? 'Sin información'
      : undefined;

    // En EDIT pre-seleccionamos el usuario actual desde userInfo
    const userIdValue = mode === 2 && model?.userInfo
      ? model.userInfo.id
      : model?.userId ?? null;

    this.formConfig = {
      mode,
      // Sobreescribimos userId para que el form refleje el valor correcto
      model: model ? { ...model, userId: userIdValue } : null,
      // Tarjetas de info relacionada: solo se renderizan en VIEW (mode=0)
      relatedEntities: this.buildRelatedEntities(mode, model),
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
          // En VIEW: campo de texto con el valor legible del userInfo
          // En CREATE / EDIT: select con el catálogo de usuarios
          name: 'userId',
          label: mode === 0 ? 'Usuario asociado' : 'ID de usuario',
          type: mode === 1 || mode === 2 ? 'select' : 'text',
          placeholder: mode === 1
            ? 'Selecciona un usuario'
            : mode === 2
              ? 'Selecciona un usuario'
              : userDisplayValue,
          disabled: false,          // En EDIT el usuario SÍ puede cambiarse si se requiere;
                                    // cámbialo a `mode === 0` si quieres bloquearlo en view.
          validators: mode !== 0 ? [Validators.required] : [],
          options: mode !== 0 ? userOptions : [],
          ...(mode === 0 && { value: userDisplayValue })   // valor legible solo en VIEW
        }
      ]
    };
  }

  // ─── Handlers ────────────────────────────────────────────────────────────────

  handleFormSubmit(data: any): void {
    const mode = this.formConfig.mode;

    if (mode === 1) {
      this.doctorService.create(data).subscribe({
        next: (response) => {
          console.log(response);
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

  /**
   * Construye las tarjetas de entidades relacionadas para el modo VIEW.
   * Añade aquí tantas entidades como el modelo traiga consigo.
   */
  private buildRelatedEntities(mode: FormMode, model: DoctorExtended | null): RelatedEntityConfig[] {
    if (mode !== 0 || !model) return [];

    const entities: RelatedEntityConfig[] = [];

    // ── Información del usuario asociado ──────────────────────
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

    // ── Si en el futuro el modelo trae más entidades anidadas,
    //    agrégalas aquí con el mismo patrón. ──────────────────

    return entities;
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
      this.router.navigate(['doctors/list']);
    }, 1500);
  }
}