import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DoctorArea, ApiResponse } from '@models/ms-clasificator';

const apiUrl = `${environment.url_backend_clasificator}/api/doctor-areas`;

@Injectable({
  providedIn: 'root'
})
export class DoctorAreaService {
  constructor(private http: HttpClient) { }

  /**
   * Obtener todas las relaciones DoctorArea
   */
  findAll(): Observable<DoctorArea[]> {
    return this.http.get<DoctorArea[]>(`${apiUrl}`);
  }

  /**
   * Obtener una relación DoctorArea por ID
   */
  findById(id: number): Observable<ApiResponse<DoctorArea>> {
    return this.http.get<ApiResponse<DoctorArea>>(`${apiUrl}/${id}`);
  }

  /**
   * Obtener las áreas de evaluación de un doctor específico
   */
  findByDoctorId(doctorId: number): Observable<ApiResponse<DoctorArea[]>> {
    return this.http.get<ApiResponse<DoctorArea[]>>(`${apiUrl}/doctor/${doctorId}`);
  }

  /**
   * Obtener los doctores de un área de evaluación específica
   */
  findByEvaluationAreaId(evaluationAreaId: number): Observable<ApiResponse<DoctorArea[]>> {
    return this.http.get<ApiResponse<DoctorArea[]>>(`${apiUrl}/area/${evaluationAreaId}`);
  }

  /**
   * Crear una nueva relación DoctorArea
   */
  create(doctorArea: { doctorId: number; evaluationAreaId: number }): Observable<ApiResponse<DoctorArea>> {
    return this.http.post<ApiResponse<DoctorArea>>(`${apiUrl}`, doctorArea);
  }

  /**
   * Eliminar una relación DoctorArea por ID
   */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }

  /**
   * Eliminar la relación entre un doctor y un área de evaluación
   */
  deleteByDoctorAndArea(doctorId: number, evaluationAreaId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/doctor/${doctorId}/area/${evaluationAreaId}`);
  }
}
