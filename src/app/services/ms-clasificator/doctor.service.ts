import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@models/ms-clasificator';
import { Doctor, DoctorExtended } from '@app/models/ms-clasificator/Doctor/Doctor';
const apiUrl = `${environment.url_backend_clasificator}/api/doctors`;

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  constructor(private http: HttpClient) {}

  /** Obtener todos los doctores → List<DoctorSummaryDTO> */
  findAll(): Observable<ApiResponse<Doctor[]>> {
    return this.http.get<ApiResponse<Doctor[]>>(`${apiUrl}`);
  }

  /** Obtener un doctor por ID → DoctorResponseDTO */
  findById(id: number): Observable<ApiResponse<DoctorExtended>> {
    return this.http.get<ApiResponse<DoctorExtended>>(`${apiUrl}/${id}`);
  }

  /** Obtener un doctor por userId → DoctorResponseDTO */
  findByUserId(userId: string): Observable<ApiResponse<DoctorExtended>> {
    return this.http.get<ApiResponse<DoctorExtended>>(`${apiUrl}/user-id/${userId}`);
  }

  /** Obtener un doctor por código → DoctorResponseDTO */
  findByCode(code: string): Observable<ApiResponse<DoctorExtended>> {
    return this.http.get<ApiResponse<DoctorExtended>>(`${apiUrl}/code/${code}`);
  }

  /** Crear un nuevo doctor → DoctorSummaryDTO */
  create(doctor: Partial<Doctor>): Observable<ApiResponse<Doctor>> {
    return this.http.post<ApiResponse<Doctor>>(`${apiUrl}`, doctor);
  }

  /** Actualizar un doctor existente → DoctorSummaryDTO */
  update(id: number, doctor: Partial<Doctor>): Observable<ApiResponse<Doctor>> {
    return this.http.put<ApiResponse<Doctor>>(`${apiUrl}/${id}`, doctor);
  }

  /** Eliminar un doctor */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }
}