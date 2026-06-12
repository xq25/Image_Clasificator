import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, map } from 'rxjs';

import { EntityAssociationComponent, AssociationConfig } from '@app/components/entity-association/entity-association.component';
import { DoctorAreaService } from '@app/services/ms-clasificator/doctor-area.service';
import { DoctorService } from '@app/services/ms-clasificator/doctor.service';
import { EvaluationAreaService } from '@app/services/ms-clasificator/evaluation-area.service';
import { EvaluationArea } from '@models/ms-clasificator/EvaluationArea/EvaluationArea';
import { DoctorExtended } from '@models/ms-clasificator/Doctor/Doctor';
import { DoctorArea } from '@models/ms-clasificator/DoctorArea/DoctorArea';

@Component({
  selector: 'app-manage-areas',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EntityAssociationComponent,
  ],
  templateUrl: './manage-areas.component.html',
  styleUrl: './manage-areas.component.scss',
})
export class ManageAreasComponent implements OnInit {

  doctorId!: number;

  doctor = signal<DoctorExtended | null>(null);
  allAreas = signal<EvaluationArea[]>([]);
  associatedAreas = signal<EvaluationArea[]>([]);

  // Mapa interno: evaluationAreaId → DoctorArea.id (necesario para el delete)
  private doctorAreaMap = new Map<number, number>();

  loadingDoctor = signal(true);
  loadingAll = signal(true);
  loadingAssociated = signal(true);

  // ─── CONFIG EntityAssociationComponent ───────────────────────────────────

  config: AssociationConfig<EvaluationArea> = {
    idKey: 'id',
    labelKey: 'name',
    descriptionKey: 'codeArea',
    associatedIcon: 'domain',
    availableIcon: 'add_business',
    associatedPanelTitle: 'Áreas asignadas',
    availablePanelTitle: 'Áreas disponibles',
    searchPlaceholder: 'Buscar área...',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private doctorService: DoctorService,
    private doctorAreaService: DoctorAreaService,
    private evaluationAreaService: EvaluationAreaService,
  ) {}

  ngOnInit(): void {
    this.doctorId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadDoctor();
    this.loadAllAreas();
    this.loadAssociatedAreas();
  }

  // ─── CARGA DE DATOS ───────────────────────────────────────────────────────

  private loadDoctor(): void {
    this.loadingDoctor.set(true);
    this.doctorService.findById(this.doctorId).subscribe({
      next: (res) => {
        this.doctor.set(res.data ?? null);
        this.loadingDoctor.set(false);
      },
      error: () => this.loadingDoctor.set(false),
    });
  }

  private loadAllAreas(): void {
    this.loadingAll.set(true);
    this.evaluationAreaService.findAll().subscribe({
      next: (res) => {
        this.allAreas.set(res.data ?? []);
        this.loadingAll.set(false);
      },
      error: () => this.loadingAll.set(false),
    });
  }

  private loadAssociatedAreas(): void {
    this.loadingAssociated.set(true);
    this.doctorAreaService.findByDoctorId(this.doctorId).subscribe({
      next: (res) => {
        const relations: DoctorArea[] = res.data ?? [];

        // Reconstruimos el mapa areaId → doctorArea.id para poder hacer delete
        this.doctorAreaMap.clear();
        relations.forEach(da => {
          if (da.evaluationAreaId && da.id) {
            this.doctorAreaMap.set(da.evaluationAreaId, da.id);
          }
        });

        // Para el componente sólo necesitamos los EvaluationArea planos
        // Los obtenemos cruzando con allAreas o suscribiéndonos a su endpoint propio
        this.resolveAssociatedAreas(relations);
      },
      error: () => this.loadingAssociated.set(false),
    });
  }

  /**
   * Cruza las relaciones DoctorArea con allAreas para obtener
   * los objetos EvaluationArea completos que necesita el componente.
   * Si allAreas aún no está cargado, vuelve a intentarlo una vez cargue.
   */
  private resolveAssociatedAreas(relations: DoctorArea[]): void {
    const all = this.allAreas();

    if (all.length > 0) {
      const areas = relations
        .map(da => all.find(a => a.id === da.evaluationAreaId))
        .filter((a): a is EvaluationArea => !!a);
      this.associatedAreas.set(areas);
      this.loadingAssociated.set(false);
    } else {
      // allAreas todavía carga; esperamos su respuesta
      this.evaluationAreaService.findAll().subscribe({
        next: (res) => {
          const areas = relations
            .map(da => (res.data ?? []).find(a => a.id === da.evaluationAreaId))
            .filter((a): a is EvaluationArea => !!a);
          this.associatedAreas.set(areas);
          this.loadingAssociated.set(false);
        },
        error: () => this.loadingAssociated.set(false),
      });
    }
  }

  // ─── CALLBACKS PARA EntityAssociationComponent ───────────────────────────

  onAssociate = (area: EvaluationArea): Observable<any> => {
    return this.doctorAreaService
      .create({ doctorId: this.doctorId, evaluationAreaId: area.id! })
      .pipe(
        map((res) => {
          // Guardamos el nuevo doctorArea.id en el mapa para futuros deletes
          if (res.data?.id && area.id) {
            this.doctorAreaMap.set(area.id, res.data.id);
          }
          return res;
        })
      );
  };

  onDisassociate = (area: EvaluationArea): Observable<any> => {
    const doctorAreaId = this.doctorAreaMap.get(area.id!);

    if (doctorAreaId) {
      return this.doctorAreaService.delete(doctorAreaId).pipe(
        map((res) => {
          this.doctorAreaMap.delete(area.id!);
          return res;
        })
      );
    }

    // Fallback: borrar por doctor + área si no tenemos el id de la relación
    return this.doctorAreaService
      .deleteByDoctorAndArea(this.doctorId, area.id!)
      .pipe(map((res) => { this.doctorAreaMap.delete(area.id!); return res; }));
  };

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  getDoctorInitials(): string {
    const name = this.doctor()?.userInfo?.name ?? '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'DR';
  }

  goBack(): void {
    this.router.navigate(['/doctors/list']);
  }
}