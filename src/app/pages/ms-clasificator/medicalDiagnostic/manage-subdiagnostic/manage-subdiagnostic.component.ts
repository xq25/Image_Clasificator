import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

import { MedicalDiagnosticService } from '@app/services/ms-clasificator/medical-diagnostic.service';
import { MedicalDiagnostic } from '@app/models/ms-clasificator';

interface Toast { message: string; type: 'success' | 'error'; }

@Component({
  selector: 'app-manage-subdiagnostic',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatCardModule, MatProgressSpinnerModule, MatInputModule, MatFormFieldModule],
  templateUrl: './manage-subdiagnostic.component.html',
  styleUrl: './manage-subdiagnostic.component.scss',
})
export class ManageSubDiagnosticComponent implements OnInit {

  parentId!: string;

  parent = signal<MedicalDiagnostic | null>(null);
  subDiagnostics = signal<MedicalDiagnostic[]>([]);
  allDiagnostics = signal<MedicalDiagnostic[]>([]);

  loadingSubs = signal(true);
  loadingAvailable = signal(true);

  removingId = signal<string | null>(null);
  addingId = signal<string | null>(null);

  searchQuery = signal('');
  toast = signal<Toast | null>(null);
  private toastTimer: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private medicalDiagnosticService: MedicalDiagnosticService
  ) {}

  ngOnInit(): void {
    this.parentId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadParent();
    this.loadSubs();
    this.loadAll();
  }

  loadParent(): void {
    this.medicalDiagnosticService.findById(Number(this.parentId)).subscribe({
      next: (res) => this.parent.set(res?.data ?? null),
      error: () => this.showToast('Error al cargar diagnóstico padre', 'error')
    });
  }

  loadSubs(): void {
    this.loadingSubs.set(true);
    this.medicalDiagnosticService.findByParentId(Number(this.parentId)).subscribe({
      next: (res: any) => {
        const subs: MedicalDiagnostic[] = Array.isArray(res)
          ? res
          : (res?.data ?? res?.content ?? []);
        this.subDiagnostics.set(subs);
        this.loadingSubs.set(false);
      },
      error: (err) => { console.error('Error cargando sub-diagnósticos:', err); this.showToast('Error al cargar sub-diagnósticos', 'error'); this.loadingSubs.set(false); }
    });
  }

  loadAll(): void {
    this.loadingAvailable.set(true);
    this.medicalDiagnosticService.findAll().subscribe({
      next: (data) => { this.allDiagnostics.set(data); this.loadingAvailable.set(false); },
      error: (err) => { console.error('Error cargando diagnósticos disponibles:', err); this.showToast('Error al cargar diagnósticos', 'error'); this.loadingAvailable.set(false); }
    });
  }

  assign(sub: MedicalDiagnostic): void {
    if (!sub.id) {
      this.showToast('No se pudo determinar el ID del sub-diagnóstico', 'error');
      return;
    }

    if (this.hasSub(sub)) return;
    this.addingId.set(sub.id!.toString());
    this.medicalDiagnosticService.addSubDiagnostic(Number(this.parentId), Number(sub.id)).subscribe({
      next: () => { this.showToast(`Sub-diagnóstico "${sub.diagnosticCode}" asignado`, 'success'); this.addingId.set(null); this.loadSubs(); },
      error: (err) => { console.error('Error asignando sub-diagnóstico:', err); this.showToast('Error al asignar sub-diagnóstico', 'error'); this.addingId.set(null); }
    });
  }

  remove(sub: MedicalDiagnostic): void {
    if (!sub.id) {
      this.showToast('No se pudo determinar el ID del sub-diagnóstico', 'error');
      return;
    }

    if (!confirm(`¿Desasignar sub-diagnóstico "${sub.diagnosticCode}"?`)) return;
    this.removingId.set(sub.id!.toString());
    this.medicalDiagnosticService.removeSubDiagnostic(Number(this.parentId), Number(sub.id)).subscribe({
      next: () => { this.showToast(`Sub-diagnóstico "${sub.diagnosticCode}" removido`, 'success'); this.removingId.set(null); this.loadSubs(); },
      error: (err) => { console.error('Error removiendo sub-diagnóstico:', err); this.showToast('Error al remover sub-diagnóstico', 'error'); this.removingId.set(null); }
    });
  }

  onAssign(event: Event, sub: MedicalDiagnostic): void {
    event.preventDefault();
    event.stopPropagation();
    this.assign(sub);
  }

  onRemove(event: Event, sub: MedicalDiagnostic): void {
    event.preventDefault();
    event.stopPropagation();
    this.remove(sub);
  }

  hasSub(sub: MedicalDiagnostic): boolean { return this.subDiagnostics().some(s => s.id === sub.id); }

  getAvailable = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    return this.allDiagnostics().filter(d => !this.hasSub(d) && (!q || d.diagnosticCode?.toLowerCase().includes(q) || d.diagnosticName?.toLowerCase().includes(q)));
  });

  goBack(): void { this.router.navigate(['medical-diagnostics/list']); }

  private showToast(message: string, type: 'success' | 'error') { this.toast.set({ message, type }); clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => this.toast.set(null), 3000); }
}
