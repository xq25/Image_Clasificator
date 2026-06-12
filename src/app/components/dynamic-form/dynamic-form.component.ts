import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, ValidatorFn } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

// =========================
// INTERFACES
// =========================

export interface FieldConfig {
  name: string;
  label?: string;
  type?: 'text' | 'email' | 'number' | 'password' | 'date' | 'select' | 'file' | 'textarea';
  options?: { value: any; label: string }[];
  validators?: ValidatorFn[];
  disabled?: boolean;
  hidden?: boolean;
  placeholder?: string;
}

/**
 * Define un campo dentro de una entidad relacionada que se
 * mostrará en modo VIEW como tarjeta de solo lectura.
 */
export interface RelatedFieldConfig {
  /** Clave en el objeto de la entidad relacionada */
  key: string;
  /** Etiqueta legible del campo */
  label: string;
  /** Icono de Material Icons para el campo (opcional) */
  icon?: string;
  /** Transformación opcional del valor antes de mostrarlo */
  transform?: (value: any) => string;
}

/**
 * Describe una entidad relacionada que se presenta como una
 * tarjeta informativa adicional solo en modo VIEW (mode=0).
 * Se admiten múltiples entidades relacionadas por formulario.
 */
export interface RelatedEntityConfig {
  /** Título de la tarjeta (p.ej. "Información del usuario") */
  title: string;
  /** Icono Material Icons para el header de la tarjeta (opcional) */
  icon?: string;
  /**
   * Objeto con los datos de la entidad relacionada.
   * Si es null/undefined la tarjeta no se renderiza.
   */
  data: Record<string, any> | null | undefined;
  /** Campos que se deben mostrar dentro de la tarjeta */
  fields: RelatedFieldConfig[];
}

export interface DynamicFormConfig {
  mode: 0 | 1 | 2 | 3;   // 0=view, 1=create, 2=update, 3=send
  fields: FieldConfig[];
  model?: any;
  /**
   * Entidades relacionadas opcionales. Solo se renderizan en mode=0 (VIEW).
   * Permite una o múltiples tarjetas de información adicional.
   */
  relatedEntities?: RelatedEntityConfig[];
}

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  templateUrl: './dynamic-form.component.html',
  styleUrl: './dynamic-form.component.scss'
})
export class DynamicFormComponent implements OnInit {

  @Input() config!: DynamicFormConfig;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formCancel = new EventEmitter<void>();

  form: FormGroup = new FormGroup({});
  previewUrls: Record<string, SafeUrl> = {};

  /** Controla qué tarjetas están colapsadas. Clave = title de la entidad. */
  private collapsedEntities = new Map<string, boolean>();

  readonly MODE_VIEW   = 0;
  readonly MODE_CREATE = 1;
  readonly MODE_UPDATE = 2;
  readonly MODE_SEND   = 3;

  constructor(
    private fb: FormBuilder,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    if (!this.config) return;
    this.buildForm();
  }

  // CONSTRUIR FORMULARIO
  buildForm(): void {
    this.form = this.fb.group({});

    for (const field of this.config.fields) {
      if (field.hidden) continue;
      if (this.config.mode === this.MODE_CREATE && field.name === 'id') continue;

      const initialValue = this.config.model ? (this.config.model[field.name] ?? '') : '';
      const control = this.fb.control(initialValue, field.validators || []);

      const shouldDisable =
        this.config.mode === this.MODE_VIEW ||
        this.config.mode === this.MODE_SEND ||
        (this.config.mode === this.MODE_UPDATE && field.name === 'id') ||
        field.disabled === true;

      if (shouldDisable) control.disable();

      this.form.addControl(field.name, control);
    }
  }

  // SUBMIT
  onSubmit(): void {
    if (this.form.invalid) return;
    this.formSubmit.emit(this.form.getRawValue());
  }

  // CANCELAR / VOLVER
  onCancel(): void {
    this.formCancel.emit();
  }

  // MANEJO DE ARCHIVOS
  onFileSelected(event: any, fieldName: string): void {
    const file = event.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    this.previewUrls[fieldName] = this.sanitizer.bypassSecurityTrustUrl(url);
    this.form.get(fieldName)?.setValue(file);
  }

  // UTILIDADES
  getVisibleFields(): FieldConfig[] {
    return this.config.fields.filter(f => {
      if (f.hidden) return false;
      if (this.config.mode === this.MODE_CREATE && f.name === 'id') return false;
      return true;
    });
  }

  getLabel(field: FieldConfig): string {
    return field.label || field.name.charAt(0).toUpperCase() + field.name.slice(1).replace(/_/g, ' ');
  }

  getModeTitle(): string {
    if (this.config.mode === this.MODE_VIEW)   return 'Detalle del registro';
    if (this.config.mode === this.MODE_CREATE) return 'Crear registro';
    if (this.config.mode === this.MODE_SEND)   return 'Enviar registro';
    return 'Actualizar registro';
  }

  isViewMode():   boolean { return this.config.mode === this.MODE_VIEW; }
  isCreateMode(): boolean { return this.config.mode === this.MODE_CREATE; }
  isUpdateMode(): boolean { return this.config.mode === this.MODE_UPDATE; }
  isModeSend():   boolean { return this.config.mode === this.MODE_SEND; }

  /**
   * Devuelve las entidades relacionadas que tienen datos disponibles.
   * Solo aplica en modo VIEW; en cualquier otro modo retorna [].
   * Inicializa el estado de colapso la primera vez que se llama.
   */
  getRelatedEntities(): RelatedEntityConfig[] {
    if (!this.isViewMode()) return [];
    const entities = (this.config.relatedEntities ?? []).filter(e => e.data != null);

    // Inicializa solo las entidades que aún no tienen estado registrado
    for (const entity of entities) {
      if (!this.collapsedEntities.has(entity.title)) {
        this.collapsedEntities.set(entity.title, false); // expandida por defecto
      }
    }

    return entities;
  }

  /** Alterna el estado colapsado/expandido de una tarjeta. */
  toggleEntity(title: string): void {
    this.collapsedEntities.set(title, !this.collapsedEntities.get(title));
  }

  /** Indica si una tarjeta está actualmente colapsada. */
  isEntityCollapsed(title: string): boolean {
    return this.collapsedEntities.get(title) ?? false;
  }

  /**
   * Resuelve el valor de un campo dentro de la entidad relacionada,
   * aplicando la transformación si fue definida.
   */
  getRelatedFieldValue(entity: RelatedEntityConfig, field: RelatedFieldConfig): string {
    const raw = entity.data?.[field.key];
    if (raw == null || raw === '') return '—';
    return field.transform ? field.transform(raw) : String(raw);
  }
}