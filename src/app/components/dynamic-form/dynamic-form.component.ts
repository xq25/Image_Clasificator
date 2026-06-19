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
  fullWidth?: boolean;
}

export interface DynamicFormConfig {
  mode: 1 | 2 | 3;   // 1=create, 2=update, 3=send
  fields: FieldConfig[];
  model?: any;
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
    MatIconModule,
  ],
  templateUrl: './dynamic-form.component.html',
  styleUrl: './dynamic-form.component.scss',
})
export class DynamicFormComponent implements OnInit {

  @Input() config!: DynamicFormConfig;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formCancel = new EventEmitter<void>();

  form: FormGroup = new FormGroup({});
  previewUrls: Record<string, SafeUrl> = {};

  readonly MODE_CREATE = 1;
  readonly MODE_UPDATE = 2;
  readonly MODE_SEND   = 3;

  constructor(
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    if (!this.config) return;
    this.buildForm();
  }

  // ── Construcción del formulario ───────────────────────────────
  buildForm(): void {
    this.form = this.fb.group({});

    for (const field of this.config.fields) {
      if (field.hidden) continue;
      if (this.config.mode === this.MODE_CREATE && field.name === 'id') continue;

      const initialValue = this.config.model ? (this.config.model[field.name] ?? '') : '';
      const control = this.fb.control(initialValue, field.validators ?? []);

      const shouldDisable =
        this.config.mode === this.MODE_SEND ||
        (this.config.mode === this.MODE_UPDATE && field.name === 'id') ||
        field.disabled === true;

      if (shouldDisable) control.disable();

      this.form.addControl(field.name, control);
    }
  }

  // ── Submit / Cancel ───────────────────────────────────────────
  onSubmit(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    console.log('[DynamicForm] getRawValue:', raw);
    this.formSubmit.emit(raw);
  }

  onCancel(): void {
    this.formCancel.emit();
  }

  // ── Archivos ──────────────────────────────────────────────────
  onFileSelected(event: any, fieldName: string): void {
    const file = event.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    this.previewUrls[fieldName] = this.sanitizer.bypassSecurityTrustUrl(url);
    this.form.get(fieldName)?.setValue(file);
  }

  // ── Utilidades ────────────────────────────────────────────────
  getVisibleFields(): FieldConfig[] {
    return this.config.fields.filter(f => {
      if (f.hidden) return false;
      if (this.config.mode === this.MODE_CREATE && f.name === 'id') return false;
      return true;
    });
  }

  getLabel(field: FieldConfig): string {
    return field.label
      ?? field.name.charAt(0).toUpperCase() + field.name.slice(1).replace(/_/g, ' ');
  }

  getModeTitle(): string {
    if (this.config.mode === this.MODE_CREATE) return 'Crear registro';
    if (this.config.mode === this.MODE_SEND)   return 'Enviar registro';
    return 'Actualizar registro';
  }

  isCreateMode(): boolean { return this.config.mode === this.MODE_CREATE; }
  isUpdateMode(): boolean { return this.config.mode === this.MODE_UPDATE; }
  isModeSend():   boolean { return this.config.mode === this.MODE_SEND;   }
}