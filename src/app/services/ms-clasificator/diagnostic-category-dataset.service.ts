import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@models/ms-clasificator';
import { DaignosticCategoryDataset, DaignosticCategoryDatasetExtended } from '@models/ms-clasificator/DiagnosticCategoryDataset/DiagnosticCategoryDataset';

const apiUrl = `${environment.url_backend_clasificator}/api/diagnostic-category-datasets`;

@Injectable({
  providedIn: 'root'
})
export class DiagnosticCategoryDatasetService {
  constructor(private http: HttpClient) {}

  /** Obtener todas las asociaciones diagnóstico-categoría → List<DiagnosticCategoryDatasetSummaryDTO> */
  findAll(): Observable<ApiResponse<DaignosticCategoryDataset[]>> {
    return this.http.get<ApiResponse<DaignosticCategoryDataset[]>>(`${apiUrl}`);
  }

  /** Obtener una asociación por ID → DiagnosticCategoryDatasetResponseDTO */
  findById(id: number): Observable<ApiResponse<DaignosticCategoryDatasetExtended>> {
    return this.http.get<ApiResponse<DaignosticCategoryDatasetExtended>>(`${apiUrl}/${id}`);
  }

  /** Obtener asociaciones por categoría de dataset → List<DiagnosticCategoryDatasetSummaryDTO> */
  findByDatasetCategoryId(datasetCategoryId: number): Observable<ApiResponse<DaignosticCategoryDataset[]>> {
    return this.http.get<ApiResponse<DaignosticCategoryDataset[]>>(`${apiUrl}/dataset-category/${datasetCategoryId}`);
  }

  /** Crear una nueva asociación diagnóstico-categoría → DiagnosticCategoryDatasetResponseDTO */
  create(dto: Partial<DaignosticCategoryDataset>): Observable<ApiResponse<DaignosticCategoryDatasetExtended>> {
    return this.http.post<ApiResponse<DaignosticCategoryDatasetExtended>>(`${apiUrl}`, dto);
  }

  /** Eliminar una asociación diagnóstico-categoría */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }
}
