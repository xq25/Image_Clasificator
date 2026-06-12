import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@models/ms-clasificator';
import { Patient, PatientExtended } from '@app/models/ms-clasificator/Patient/Patient';

const apiUrl = `${environment.url_backend_clasificator}/api/patients`;

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  constructor(private http: HttpClient) {}

  /** Obtener todos los pacientes → List<PatientSummaryDTO> */
  findAll(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${apiUrl}`);
  }

  /** Obtener un paciente por ID → PatientResponseDTO */
  findById(id: number): Observable<ApiResponse<PatientExtended>> {
    return this.http.get<ApiResponse<PatientExtended>>(`${apiUrl}/${id}`);
  }

  /** Obtener un paciente por userId → PatientResponseDTO */
  findByUserId(userId: string): Observable<ApiResponse<PatientExtended>> {
    return this.http.get<ApiResponse<PatientExtended>>(`${apiUrl}/user-id/${userId}`);
  }

  /** Obtener un paciente por documento → PatientResponseDTO */
  findByDocument(document: string): Observable<ApiResponse<PatientExtended>> {
    return this.http.get<ApiResponse<PatientExtended>>(`${apiUrl}/document/${document}`);
  }

  /** Crear un nuevo paciente → PatientSummaryDTO */
  create(patient: Partial<Patient>): Observable<ApiResponse<Patient>> {
    return this.http.post<ApiResponse<Patient>>(`${apiUrl}`, patient);
  }

  /** Actualizar un paciente existente → PatientSummaryDTO */
  update(id: number, patient: Partial<Patient>): Observable<ApiResponse<Patient>> {
    return this.http.put<ApiResponse<Patient>>(`${apiUrl}/${id}`, patient);
  }

  /** Eliminar un paciente */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }
}