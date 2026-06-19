import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@models/ms-clasificator';
import { Diagnosis, DiagnosisCreateDTO, DiagnosisExtended } from '@models/ms-clasificator/Diagnosis/Diagnosis';

const apiUrl = `${environment.url_backend_clasificator}/api/diagnosis`;

@Injectable({
  providedIn: 'root'
})
export class DiagnosisService {
  constructor(private http: HttpClient) {}

  /** Obtener todos los diagnósticos → List<DiagnosisSummaryDTO> */
  findAll(): Observable<ApiResponse<Diagnosis[]>> {
    return this.http.get<ApiResponse<Diagnosis[]>>(`${apiUrl}`);
  }

  /** Obtener un diagnóstico por ID → DiagnosisResponseDTO */
  findById(id: number): Observable<ApiResponse<DiagnosisExtended>> {
    return this.http.get<ApiResponse<DiagnosisExtended>>(`${apiUrl}/${id}`);
  }

  /** Obtener diagnósticos por clinical record → List<DiagnosisSummaryDTO> */
  findByClinicalRecordId(clinicalRecordId: number): Observable<ApiResponse<Diagnosis[]>> {
    return this.http.get<ApiResponse<Diagnosis[]>>(`${apiUrl}/clinical-record/${clinicalRecordId}`);
  }

  /** Crear un nuevo diagnóstico → DiagnosisResponseDTO */
  create(dto: DiagnosisCreateDTO): Observable<ApiResponse<DiagnosisExtended>> {
    return this.http.post<ApiResponse<DiagnosisExtended>>(`${apiUrl}`, dto);
  }

  /** Eliminar un diagnóstico */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }
}
