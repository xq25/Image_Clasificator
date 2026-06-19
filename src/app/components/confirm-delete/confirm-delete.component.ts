import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-delete',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './confirm-delete.component.html',
  styleUrl: './confirm-delete.component.scss',
})
export class ConfirmDeleteComponent {
  title = input<string>('Eliminar elemento');
  message = input<string>('¿Está seguro que desea eliminar este elemento?');
  subMessage = input<string>('Esta acción no se puede deshacer y se eliminarán todos los registros asociados.');
  confirmLabel = input<string>('Eliminar');
  cancelLabel = input<string>('Cancelar');

  confirmed = output<void>();
  cancelled = output<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
