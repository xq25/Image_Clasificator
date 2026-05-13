import { Component, input, output, signal, effect } from '@angular/core';
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

  displayedColumns = signal<string[]>([]);

  actionClicked = output<{ action: string; row: any }>();

  constructor() {
    effect(() => {
      const cols = this.columns().map((col) => col.key);
      if (this.actionButtons().length > 0) {
        cols.push('actions');
      }
      this.displayedColumns.set(cols);
    });
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
