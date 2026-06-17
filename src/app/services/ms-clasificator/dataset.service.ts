import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@models/ms-clasificator';
import { Dataset, DatasetExtended } from '@app/models/ms-clasificator/Dataset/Dataset';

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

  /** Obtener dataset por tipo de imagen médica → DatasetSummaryDTO */
  findByMedicalImageTypeId(medicalImageTypeId: number): Observable<ApiResponse<Dataset>> {
    return this.http.get<ApiResponse<Dataset>>(`${apiUrl}/image-type/${medicalImageTypeId}`);
  }

  /** Crear un nuevo dataset → DatasetResponseDTO */
  create(dataset: Partial<Dataset & { medicalDiagnosticId: number; medicalImageTypeId: number }>): Observable<ApiResponse<DatasetExtended>> {
    return this.http.post<ApiResponse<DatasetExtended>>(`${apiUrl}`, dataset);
  }

  /** Actualizar diagnóstico y tipo de imagen de un dataset → DatasetResponseDTO */
  update(id: number, dataset: Partial<Dataset & { medicalDiagnosticId: number; medicalImageTypeId: number }>): Observable<ApiResponse<DatasetExtended>> {
    return this.http.put<ApiResponse<DatasetExtended>>(`${apiUrl}/${id}`, dataset);
  }

  /** Eliminar un dataset */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }
}
