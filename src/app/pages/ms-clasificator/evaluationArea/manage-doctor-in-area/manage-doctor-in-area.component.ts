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
  selector: 'app-manage-doctor-in-area',
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
  templateUrl: './manage-doctor-in-area.component.html',
  styleUrl: './manage-doctor-in-area.component.scss',
})
export class ManageDoctorInAreaComponent implements OnInit {

  evaluationAreaId!: string;

  evaluationArea = signal<EvaluationArea | null>(null);
  doctorAreaRelations = signal<DoctorArea[]>([]);
  doctorsInArea = signal<Doctor[]>([]);
  allDoctors = signal<Doctor[]>([]);

  loadingDoctorsInArea = signal(true);
  loadingAvailableDoctors = signal(true);

  removingDoctorId = signal<string | null>(null);
  addingDoctorId = signal<string | null>(null);

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
    this.evaluationAreaId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadEvaluationArea();
    this.loadDoctorsInArea();
    this.loadAllDoctors();
  }

  loadEvaluationArea(): void {
    this.evaluationAreaService.findById(Number(this.evaluationAreaId)).subscribe({
      next: (response) => this.evaluationArea.set(response?.data ?? null),
      error: () => this.showToast('Error al cargar el área de evaluación', 'error'),
    });
  }

  loadDoctorsInArea(): void {
    this.loadingDoctorsInArea.set(true);

    this.doctorAreaService.findByEvaluationAreaId(Number(this.evaluationAreaId)).subscribe({
      next: (data: any) => {
        const relations: DoctorArea[] = Array.isArray(data)
          ? data
          : (data?.content ?? data?.data ?? []);

        const safeRelations = relations.filter(da => da?.doctor?.id);

        this.doctorAreaRelations.set(safeRelations);
        this.doctorsInArea.set(safeRelations.map(da => da.doctor));

        this.loadingDoctorsInArea.set(false);
      },
      error: (err) => {
        console.error('Error cargando doctores del área:', err);
        this.showToast('Error al cargar los doctores del área', 'error');
        this.loadingDoctorsInArea.set(false);
      },
    });
  }

  loadAllDoctors(): void {
    this.loadingAvailableDoctors.set(true);

    this.doctorService.findAll().subscribe({
      next: (doctors: Doctor[]) => {
        this.allDoctors.set(doctors);
        this.loadingAvailableDoctors.set(false);
      },
      error: (err) => {
        console.error('Error cargando doctores disponibles:', err);
        this.showToast('Error al cargar doctores disponibles', 'error');
        this.loadingAvailableDoctors.set(false);
      },
    });
  }

  assignDoctor(doctor: Doctor): void {
    if (this.hasDoctor(doctor)) return;

    this.addingDoctorId.set(doctor.id!.toString());

    this.doctorAreaService.create({
      doctor: { id: doctor.id } as Doctor,
      evaluationArea: { id: Number(this.evaluationAreaId) } as EvaluationArea,
    } as Partial<DoctorArea>).subscribe({
      next: () => {
        this.showToast(`Doctor "${doctor.code}" asignado exitosamente`, 'success');
        this.addingDoctorId.set(null);
        this.loadDoctorsInArea();
      },
      error: (err) => {
        console.error('Error asignando doctor:', err);
        this.showToast(`Error al asignar el doctor "${doctor.code}"`, 'error');
        this.addingDoctorId.set(null);
      },
    });
  }

  removeDoctor(doctor: Doctor): void {
    if (!confirm(`¿Desasignar el doctor "${doctor.code}"?`)) return;

    const doctorArea = this.doctorAreaRelations().find(
      da => da.doctor.id === doctor.id
    );

    if (!doctorArea || !doctorArea.id) {
      this.showToast('No se pudo encontrar la relación del doctor', 'error');
      return;
    }

    this.removingDoctorId.set(doctor.id!.toString());

    this.doctorAreaService.deleteByDoctorAndArea(Number(doctor.id), Number(this.evaluationAreaId)).subscribe({
      next: () => {
        this.showToast(`Doctor "${doctor.code}" eliminado exitosamente`, 'success');
        this.removingDoctorId.set(null);
        this.loadDoctorsInArea();
      },
      error: (err) => {
        console.error('Error eliminando doctor:', err);
        this.showToast(`Error al eliminar el doctor "${doctor.code}"`, 'error');
        this.removingDoctorId.set(null);
      },
    });
  }

  hasDoctor(doctor: Doctor): boolean {
    return this.doctorsInArea().some(d => d.id === doctor.id);
  }

  getAvailableDoctors = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();

    return this.allDoctors().filter(
      doctor => !this.hasDoctor(doctor) && (
        !query ||
        doctor.code?.toLowerCase().includes(query) ||
        doctor.userId?.toLowerCase().includes(query)
      )
    );
  });

  getEvaluationAreaLabel(): string {
    return this.evaluationArea()?.name ?? this.evaluationArea()?.codeArea ?? 'Cargando...';
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