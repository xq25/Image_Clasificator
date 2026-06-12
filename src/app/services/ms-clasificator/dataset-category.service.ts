import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DatasetCategory, DatasetCategoryExtended, ApiResponse } from '@models/ms-clasificator';

const apiUrl = `${environment.url_backend_clasificator}/api/dataset-categories`;

@Injectable({
  providedIn: 'root'
})
export class DatasetCategoryService {
  constructor(private http: HttpClient) {}

  /** Obtener todas las categorías → List<DatasetCategoryResponseDTO> */
  findAll(): Observable<ApiResponse<DatasetCategoryExtended[]>> {
    return this.http.get<ApiResponse<DatasetCategoryExtended[]>>(`${apiUrl}`);
  }

  /** Obtener una categoría por ID → DatasetCategoryResponseDTO */
  findById(id: number): Observable<ApiResponse<DatasetCategoryExtended>> {
    return this.http.get<ApiResponse<DatasetCategoryExtended>>(`${apiUrl}/${id}`);
  }

  /** Obtener categorías por dataset → List<DatasetCategorySummaryDTO> */
  findByDatasetId(datasetId: number): Observable<ApiResponse<DatasetCategory[]>> {
    return this.http.get<ApiResponse<DatasetCategory[]>>(`${apiUrl}/dataset/${datasetId}`);
  }

  /** Crear una nueva categoría de dataset → DatasetCategoryResponseDTO */
  create(datasetCategory: Partial<DatasetCategory>): Observable<ApiResponse<DatasetCategoryExtended>> {
    return this.http.post<ApiResponse<DatasetCategoryExtended>>(`${apiUrl}`, datasetCategory);
  }

  /** Eliminar una categoría de dataset */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }
}
