import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PatientDatum, PatientDatumExtended, ApiResponse } from '@models/ms-clasificator';

const apiUrl = `${environment.url_backend_clasificator}/api/patient-datums`;

@Injectable({
  providedIn: 'root'
})
export class PatientDatumService {
  constructor(private http: HttpClient) {}

  /** Obtener todos los datos de paciente → List<PatientDatumSummaryDTO> */
  findAll(): Observable<ApiResponse<PatientDatum[]>> {
    return this.http.get<ApiResponse<PatientDatum[]>>(`${apiUrl}`);
  }

  /** Obtener un dato de paciente por ID → PatientDatumResponseDTO */
  findById(id: number): Observable<ApiResponse<PatientDatumExtended>> {
    return this.http.get<ApiResponse<PatientDatumExtended>>(`${apiUrl}/${id}`);
  }

  /** Obtener datos por clinical record → List<PatientDatumResponseDTO> */
  findByClinicalRecordId(clinicalRecordId: number): Observable<ApiResponse<PatientDatumExtended[]>> {
    return this.http.get<ApiResponse<PatientDatumExtended[]>>(`${apiUrl}/clinical-record/${clinicalRecordId}`);
  }

  /** Obtener datos por primitive datum → List<PatientDatumSummaryDTO> */
  findByPrimitiveDatumId(primitiveDatumId: number): Observable<ApiResponse<PatientDatum[]>> {
    return this.http.get<ApiResponse<PatientDatum[]>>(`${apiUrl}/primitive-datum/${primitiveDatumId}`);
  }

  /** Crear un nuevo dato de paciente → PatientDatumResponseDTO */
  create(dto: Partial<PatientDatum>): Observable<ApiResponse<PatientDatumExtended>> {
    return this.http.post<ApiResponse<PatientDatumExtended>>(`${apiUrl}`, dto);
  }

  /** Actualizar un dato de paciente → PatientDatumResponseDTO */
  update(id: number, dto: Partial<PatientDatum>): Observable<ApiResponse<PatientDatumExtended>> {
    return this.http.put<ApiResponse<PatientDatumExtended>>(`${apiUrl}/${id}`, dto);
  }

  /** Eliminar un dato de paciente */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }
}
