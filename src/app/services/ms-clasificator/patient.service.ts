import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Patient, ApiResponse } from '@models/ms-clasificator';

const apiUrl = `${environment.url_backend_clasificator}/patients`;

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  constructor(private http: HttpClient) { }

  /**
   * Obtener todos los pacientes
   */
  findAll(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${apiUrl}`);
  }

  /**
   * Obtener un paciente por ID
   */
  findById(id: number): Observable<ApiResponse<Patient>> {
    return this.http.get<ApiResponse<Patient>>(`${apiUrl}/${id}`);
  }

  /**
   * Obtener un paciente por userId
   */
  findByUserId(userId: string): Observable<ApiResponse<Patient>> {
    return this.http.get<ApiResponse<Patient>>(`${apiUrl}/user-id/${userId}`);
  }

  /**
   * Obtener un paciente por documento
   */
  findByDocument(document: string): Observable<ApiResponse<Patient>> {
    return this.http.get<ApiResponse<Patient>>(`${apiUrl}/document/${document}`);
  }

  /**
   * Crear un nuevo paciente
   */
  create(patient: Partial<Patient>): Observable<ApiResponse<Patient>> {
    return this.http.post<ApiResponse<Patient>>(`${apiUrl}`, patient);
  }

  /**
   * Actualizar un paciente existente
   */
  update(id: number, patient: Partial<Patient>): Observable<ApiResponse<Patient>> {
    return this.http.put<ApiResponse<Patient>>(`${apiUrl}/${id}`, patient);
  }

  /**
   * Eliminar un paciente
   */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }
}
