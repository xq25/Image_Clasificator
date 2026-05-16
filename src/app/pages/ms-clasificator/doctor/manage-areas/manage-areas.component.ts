import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

import { DoctorAreaService } from '@app/services/ms-clasificator/doctor-area.service';
import { EvaluationAreaService } from '@app/services/ms-clasificator/evaluation-area.service';
import { DoctorService } from '@app/services/ms-clasificator/doctor.service';
import { Doctor, DoctorArea, EvaluationArea } from '@app/models/ms-clasificator';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-manage-areas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './manage-areas.component.html',
  styleUrl: './manage-areas.component.scss',
})
export class ManageAreasComponent implements OnInit {

  doctorId!: string;

  doctor = signal<Doctor | null>(null);
  doctorAreaRelations = signal<DoctorArea[]>([]);
  doctorAreas = signal<EvaluationArea[]>([]);
  allAreas = signal<EvaluationArea[]>([]);

  loadingDoctorAreas = signal(true);
  loadingAvailableAreas = signal(true);

  removingAreaId = signal<string | null>(null);
  addingAreaId = signal<string | null>(null);

  searchQuery = signal('');
  toast = signal<Toast | null>(null);

  private toastTimer: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private doctorAreaService: DoctorAreaService,
    private doctorService: DoctorService,
    private evaluationAreaService: EvaluationAreaService,
  ) {}

  ngOnInit(): void {
    this.doctorId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadDoctor();
    this.loadDoctorAreas();
    this.loadAllAreas();
  }

  loadDoctor(): void {
    this.doctorService.findById(Number(this.doctorId)).subscribe({
      next: (response) => this.doctor.set(response?.data ?? null),
      error: () => this.showToast('Error al cargar el doctor', 'error'),
    });
  }

  loadDoctorAreas(): void {
    this.loadingDoctorAreas.set(true);

    this.doctorAreaService.findByDoctorId(Number(this.doctorId)).subscribe({
      next: (data: any) => {
        const relations: DoctorArea[] = Array.isArray(data)
          ? data
          : (data?.content ?? data?.data ?? []);

        const safeRelations = relations.filter(da => da?.evaluationArea?.id);

        this.doctorAreaRelations.set(safeRelations);
        this.doctorAreas.set(safeRelations.map(da => da.evaluationArea));

        this.loadingDoctorAreas.set(false);
      },
      error: (err) => {
        console.error('Error cargando áreas del doctor:', err);
        this.showToast('Error al cargar las áreas del doctor', 'error');
        this.loadingDoctorAreas.set(false);
      },
    });
  }

  loadAllAreas(): void {
    this.loadingAvailableAreas.set(true);

    this.evaluationAreaService.findAll().subscribe({
      next: (areas: EvaluationArea[]) => {
        this.allAreas.set(areas);
        this.loadingAvailableAreas.set(false);
      },
      error: (err) => {
        console.error('Error cargando áreas disponibles:', err);
        this.showToast('Error al cargar áreas disponibles', 'error');
        this.loadingAvailableAreas.set(false);
      },
    });
  }

  assignArea(area: EvaluationArea): void {
    if (this.hasArea(area)) return;

    this.addingAreaId.set(area.id!.toString());

    this.doctorAreaService.create({
      doctor: { id: Number(this.doctorId) } as Doctor,
      evaluationArea: { id: area.id } as EvaluationArea,
    } as Partial<DoctorArea>).subscribe({
      next: () => {
        this.showToast(`Área "${area.name}" asignada exitosamente`, 'success');
        this.addingAreaId.set(null);
        this.loadDoctorAreas();
      },
      error: (err) => {
        console.error('Error asignando área:', err);
        this.showToast(`Error al asignar el área "${area.name}"`, 'error');
        this.addingAreaId.set(null);
      },
    });
  }

  removeArea(area: EvaluationArea): void {
    if (!confirm(`¿Desasignar el área "${area.name}"?`)) return;

    const doctorArea = this.doctorAreaRelations().find(
      da => da.evaluationArea.id === area.id
    );

    if (!doctorArea || !doctorArea.id) {
      this.showToast('No se pudo encontrar la relación del área', 'error');
      return;
    }

    this.removingAreaId.set(area.id!.toString());

    this.doctorAreaService.deleteByDoctorAndArea(Number(this.doctorId), Number(area.id)).subscribe({
      next: () => {
        this.showToast(`Área "${area.name}" eliminada exitosamente`, 'success');
        this.removingAreaId.set(null);
        this.loadDoctorAreas();
      },
      error: (err) => {
        console.error('Error eliminando área:', err);
        this.showToast(`Error al eliminar el área "${area.name}"`, 'error');
        this.removingAreaId.set(null);
      },
    });
  }

  hasArea(area: EvaluationArea): boolean {
    return this.doctorAreas().some(a => a.id === area.id);
  }

  getAvailableAreas = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();

    return this.allAreas().filter(
      area => !this.hasArea(area) && (
        !query ||
        area.name?.toLowerCase().includes(query) ||
        area.codeArea?.toLowerCase().includes(query)
      )
    );
  });

  getDoctorInitials(): string {
    const code = this.doctor()?.code ?? this.doctor()?.userId ?? '';
    return code
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  goBack(): void {
    this.router.navigate(['../list'], { relativeTo: this.route });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(
      () => this.toast.set(null),
      3000
    );
  }
}