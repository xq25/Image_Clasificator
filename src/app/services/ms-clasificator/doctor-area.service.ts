import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@models/ms-clasificator';
import { DoctorArea, DoctorAreaExtended } from '@app/models/ms-clasificator/DoctorArea/DoctorArea';

const apiUrl = `${environment.url_backend_clasificator}/api/doctor-areas`;

@Injectable({
  providedIn: 'root'
})
export class DoctorAreaService {
  constructor(private http: HttpClient) {}

  /** Obtener todas las relaciones DoctorArea → List<DoctorAreaSummaryDTO> */
  findAll(): Observable<ApiResponse<DoctorArea[]>> {
    return this.http.get<ApiResponse<DoctorArea[]>>(`${apiUrl}`);
  }

  /** Obtener una relación DoctorArea por ID → DoctorAreaResponseDTO */
  findById(id: number): Observable<ApiResponse<DoctorAreaExtended>> {
    return this.http.get<ApiResponse<DoctorAreaExtended>>(`${apiUrl}/${id}`);
  }

  /** Obtener las áreas de un doctor → List<DoctorAreaSummaryDTO> */
  findByDoctorId(doctorId: number): Observable<ApiResponse<DoctorArea[]>> {
    return this.http.get<ApiResponse<DoctorArea[]>>(`${apiUrl}/doctor/${doctorId}`);
  }

  /** Obtener los doctores de un área → List<DoctorAreaSummaryDTO> */
  findByEvaluationAreaId(evaluationAreaId: number): Observable<ApiResponse<DoctorArea[]>> {
    return this.http.get<ApiResponse<DoctorArea[]>>(`${apiUrl}/area/${evaluationAreaId}`);
  }

  /** Crear una nueva relación DoctorArea → DoctorAreaResponseDTO */
  create(doctorArea: { doctorId: number; evaluationAreaId: number }): Observable<ApiResponse<DoctorAreaExtended>> {
    return this.http.post<ApiResponse<DoctorAreaExtended>>(`${apiUrl}`, doctorArea);
  }

  /** Eliminar una relación DoctorArea por ID */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }

  /** Eliminar relación por doctor y área */
  deleteByDoctorAndArea(doctorId: number, evaluationAreaId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/doctor/${doctorId}/area/${evaluationAreaId}`);
  }
}