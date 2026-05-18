import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { EvaluationArea } from '@app/models/ms-clasificator';
import { EvaluationAreaService } from '@app/services/ms-clasificator/evaluation-area.service';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './list.component.html',
})
export class ListComponent {

  private initialPath = '/evaluation-areas';
  evaluationAreas = signal<EvaluationArea[]>([]);
  loading = signal(true);

  constructor(private router: Router, private evaluationAreaService: EvaluationAreaService) {}

  ngOnInit(): void {
    this.loadEvaluationAreas();
  }

  loadEvaluationAreas(): void {
    this.loading.set(true);
    this.evaluationAreaService.findAll().subscribe({
      next: (response) => {
        this.evaluationAreas.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar áreas de evaluación:', error);
        this.loading.set(false);
      }
    });
  }

  handleAction(event: any) {
    const { action, row } = event;
    switch (action) {
      case 'view':
        this.view(row.id);
        break;
      case 'edit':
        this.edit(row.id);
        break;
      case 'delete':
        this.delete(row.id);
        break;
      case 'manageDoctorInArea':
        this.manageDoctorInArea(row.id);
        break;
    }
  }

  view(evaluationAreaId: string) {
    this.router.navigate([`${this.initialPath}/view/${evaluationAreaId}`]);
  }

  create() {
    this.router.navigate([`${this.initialPath}/create`]);
  }

  edit(evaluationAreaId: string) {
    this.router.navigate([`${this.initialPath}/edit/${evaluationAreaId}`]);
  }

  delete(evaluationAreaId: string) {
    if (confirm('¿Estás seguro de que quieres eliminar esta área de evaluación?')) {
      this.evaluationAreaService.delete(Number(evaluationAreaId)).subscribe({
        next: () => {
          this.loadEvaluationAreas();
        },
        error: (error) => {
          console.error('Error al eliminar área de evaluación:', error);
        }
      });
    }
  }

  manageDoctorInArea(evaluationAreaId: string) {
    this.router.navigate([`${this.initialPath}/manage-doctor-in-area/${evaluationAreaId}`]);
  }
}