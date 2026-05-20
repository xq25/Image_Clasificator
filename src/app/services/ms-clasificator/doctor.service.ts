import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Doctor, ApiResponse } from '@models/ms-clasificator';

const apiUrl = `${environment.url_backend_clasificator}/api/doctors`;

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  constructor(private http: HttpClient) { }

  /**
   * Obtener todos los doctores
   */
  findAll(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${apiUrl}`);
  }

  /**
   * Obtener un doctor por ID
   */
  findById(id: number): Observable<ApiResponse<Doctor>> {
    return this.http.get<ApiResponse<Doctor>>(`${apiUrl}/${id}`);
  }

  /**
   * Obtener doctores por userId
   */
  findByUserId(userId: string): Observable<ApiResponse<Doctor>> {
    return this.http.get<ApiResponse<Doctor>>(`${apiUrl}/user-id/${userId}`);
  }
  
  /**
   * Obtener un doctor por código
   */
  findByCode(code: string): Observable<ApiResponse<Doctor>> {
    return this.http.get<ApiResponse<Doctor>>(`${apiUrl}/code/${code}`);
  }

  /**
   * Crear un nuevo doctor
   */
  create(doctor: Partial<Doctor>): Observable<ApiResponse<Doctor>> {
    return this.http.post<ApiResponse<Doctor>>(`${apiUrl}`, doctor);
  }

  /**
   * Actualizar un doctor existente
   */
  update(id: number, doctor: Partial<Doctor>): Observable<ApiResponse<Doctor>> {
    return this.http.put<ApiResponse<Doctor>>(`${apiUrl}/${id}`, doctor);
  }

  /**
   * Eliminar un doctor
   */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }
}
