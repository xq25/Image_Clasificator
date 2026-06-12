import {
  Component,
  Input,
  OnInit,
  OnChanges,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable } from 'rxjs';

export interface AssociationConfig<T> {
  /** Clave del objeto que actúa como identificador único */
  idKey: keyof T;
  /** Clave del objeto que se muestra como etiqueta principal */
  labelKey: keyof T;
  /** Clave del objeto que se muestra como descripción secundaria (opcional) */
  descriptionKey?: keyof T;
  /** Icono Material para ítems ya asociados */
  associatedIcon?: string;
  /** Icono Material para ítems disponibles */
  availableIcon?: string;
  /** Título del panel izquierdo (asociados) */
  associatedPanelTitle?: string;
  /** Título del panel derecho (disponibles) */
  availablePanelTitle?: string;
  /** Placeholder del buscador */
  searchPlaceholder?: string;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-entity-association',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
  ],
  templateUrl: './entity-association.component.html',
  styleUrl: './entity-association.component.scss',
})
export class EntityAssociationComponent<T extends Record<string, any>>
  implements OnInit, OnChanges
{
  // ─── INPUTS ────────────────────────────────────────────────────────────────

  /** Todos los ítems posibles (universo completo) */
  @Input({ required: true }) allItems: T[] = [];

  /** Ítems ya asociados */
  @Input({ required: true }) associatedItems: T[] = [];

  /** Configuración de claves y etiquetas */
  @Input({ required: true }) config!: AssociationConfig<T>;

  /** Indica si se están cargando los ítems asociados */
  @Input() loadingAssociated = false;

  /** Indica si se están cargando todos los ítems */
  @Input() loadingAll = false;

  /**
   * Callback para asociar un ítem.
   * Debe retornar un Observable que emita al completarse.
   */
  @Input({ required: true }) onAssociate!: (item: T) => Observable<any>;

  /**
   * Callback para desasociar un ítem.
   * Debe retornar un Observable que emita al completarse.
   */
  @Input({ required: true }) onDisassociate!: (item: T) => Observable<any>;

  // ─── STATE ─────────────────────────────────────────────────────────────────

  searchQuery = signal('');
  processingId = signal<any>(null);
  toast = signal<Toast | null>(null);

  protected _associated = signal<T[]>([]);
  private _all = signal<T[]>([]);

  private toastTimer: any;

  // ─── LIFECYCLE ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this._associated.set(this.associatedItems);
    this._all.set(this.allItems);
  }

  ngOnChanges(): void {
    this._associated.set(this.associatedItems);
    this._all.set(this.allItems);
  }

  // ─── COMPUTED ──────────────────────────────────────────────────────────────

  availableItems = computed(() => {
    const associatedIds = new Set(
      this._associated().map((item) => item[this.config.idKey])
    );
    const query = this.searchQuery().toLowerCase();
    return this._all().filter((item) => {
      const isAssociated = associatedIds.has(item[this.config.idKey]);
      const label = String(item[this.config.labelKey] ?? '').toLowerCase();
      return !isAssociated && (!query || label.includes(query));
    });
  });

  // ─── ACCIONES ──────────────────────────────────────────────────────────────

  associate(item: T): void {
    const id = item[this.config.idKey];
    if (this.processingId() === id) return;

    this.processingId.set(id);

    this.onAssociate(item).subscribe({
      next: () => {
        this._associated.update((list) => [...list, item]);
        this.showToast(
          `"${item[this.config.labelKey]}" asociado exitosamente`,
          'success'
        );
        this.processingId.set(null);
      },
      error: () => {
        this.showToast(
          `Error al asociar "${item[this.config.labelKey]}"`,
          'error'
        );
        this.processingId.set(null);
      },
    });
  }

  disassociate(item: T): void {
    const id = item[this.config.idKey];
    if (this.processingId() === id) return;

    const label = item[this.config.labelKey];
    if (!confirm(`¿Desasociar "${label}"?`)) return;

    this.processingId.set(id);

    this.onDisassociate(item).subscribe({
      next: () => {
        this._associated.update((list) =>
          list.filter((i) => i[this.config.idKey] !== id)
        );
        this.showToast(`"${label}" desasociado exitosamente`, 'success');
        this.processingId.set(null);
      },
      error: () => {
        this.showToast(`Error al desasociar "${label}"`, 'error');
        this.processingId.set(null);
      },
    });
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────────

  getLabel(item: T): string {
    return String(item[this.config.labelKey] ?? '');
  }

  getDescription(item: T): string {
    if (!this.config.descriptionKey) return '';
    return String(item[this.config.descriptionKey] ?? '');
  }

  getId(item: T): any {
    return item[this.config.idKey];
  }

  get associatedPanelTitle(): string {
    return this.config.associatedPanelTitle ?? 'Asociados';
  }

  get availablePanelTitle(): string {
    return this.config.availablePanelTitle ?? 'Disponibles';
  }

  get associatedIcon(): string {
    return this.config.associatedIcon ?? 'link';
  }

  get availableIcon(): string {
    return this.config.availableIcon ?? 'add_link';
  }

  get searchPlaceholder(): string {
    return this.config.searchPlaceholder ?? 'Buscar...';
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }
}
