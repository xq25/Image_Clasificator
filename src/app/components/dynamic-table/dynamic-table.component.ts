import { Component, input, output, signal, effect, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

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
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule],
  templateUrl: './dynamic-table.component.html',
  styleUrl: './dynamic-table.component.scss',
})
export class DynamicTableComponent {
  data = input<any[]>([]);
  columns = input<TableColumn[]>([]);
  actionButtons = input<TableAction[]>([]);

  /**
   * Key de la columna que se muestra en móvil como título colapsable.
   * Si no se provee, se usa la primera columna.
   */
  mobileKey = input<string>('');

  displayedColumns = signal<string[]>([]);
  isMobile = signal<boolean>(false);
  expandedRows = signal<Set<any>>(new Set());

  actionClicked = output<{ action: string; row: any }>();

  /** Columna efectiva para móvil */
  effectiveMobileKey = computed(() => {
    const key = this.mobileKey();
    if (key) return key;
    return this.columns()[0]?.key ?? '';
  });

  /** Columnas que se muestran colapsadas en móvil (todas excepto la mobileKey) */
  collapsedColumns = computed(() =>
    this.columns().filter(c => c.key !== this.effectiveMobileKey())
  );

  constructor() {
    this.checkMobile();

    effect(() => {
      const cols = this.columns().map((col) => col.key);
      if (this.actionButtons().length > 0) {
        cols.push('actions');
      }
      this.displayedColumns.set(cols);
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.checkMobile();
  }

  private checkMobile(): void {
    this.isMobile.set(window.innerWidth <= 640);
  }

  toggleRow(row: any): void {
    const current = new Set(this.expandedRows());
    if (current.has(row)) {
      current.delete(row);
    } else {
      current.add(row);
    }
    this.expandedRows.set(current);
  }

  isExpanded(row: any): boolean {
    return this.expandedRows().has(row);
  }

  handleAction(action: string, row: any) {
    this.actionClicked.emit({ action, row });
  }

  getColumnLabel(key: string): string {
    return (
      this.columns().find((col) => col.key === key)?.label ||
      key.charAt(0).toUpperCase() + key.slice(1)
    );
  }
}