import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';

import { MedicalDiagnosticService } from '@app/services/ms-clasificator/medical-diagnostic.service';
import { MedicalDiagnostic } from '@app/models/ms-clasificator';
import {
  EntityAssociationComponent,
  AssociationConfig,
} from '@app/components/entity-association/entity-association.component';

@Component({
  selector: 'app-manage-subdiagnostic',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, EntityAssociationComponent],
  templateUrl: './manage-subdiagnostic.component.html',
  styleUrl: './manage-subdiagnostic.component.scss',
})
export class ManageSubDiagnosticComponent implements OnInit {

  parentId!: string;

  parent       = signal<MedicalDiagnostic | null>(null);
  subDiagnostics  = signal<MedicalDiagnostic[]>([]);
  allDiagnostics  = signal<MedicalDiagnostic[]>([]);
  loadingSubs     = signal(true);
  loadingAll      = signal(true);

  readonly associationConfig: AssociationConfig<MedicalDiagnostic> = {
    idKey:                 'id',
    labelKey:              'diagnosticName',
    descriptionKey:        'diagnosticCode',
    associatedIcon:        'subdirectory_arrow_right',
    availableIcon:         'add_circle_outline',
    associatedPanelTitle:  'Sub-diagnósticos asignados',
    availablePanelTitle:   'Sub-diagnósticos disponibles',
    searchPlaceholder:     'Buscar por código o nombre...',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private medicalDiagnosticService: MedicalDiagnosticService,
  ) {}

  ngOnInit(): void {
    this.parentId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadParent();
    this.loadSubs();
    this.loadAll();
  }

  private loadParent(): void {
    this.medicalDiagnosticService.findById(Number(this.parentId)).subscribe({
      next: (res) => this.parent.set(res?.data ?? null),
    });
  }

  private loadSubs(): void {
    this.loadingSubs.set(true);
    this.medicalDiagnosticService.findByParentId(Number(this.parentId)).subscribe({
      next: (res: any) => {
        const subs: MedicalDiagnostic[] = Array.isArray(res)
          ? res
          : (res?.data ?? res?.content ?? []);
        this.subDiagnostics.set(subs);
        this.loadingSubs.set(false);
      },
      error: () => this.loadingSubs.set(false),
    });
  }

  private loadAll(): void {
    this.loadingAll.set(true);
    this.medicalDiagnosticService.findAll().subscribe({
      next: (data) => { this.allDiagnostics.set(data); this.loadingAll.set(false); },
      error: () => this.loadingAll.set(false),
    });
  }

  onAssociate = (item: MedicalDiagnostic): Observable<any> =>
    this.medicalDiagnosticService.addSubDiagnostic(Number(this.parentId), Number(item.id));

  onDisassociate = (item: MedicalDiagnostic): Observable<any> =>
    this.medicalDiagnosticService.removeSubDiagnostic(Number(this.parentId), Number(item.id));

  goBack(): void { this.router.navigate(['medical-diagnostics/list']); }
}
