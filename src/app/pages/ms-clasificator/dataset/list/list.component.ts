import {
  Component, OnInit, signal, inject, computed, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { forkJoin, switchMap, of } from 'rxjs';

import { DatasetService } from '@app/services/ms-clasificator/dataset.service';
import { DatasetCategoryService } from '@app/services/ms-clasificator/dataset-category.service';
import { DiagnosticCategoryDatasetService } from '@app/services/ms-clasificator/diagnostic-category-dataset.service';
import { MedicalDiagnosticService } from '@app/services/ms-clasificator/medical-diagnostic.service';
import { MedicalImageTypeService } from '@app/services/ms-clasificator/medical-image-type.service';

import { DatasetExtended } from '@app/models/ms-clasificator/Dataset/Dataset';
import { DatasetCategory } from '@app/models/ms-clasificator/DatasetCategory/DatasetCategory';
import { DaignosticCategoryDataset } from '@app/models/ms-clasificator/DiagnosticCategoryDataset/DiagnosticCategoryDataset';
import { MedicalDiagnostic, MedicalDiagnosticExtended } from '@app/models/ms-clasificator/MedicalDiagnostic/MedicalDiagnostic';
import { MedicalImageType } from '@app/models/ms-clasificator/MedicalImageType/MedicalImageType';

import { DynamicTableComponent, TableAction, TableColumn } from '@app/components/dynamic-table/dynamic-table.component';

interface Toast { message: string; type: 'success' | 'error'; }

export interface CategoryView {
  category:        DatasetCategory;
  diagnostics:     DaignosticCategoryDataset[];
  searchValue:     string;
  showDropdown:    boolean;
  filteredOptions: MedicalDiagnostic[];
}

const COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
];

@Component({
  selector: 'app-dataset-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    DynamicTableComponent,
  ],
  templateUrl: './list.component.html',
  styleUrl:    './list.component.scss',
})
export class DatasetListComponent implements OnInit {

  private cdr        = inject(ChangeDetectorRef);
  private router     = inject(Router);
  private toastTimer: any;

  // ─── DATA ────────────────────────────────────────────────────────────────────
  datasets = signal<DatasetExtended[]>([]);
  loading  = signal(true);

  // ─── PANEL INFERIOR ──────────────────────────────────────────────────────────
  panelOpen      = signal(false);
  panelLoading   = signal(false);
  viewDataset    = signal<DatasetExtended | null>(null);
  viewCategories = signal<CategoryView[]>([]);
  currentId      = signal<number | null>(null);
  toast          = signal<Toast | null>(null);

  // ─── MODO EDITAR INFO GENERAL ────────────────────────────────────────────────
  editingGeneral  = signal(false);
  editName        = signal('');
  editDiagnostic  = signal<MedicalDiagnosticExtended | null>(null);
  editImageType   = signal<MedicalImageType | null>(null);
  diagSearch      = signal('');
  allDiagnostics  = signal<MedicalDiagnosticExtended[]>([]);
  allImageTypes   = signal<MedicalImageType[]>([]);
  savingGeneral   = signal(false);
  loadingCatalogs = signal(false);

  filteredDiags = computed(() => {
    const q = this.diagSearch().toLowerCase().trim();
    const list = this.allDiagnostics();
    if (!q) return list.slice(0, 40);
    return list.filter(d =>
      d.diagnosticCode.toLowerCase().includes(q) ||
      d.diagnosticName.toLowerCase().includes(q)
    ).slice(0, 40);
  });

  // ─── MODO EDITAR CATEGORÍAS ───────────────────────────────────────────────────
  editingCategories = signal(false);
  subDiagnostics    = signal<MedicalDiagnostic[]>([]);
  loadingSubs       = signal(false);

  // ─── TABLE ───────────────────────────────────────────────────────────────────
  columns: TableColumn[] = [
    { key: 'id',              label: 'ID'              },
    { key: 'name',            label: 'Nombre'          },
    { key: 'diagnosticCode',  label: 'Código CIE-10'   },
    { key: 'diagnosticName',  label: 'Diagnóstico'     },
    { key: 'imageTypeName',   label: 'Tipo de imagen'  },
  ];

  actionButtons: TableAction[] = [
    { action: 'view',   icon: 'visibility', class: 'btn-view'   },
    { action: 'delete', icon: 'delete',     class: 'btn-delete' },
  ];

  constructor(
    private datasetService:    DatasetService,
    private categoryService:   DatasetCategoryService,
    private diagCatService:    DiagnosticCategoryDatasetService,
    private medDiagService:    MedicalDiagnosticService,
    private imageTypeService:  MedicalImageTypeService,
  ) {}

  ngOnInit(): void { this.loadDatasets(); }

  // ─── CARGA TABLA ─────────────────────────────────────────────────────────────

  loadDatasets(): void {
    this.loading.set(true);
    this.datasetService.findAll().subscribe({
      next: (res) => {
        const flat = (res.data ?? []).map(d => ({
          ...d,
          diagnosticCode: (d as any).medicalDiagnostic?.diagnosticCode ?? '—',
          diagnosticName: (d as any).medicalDiagnostic?.diagnosticName ?? '—',
          imageTypeName:  (d as any).medicalImageType?.name             ?? '—',
        }));
        this.datasets.set(flat as DatasetExtended[]);
        this.loading.set(false);
      },
      error: () => {
        this.showToast('Error al cargar los datasets', 'error');
        this.loading.set(false);
      },
    });
  }

  // ─── ACCIONES TABLA ──────────────────────────────────────────────────────────

  handleAction(event: { action: string; row: any }): void {
    if (event.action === 'view')   this.openView(event.row.id);
    if (event.action === 'delete') this.deleteDataset(event.row.id);
  }

  openCreate(): void { this.router.navigate(['/datasets/create']); }

  // ─── ABRIR / CERRAR PANEL ────────────────────────────────────────────────────

  openView(id: number): void {
    this.panelLoading.set(true);
    this.panelOpen.set(true);
    this.currentId.set(id);
    this.viewDataset.set(null);
    this.viewCategories.set([]);
    this.editingGeneral.set(false);
    this.editingCategories.set(false);

    const fromTable = this.datasets().find(d => d.id === id);

    this.datasetService.findById(id).pipe(
      switchMap(res => {
        const merged = { ...res.data!, name: res.data!.name || fromTable?.name || '' };
        this.viewDataset.set(merged);
        return this.categoryService.findByDatasetId(id);
      }),
      switchMap(catRes => {
        const cats = catRes.data ?? [];
        if (cats.length === 0) return of([] as CategoryView[]);
        return forkJoin(
          cats.map(cat => this.diagCatService.findByDatasetCategoryId(cat.id!))
        ).pipe(
          switchMap(diagResults => {
            const views: CategoryView[] = cats.map((cat, i) => ({
              category:        cat,
              diagnostics:     diagResults[i].data ?? [],
              searchValue:     '',
              showDropdown:    false,
              filteredOptions: [],
            }));
            return of(views);
          })
        );
      }),
    ).subscribe({
      next: (views) => {
        this.viewCategories.set(views);
        this.panelLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Error al cargar el detalle del dataset', 'error');
        this.closePanel();
      },
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.panelLoading.set(false);
    this.viewDataset.set(null);
    this.viewCategories.set([]);
    this.currentId.set(null);
    this.editingGeneral.set(false);
    this.editingCategories.set(false);
  }

  deleteDataset(id: number): void {
    this.datasetService.delete(id).subscribe({
      next: () => {
        this.showToast('Dataset eliminado', 'success');
        if (this.currentId() === id) this.closePanel();
        this.loadDatasets();
      },
      error: (err) => {
        this.showToast(err?.error?.message ?? 'Error al eliminar el dataset', 'error');
      },
    });
  }

  // ─── EDITAR INFO GENERAL ─────────────────────────────────────────────────────

  startEditGeneral(): void {
    const d = this.viewDataset();
    if (!d) return;
    this.editName.set(d.name);
    this.editDiagnostic.set(d.medicalDiagnostic as MedicalDiagnosticExtended);
    this.editImageType.set(d.medicalImageType ?? null);
    this.diagSearch.set('');
    this.editingCategories.set(false);

    if (this.allDiagnostics().length === 0 || this.allImageTypes().length === 0) {
      this.loadingCatalogs.set(true);
      forkJoin([
        this.medDiagService.findAll(),
        this.imageTypeService.findAll(),
      ]).subscribe({
        next: ([diags, imageTypesRes]) => {
          this.allDiagnostics.set(diags ?? []);
          this.allImageTypes.set(imageTypesRes.data ?? []);
          this.loadingCatalogs.set(false);
        },
        error: () => {
          this.showToast('Error al cargar catálogos', 'error');
          this.loadingCatalogs.set(false);
        },
      });
    }

    this.editingGeneral.set(true);
  }

  cancelEditGeneral(): void {
    this.editingGeneral.set(false);
    this.diagSearch.set('');
  }

  saveGeneral(): void {
    const d         = this.viewDataset();
    const diag      = this.editDiagnostic();
    const imageType = this.editImageType();
    if (!d || !diag || !imageType) return;

    this.savingGeneral.set(true);
    const id = d.id!;

    this.datasetService.update(id, {
      medicalDiagnosticId: diag.id,
      medicalImageTypeId:  imageType.id,
    } as any).subscribe({
      next: () => {
        this.savingGeneral.set(false);
        this.showToast('Dataset actualizado', 'success');
        this.openView(id);
        this.loadDatasets();
      },
      error: (err) => {
        this.savingGeneral.set(false);
        this.showToast(err?.error?.message ?? 'Error al actualizar el dataset', 'error');
      },
    });
  }

  // ─── EDITAR CATEGORÍAS ────────────────────────────────────────────────────────

  startEditCategories(): void {
    const d = this.viewDataset();
    if (!d) return;
    this.editingGeneral.set(false);

    if (this.subDiagnostics().length === 0) {
      this.loadingSubs.set(true);
      this.medDiagService.findByParentId(d.medicalDiagnostic.id!).subscribe({
        next: (res) => {
          this.subDiagnostics.set(res.data ?? []);
          this.loadingSubs.set(false);
          this.refreshCategoryOptions();
        },
        error: () => {
          this.showToast('Error al cargar sub-diagnósticos', 'error');
          this.loadingSubs.set(false);
        },
      });
    } else {
      this.refreshCategoryOptions();
    }

    this.editingCategories.set(true);
  }

  private refreshCategoryOptions(): void {
    this.viewCategories.update(cats => cats.map(cv => ({
      ...cv,
      searchValue:     '',
      showDropdown:    false,
      filteredOptions: this.getAvailableSubDiags(cv),
    })));
  }

  cancelEditCategories(): void {
    this.editingCategories.set(false);
    this.viewCategories.update(cats => cats.map(cv => ({
      ...cv, searchValue: '', showDropdown: false, filteredOptions: [],
    })));
  }

  removeDiagFromCategory(catIdx: number, assocId: number): void {
    this.diagCatService.delete(assocId).subscribe({
      next: () => {
        this.viewCategories.update(cats => cats.map((cv, i) => {
          if (i !== catIdx) return cv;
          const diagnostics = cv.diagnostics.filter(d => d.id !== assocId);
          return { ...cv, diagnostics, filteredOptions: this.getAvailableSubDiagsFromList(diagnostics) };
        }));
      },
      error: (err) => this.showToast(err?.error?.message ?? 'Error al eliminar diagnóstico', 'error'),
    });
  }

  deleteCategory(catIdx: number): void {
    const cv = this.viewCategories()[catIdx];
    if (!cv?.category.id) return;
    this.categoryService.delete(cv.category.id).subscribe({
      next: () => {
        this.viewCategories.update(cats => cats.filter((_, i) => i !== catIdx));
        this.showToast('Categoría eliminada', 'success');
      },
      error: (err) => this.showToast(err?.error?.message ?? 'Error al eliminar categoría', 'error'),
    });
  }

  onCategorySearch(catIdx: number, value: string): void {
    const q = value.toLowerCase().trim();
    this.viewCategories.update(cats => cats.map((cv, i) => {
      if (i !== catIdx) return cv;
      const available = this.getAvailableSubDiagsFromList(cv.diagnostics);
      return {
        ...cv,
        searchValue:     value,
        showDropdown:    true,
        filteredOptions: !q ? available : available.filter(sd =>
          sd.diagnosticCode.toLowerCase().includes(q) || sd.diagnosticName.toLowerCase().includes(q)
        ),
      };
    }));
  }

  openCatDropdown(catIdx: number): void {
    this.viewCategories.update(cats => cats.map((cv, i) =>
      i !== catIdx ? cv : { ...cv, showDropdown: true, filteredOptions: this.getAvailableSubDiags(cv) }
    ));
  }

  closeCatDropdown(catIdx: number): void {
    setTimeout(() => {
      this.viewCategories.update(cats => cats.map((cv, i) =>
        i !== catIdx ? cv : { ...cv, showDropdown: false, searchValue: '' }
      ));
    }, 180);
  }

  addDiagToCategory(catIdx: number, diag: MedicalDiagnostic): void {
    const cv = this.viewCategories()[catIdx];
    this.diagCatService.create({
      datasetCategoryId:   cv.category.id,
      medicalDiagnosticId: diag.id,
    } as any).subscribe({
      next: (res) => {
        const newAssoc = res.data!;
        this.viewCategories.update(cats => cats.map((cv2, i) => {
          if (i !== catIdx) return cv2;
          const diagnostics = [...cv2.diagnostics, newAssoc];
          return {
            ...cv2,
            diagnostics,
            searchValue:     '',
            showDropdown:    false,
            filteredOptions: this.getAvailableSubDiagsFromList(diagnostics),
          };
        }));
      },
      error: (err) => this.showToast(err?.error?.message ?? 'Error al agregar diagnóstico', 'error'),
    });
  }

  addCategory(): void {
    const datasetId = this.currentId();
    if (!datasetId) return;
    const existingNums = this.viewCategories().map(cv => cv.category.numValue);
    const nextNum = existingNums.length === 0 ? 1 : Math.max(...existingNums) + 1;

    this.categoryService.create({ numValue: nextNum, datasetId } as any).subscribe({
      next: (res) => {
        const newCat = res.data!;
        this.viewCategories.update(cats => [
          ...cats,
          {
            category:        { id: newCat.id, numValue: newCat.numValue },
            diagnostics:     [],
            searchValue:     '',
            showDropdown:    false,
            filteredOptions: this.subDiagnostics(),
          },
        ]);
        this.showToast('Categoría agregada', 'success');
      },
      error: (err) => this.showToast(err?.error?.message ?? 'Error al agregar categoría', 'error'),
    });
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────────

  getCategoryColor(index: number): string {
    return COLORS[index % COLORS.length];
  }

  totalCodes(): number {
    return this.viewCategories().reduce((sum, cv) => sum + cv.diagnostics.length, 0);
  }

  private getAvailableSubDiags(cv: CategoryView): MedicalDiagnostic[] {
    return this.getAvailableSubDiagsFromList(cv.diagnostics);
  }

  private getAvailableSubDiagsFromList(existing: DaignosticCategoryDataset[]): MedicalDiagnostic[] {
    const usedIds = new Set(existing.map(d => d.medicalDiagnostic.id));
    return this.subDiagnostics().filter(sd => !usedIds.has(sd.id));
  }

  // ─── TOAST ───────────────────────────────────────────────────────────────────

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }
}
