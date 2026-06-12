import {
  Component, input, output, signal, effect,
  computed, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

export interface TableColumn {
  key: string;
  label: string;
}

export interface TableAction {
  label?: string;
  class?: string;
  action: string;
  icon?: string;
}

@Component({
  selector: 'app-dynamic-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './dynamic-table.component.html',
  styleUrl: './dynamic-table.component.scss',
})
export class DynamicTableComponent {
  // ── Inputs existentes ──────────────────────────────────────────
  data        = input<any[]>([]);
  columns     = input<TableColumn[]>([]);
  actionButtons = input<TableAction[]>([]);

  /**
   * Key de la columna que se usa como título colapsable en móvil.
   * Si no se provee se usa la primera columna.
   */
  mobileKey = input<string>('');

  // ── Nuevos inputs ──────────────────────────────────────────────
  /** Número de filas por página. 0 = sin paginación. */
  pageSize  = input<number>(0);

  /**
   * Key de la columna sobre la que opera la barra de búsqueda.
   * Si no se provee, la barra no se muestra.
   */
  searchKey = input<string>('');

  // ── Outputs ────────────────────────────────────────────────────
  actionClicked = output<{ action: string; row: any }>();

  // ── Estado interno ─────────────────────────────────────────────
  displayedColumns = signal<string[]>([]);
  isMobile         = signal<boolean>(false);
  expandedRows     = signal<Set<any>>(new Set());

  searchTerm = signal<string>('');
  currentPage = signal<number>(1);

  // ── Computed ───────────────────────────────────────────────────
  effectiveMobileKey = computed(() => {
    const key = this.mobileKey();
    return key ? key : (this.columns()[0]?.key ?? '');
  });

  collapsedColumns = computed(() =>
    this.columns().filter(c => c.key !== this.effectiveMobileKey())
  );

  /** Datos filtrados por búsqueda (sin paginar) */
  filteredData = computed(() => {
    const key  = this.searchKey();
    const term = this.searchTerm().trim().toLowerCase();

    if (!key || !term) return this.data();

    return this.data().filter(row => {
      const value = row[key];
      return value != null &&
        String(value).toLowerCase().includes(term);
    });
  });

  /** Total de páginas */
  totalPages = computed(() => {
    const size = this.pageSize();
    if (!size) return 1;
    return Math.max(1, Math.ceil(this.filteredData().length / size));
  });

  /** Datos de la página actual */
  pagedData = computed(() => {
    const size = this.pageSize();
    if (!size) return this.filteredData();

    const page  = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * size;
    return this.filteredData().slice(start, start + size);
  });

  /** Array de números de página para el paginador */
  pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1)
  );

  constructor() {
    this.checkMobile();

    effect(() => {
      const cols = this.columns().map(col => col.key);
      if (this.actionButtons().length > 0) cols.push('actions');
      this.displayedColumns.set(cols);
    });

    // Volver a la primera página cuando cambia el filtro o los datos
    effect(() => {
      this.filteredData(); // dependencia
      this.currentPage.set(1);
    });
  }

  @HostListener('window:resize')
  onResize() { this.checkMobile(); }

  private checkMobile(): void {
    this.isMobile.set(window.innerWidth <= 640);
  }

  // ── Paginación ─────────────────────────────────────────────────
  goToPage(page: number): void {
    const clamped = Math.max(1, Math.min(page, this.totalPages()));
    this.currentPage.set(clamped);
  }

  prevPage(): void { this.goToPage(this.currentPage() - 1); }
  nextPage(): void { this.goToPage(this.currentPage() + 1); }

  // ── Búsqueda ───────────────────────────────────────────────────
  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  // ── Filas móvil ────────────────────────────────────────────────
  toggleRow(row: any): void {
    const current = new Set(this.expandedRows());
    current.has(row) ? current.delete(row) : current.add(row);
    this.expandedRows.set(current);
  }

  isExpanded(row: any): boolean {
    return this.expandedRows().has(row);
  }

  // ── Acciones ───────────────────────────────────────────────────
  handleAction(action: string, row: any): void {
    this.actionClicked.emit({ action, row });
  }

  // ── Helpers ────────────────────────────────────────────────────
  getColumnLabel(key: string): string {
    return (
      this.columns().find(col => col.key === key)?.label ||
      key.charAt(0).toUpperCase() + key.slice(1)
    );
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2)
      .map(w => w[0].toUpperCase()).join('');
  }

  /** Última fila visible en la página actual */
  pageEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.filteredData().length)
  );

  /** Etiqueta del campo de búsqueda */
  searchLabel = computed(() => {
    const col = this.columns().find(c => c.key === this.searchKey());
    return col ? `Buscar por ${col.label}` : 'Buscar';
  });
}