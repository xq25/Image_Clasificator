import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';

export interface TableColumn {
  key: string;
  label: string;
}

export interface TableAction {
  label: string;
  class: string;
  action: string;
}

@Component({
  selector: 'app-dynamic-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule],
  templateUrl: './dynamic-table.component.html',
  styleUrl: './dynamic-table.component.scss',
})
export class DynamicTableComponent {
  data = input<any[]>([]);
  columns = input<TableColumn[]>([]);
  actionButtons = input<TableAction[]>([]);

  displayedColumns = signal<string[]>([]);
  columnsToDisplay = signal<string[]>([]);

  actionClicked = output<{ action: string; row: any }>();

  constructor() {
    this.updateColumns();
  }

  ngOnInit() {
    this.updateColumns();
  }

  private updateColumns() {
    const cols = this.columns().map((col) => col.key);
    this.displayedColumns.set(cols);
    this.columnsToDisplay.set(cols);
  }

  addColumn() {
    const newColumn: TableColumn = {
      key: `col_${Date.now()}`,
      label: `Column ${this.columns().length + 1}`,
    };
    const updatedColumns = [...this.columns(), newColumn];
    this.updateColumnsDisplay(updatedColumns);
  }

  removeColumn() {
    if (this.columns().length > 0) {
      const updatedColumns = this.columns().slice(0, -1);
      this.updateColumnsDisplay(updatedColumns);
    }
  }

  shuffle() {
    const shuffled = [...this.displayedColumns()].sort(() => Math.random() - 0.5);
    this.columnsToDisplay.set(shuffled);
  }

  private updateColumnsDisplay(columns: TableColumn[]) {
    const cols = columns.map((col) => col.key);
    this.displayedColumns.set(cols);
    this.columnsToDisplay.set(cols);
  }

  handleAction(action: string, row: any) {
    this.actionClicked.emit({ action, row });
  }
}
