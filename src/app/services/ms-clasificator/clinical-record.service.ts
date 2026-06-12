import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@models/ms-clasificator';
import { ClinicalRecord, ClinicalRecordExtended } from '@models/ms-clasificator/ClinicalRecord/ClinicalRecord';

const apiUrl = `${environment.url_backend_clasificator}/api/clinical-records`;

@Injectable({
  providedIn: 'root'
})
export class ClinicalRecordService {
  constructor(private http: HttpClient) {}

  /** Obtener todos los registros clínicos → List<ClinicalRecordSummaryDTO> */
  findAll(): Observable<ApiResponse<ClinicalRecord[]>> {
    return this.http.get<ApiResponse<ClinicalRecord[]>>(`${apiUrl}`);
  }

  /** Obtener un registro clínico por ID → ClinicalRecordResponseDTO */
  findById(id: number): Observable<ApiResponse<ClinicalRecordExtended>> {
    return this.http.get<ApiResponse<ClinicalRecordExtended>>(`${apiUrl}/${id}`);
  }

  /** Obtener los registros clínicos de un paciente → List<ClinicalRecordSummaryDTO> */
  findByPatientId(patientId: number): Observable<ApiResponse<ClinicalRecord[]>> {
    return this.http.get<ApiResponse<ClinicalRecord[]>>(`${apiUrl}/patient/${patientId}`);
  }

  /** Crear un nuevo registro clínico → ClinicalRecordResponseDTO */
  create(clinicalRecord: Partial<ClinicalRecord>): Observable<ApiResponse<ClinicalRecordExtended>> {
    return this.http.post<ApiResponse<ClinicalRecordExtended>>(`${apiUrl}`, clinicalRecord);
  }

  /** Actualizar un registro clínico → ClinicalRecordResponseDTO */
  update(id: number, clinicalRecord: Partial<ClinicalRecord>): Observable<ApiResponse<ClinicalRecordExtended>> {
    return this.http.put<ApiResponse<ClinicalRecordExtended>>(`${apiUrl}/${id}`, clinicalRecord);
  }

  /** Eliminar un registro clínico */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }

  /** Cambiar el paciente asociado a un registro clínico → ClinicalRecordResponseDTO */
  changePatient(clinicalRecordId: number, newPatientId: number): Observable<ApiResponse<ClinicalRecordExtended>> {
    return this.http.put<ApiResponse<ClinicalRecordExtended>>(
      `${apiUrl}/${clinicalRecordId}/patient/${newPatientId}`,
      {}
    );
  }
}
