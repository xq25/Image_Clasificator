import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { DynamicTableComponent, TableAction, TableColumn } from '@app/components/dynamic-table/dynamic-table.component';
import { EvaluationArea, MedicalImg, Patient } from '@app/models/ms-clasificator';
import { EvaluationAreaService } from '@app/services/ms-clasificator/evaluation-area.service';
import { MedicalImageService } from '@app/services/ms-clasificator/medical-image.service';
import { PatientService } from '@app/services/ms-clasificator/patient.service';

type MedicalImageRow = MedicalImg & {
  evaluationAreaLabel: string;
  patientLabel: string;
  createdAtLabel: string;
};

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, DynamicTableComponent, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class ListComponent {

  private initialPath = '/medical-images';
  images = signal<MedicalImageRow[]>([]);
  loading = signal(true);

  private evaluationAreas: EvaluationArea[] = [];
  private patients: Patient[] = [];

  columns: TableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'imageKey', label: 'Clave' },
    { key: 'evaluationAreaLabel', label: 'Área de evaluación' },
    { key: 'patientLabel', label: 'Paciente' },
    { key: 'provider', label: 'Proveedor' },
    { key: 'createdAtLabel', label: 'Creada' }
  ];

  actionButtons: TableAction[] = [
    { action: 'view', icon: 'visibility', class: 'btn-view' },
    { action: 'assignPatient', icon: 'person_add', class: 'btn-assign' },
    { action: 'changeArea', icon: 'swap_horiz', class: 'btn-change-area' },
    { action: 'delete', icon: 'delete', class: 'btn-delete' },
  ];

  constructor(
    private router: Router,
    private medicalImageService: MedicalImageService,
    private evaluationAreaService: EvaluationAreaService,
    private patientService: PatientService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    this.evaluationAreaService.findAll().subscribe({
      next: (areas) => {
        this.evaluationAreas = areas ?? [];
        this.loadPatients();
      },
      error: (error) => {
        console.error('Error al cargar áreas de evaluación:', error);
        this.evaluationAreas = [];
        this.loadPatients();
      }
    });
  }

  loadPatients(): void {
    this.patientService.findAll().subscribe({
      next: (patients) => {
        this.patients = patients ?? [];
        this.loadImages();
      },
      error: (error) => {
        console.error('Error al cargar pacientes:', error);
        this.patients = [];
        this.loadImages();
      }
    });
  }

  loadImages(): void {
    this.medicalImageService.findAll().subscribe({
      next: (response) => {
        const images = response?.data ?? [];

        this.images.set(
          images.map(image => ({
            ...image,
            evaluationAreaLabel: this.getEvaluationAreaLabel(image.evaluationAreaId),
            patientLabel: this.getPatientLabel(image.patientId),
            createdAtLabel: this.formatDate(image.createdAt),
          }))
        );
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar imágenes médicas:', error);
        this.images.set([]);
        this.loading.set(false);
      }
    });
  }

  handleAction(event: any): void {
    const { action, row } = event;

    switch (action) {
      case 'view':
        this.view(row.id);
        break;
      case 'assignPatient':
        this.router.navigate([`${this.initialPath}/assign-patient/${row.id}`]);
        break;
      case 'changeArea':
        this.router.navigate([`${this.initialPath}/change-area/${row.id}`]);
        break;
      case 'delete':
        this.delete(row.id);
        break;
    }
  }

  view(imageId: string): void {
    this.router.navigate([`${this.initialPath}/view/${imageId}`]);
  }

  create(): void {
    this.router.navigate([`${this.initialPath}/create`]);
  }

  delete(imageId: string): void {
    if (!confirm('¿Estás seguro de que quieres eliminar esta imagen médica?')) return;

    this.medicalImageService.delete(Number(imageId)).subscribe({
      next: () => this.loadImages(),
      error: (error) => console.error('Error al eliminar imagen médica:', error)
    });
  }

  getEvaluationAreaLabel(evaluationAreaId?: number): string {
    if (evaluationAreaId == null) {
      return 'Sin área';
    }

    const area = this.evaluationAreas.find(item => item.id === evaluationAreaId);
    if (!area) {
      return `Área #${evaluationAreaId}`;
    }

    return `${area.name} (${area.codeArea})`;
  }

  getPatientLabel(patientId?: number): string {
    if (patientId == null) {
      return 'Sin paciente';
    }

    const patient = this.patients.find(item => item.id === patientId);
    if (!patient) {
      return `Paciente #${patientId}`;
    }

    return `${patient.document} (${patient.userId})`;
  }

  formatDate(value?: Date | string): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
  }
}