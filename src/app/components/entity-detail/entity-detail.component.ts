import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

// =========================
// INTERFACES
// =========================

export type FieldValueType = 'text' | 'email' | 'number' | 'date' | 'badge' | 'image' | 'boolean' | 'currency';

export interface BadgeConfig {
  label: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export interface DetailFieldConfig {
  /** Clave del campo en el objeto de datos */
  key: string;
  /** Etiqueta legible */
  label: string;
  /** Icono Material Icons (opcional) */
  icon?: string;
  /** Tipo de visualización */
  type?: FieldValueType;
  /** Transformación opcional del valor crudo */
  transform?: (value: any) => string | BadgeConfig;
  /** Si es true, ocupa el ancho completo de la grilla */
  fullWidth?: boolean;
  /** Si es true, se omite cuando el valor está vacío */
  hideIfEmpty?: boolean;
}

export interface DetailSectionConfig {
  /** Título de la sección */
  title: string;
  /** Icono del header de la sección */
  icon?: string;
  /** Datos de la entidad relacionada */
  data: Record<string, any> | null | undefined;
  /** Campos a mostrar */
  fields: DetailFieldConfig[];
  /** Color de acento del header (opcional, usa primary por defecto) */
  accentColor?: string;
}

export interface EntityDetailConfig {
  /** Título de la cabecera */
  title: string;
  /** Subtítulo opcional (nombre del registro, etc.) */
  subtitle?: string;
  /** Icono en el header */
  icon?: string;
  /** Chip de estado (opcional) */
  statusBadge?: BadgeConfig;
  /** Campos principales de la entidad */
  fields: DetailFieldConfig[];
  /** Datos del registro principal */
  data: Record<string, any>;
  /** Secciones de información adicional / relaciones */
  sections?: DetailSectionConfig[];
  /** Texto del botón de acción principal (opcional) */
  primaryActionLabel?: string;
  /** Icono del botón de acción principal */
  primaryActionIcon?: string;
  /** Texto del botón secundario (opcional) */
  secondaryActionLabel?: string;
  /** Icono del botón secundario */
  secondaryActionIcon?: string;
}

// =========================
// COMPONENT
// =========================

@Component({
  selector: 'app-entity-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './entity-detail.component.html',
  styleUrl: './entity-detail.component.scss'
})
export class EntityDetailComponent implements OnInit {

  @Input() config!: EntityDetailConfig;

  /** Emite cuando el usuario pulsa el botón de acción principal */
  @Output() primaryAction = new EventEmitter<void>();

  /** Emite cuando el usuario pulsa el botón secundario */
  @Output() secondaryAction = new EventEmitter<void>();

  /** Emite cuando el usuario pulsa Volver */
  @Output() back = new EventEmitter<void>();

  /** Estado de colapso por sección */
  private collapsedSections = new Map<string, boolean>();

  ngOnInit(): void {}

  // ── Getters ────────────────────────────────────────────────────

  getVisibleFields(): DetailFieldConfig[] {
    return this.config.fields.filter(f => {
      if (!f.hideIfEmpty) return true;
      const val = this.config.data?.[f.key];
      return val != null && val !== '';
    });
  }

  getVisibleSections(): DetailSectionConfig[] {
    return (this.config.sections ?? []).filter(s => s.data != null);
  }

  getSectionFields(section: DetailSectionConfig): DetailFieldConfig[] {
    return section.fields.filter(f => {
      if (!f.hideIfEmpty) return true;
      const val = section.data?.[f.key];
      return val != null && val !== '';
    });
  }

  // ── Resolución de valores ──────────────────────────────────────

  getFieldValue(data: Record<string, any>, field: DetailFieldConfig): string {
    const raw = data?.[field.key];
    if (raw == null || raw === '') return '—';
    if (field.transform) {
      const result = field.transform(raw);
      if (typeof result === 'string') return result;
      return result.label; // BadgeConfig
    }
    if (field.type === 'date') {
      try { return new Date(raw).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }); }
      catch { return String(raw); }
    }
    if (field.type === 'boolean') return raw ? 'Sí' : 'No';
    if (field.type === 'currency') {
      try { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(raw)); }
      catch { return String(raw); }
    }
    return String(raw);
  }

  getBadge(data: Record<string, any>, field: DetailFieldConfig): BadgeConfig | null {
    if (field.type !== 'badge') return null;
    const raw = data?.[field.key];
    if (raw == null || raw === '') return null;
    if (field.transform) {
      const result = field.transform(raw);
      if (typeof result === 'object') return result as BadgeConfig;
    }
    return { label: String(raw), color: 'neutral' };
  }

  getImageUrl(data: Record<string, any>, field: DetailFieldConfig): string | null {
    if (field.type !== 'image') return null;
    const val = data?.[field.key];
    return val || null;
  }

  // ── Colapso de secciones ───────────────────────────────────────

  toggleSection(title: string): void {
    const current = this.collapsedSections.get(title) ?? false;
    this.collapsedSections.set(title, !current);
  }

  isSectionCollapsed(title: string): boolean {
    return this.collapsedSections.get(title) ?? false;
  }

  // ── Acciones ───────────────────────────────────────────────────

  onBack(): void { this.back.emit(); }
  onPrimaryAction(): void { this.primaryAction.emit(); }
  onSecondaryAction(): void { this.secondaryAction.emit(); }
}
