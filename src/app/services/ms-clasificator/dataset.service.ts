import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Dataset, DatasetExtended, ApiResponse } from '@models/ms-clasificator';

const apiUrl = `${environment.url_backend_clasificator}/api/datasets`;

@Injectable({
  providedIn: 'root'
})
export class DatasetService {
  constructor(private http: HttpClient) {}

  /** Obtener todos los datasets → List<DatasetSummaryDTO> */
  findAll(): Observable<ApiResponse<Dataset[]>> {
    return this.http.get<ApiResponse<Dataset[]>>(`${apiUrl}`);
  }

  /** Obtener un dataset por ID → DatasetResponseDTO */
  findById(id: number): Observable<ApiResponse<DatasetExtended>> {
    return this.http.get<ApiResponse<DatasetExtended>>(`${apiUrl}/${id}`);
  }

  /** Obtener datasets por diagnóstico médico → List<DatasetResponseDTO> */
  findByMedicalDiagnosticId(medicalDiagnosticId: number): Observable<ApiResponse<DatasetExtended[]>> {
    return this.http.get<ApiResponse<DatasetExtended[]>>(`${apiUrl}/diagnostic/${medicalDiagnosticId}`);
  }

  /** Obtener dataset por área de evaluación → DatasetSummaryDTO */
  findByEvaluationAreaId(evaluationAreaId: number): Observable<ApiResponse<Dataset>> {
    return this.http.get<ApiResponse<Dataset>>(`${apiUrl}/area/${evaluationAreaId}`);
  }

  /** Crear un nuevo dataset → DatasetResponseDTO */
  create(dataset: Partial<Dataset>): Observable<ApiResponse<DatasetExtended>> {
    return this.http.post<ApiResponse<DatasetExtended>>(`${apiUrl}`, dataset);
  }

  /** Cambiar el diagnóstico médico de un dataset → DatasetResponseDTO */
  changeDiagnostic(id: number, dataset: Partial<Dataset>): Observable<ApiResponse<DatasetExtended>> {
    return this.http.put<ApiResponse<DatasetExtended>>(`${apiUrl}/${id}/change-diagnostic`, dataset);
  }

  /** Asignar un dataset a un área de evaluación → DatasetResponseDTO */
  assignEvaluationArea(datasetId: number, evaluationAreaId: number): Observable<ApiResponse<DatasetExtended>> {
    return this.http.put<ApiResponse<DatasetExtended>>(
      `${apiUrl}/${datasetId}/evaluation-area/${evaluationAreaId}`,
      {}
    );
  }

  /** Desasignar un dataset de su área de evaluación → DatasetResponseDTO */
  removeFromEvaluationArea(datasetId: number): Observable<ApiResponse<DatasetExtended>> {
    return this.http.put<ApiResponse<DatasetExtended>>(`${apiUrl}/removeFromArea/${datasetId}`, {});
  }

  /** Eliminar un dataset */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }
}
