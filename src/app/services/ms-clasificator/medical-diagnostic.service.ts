import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@models/ms-clasificator';
import { MedicalDiagnostic, MedicalDiagnosticExtended } from '@app/models/ms-clasificator/MedicalDiagnostic/MedicalDiagnostic';

const apiUrl = `${environment.url_backend_clasificator}/api/medical-diagnostics`;

@Injectable({
  providedIn: 'root'
})
export class MedicalDiagnosticService {
  constructor(private http: HttpClient) {}

  /** Obtener todos los diagnósticos médicos → List<MedicalDiagnosticResponseDTO> */
  findAll(): Observable<MedicalDiagnosticExtended[]> {
    return this.http.get<MedicalDiagnosticExtended[]>(`${apiUrl}`);
  }

  /** Obtener un diagnóstico por ID → MedicalDiagnosticResponseDTO */
  findById(id: number): Observable<ApiResponse<MedicalDiagnosticExtended>> {
    return this.http.get<ApiResponse<MedicalDiagnosticExtended>>(`${apiUrl}/${id}`);
  }

  /** Obtener sub-diagnósticos por ID de padre → List<MedicalDiagnosticSummaryDTO> */
  findByParentId(parentId: number): Observable<ApiResponse<MedicalDiagnostic[]>> {
    return this.http.get<ApiResponse<MedicalDiagnostic[]>>(`${apiUrl}/parentId/${parentId}`);
  }

  /** Crear un nuevo diagnóstico médico → MedicalDiagnosticResponseDTO */
  create(medicalDiagnostic: Partial<MedicalDiagnostic>): Observable<ApiResponse<MedicalDiagnosticExtended>> {
    return this.http.post<ApiResponse<MedicalDiagnosticExtended>>(`${apiUrl}`, medicalDiagnostic);
  }

  /** Actualizar un diagnóstico médico → MedicalDiagnosticResponseDTO */
  update(id: number, medicalDiagnostic: Partial<MedicalDiagnostic>): Observable<ApiResponse<MedicalDiagnosticExtended>> {
    return this.http.put<ApiResponse<MedicalDiagnosticExtended>>(`${apiUrl}/${id}`, medicalDiagnostic);
  }

  /** Eliminar un diagnóstico médico */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }

  /** Agregar un sub-diagnóstico a un padre → MedicalDiagnosticResponseDTO */
  addSubDiagnostic(parentDiagnosticId: number, subDiagnosticId: number): Observable<ApiResponse<MedicalDiagnosticExtended>> {
    return this.http.put<ApiResponse<MedicalDiagnosticExtended>>(
      `${apiUrl}/${parentDiagnosticId}/add-sub-diagnostic/${subDiagnosticId}`,
      {}
    );
  }

  /** Remover un sub-diagnóstico de un padre → MedicalDiagnosticResponseDTO */
  removeSubDiagnostic(parentDiagnosticId: number, subDiagnosticId: number): Observable<ApiResponse<MedicalDiagnosticExtended>> {
    return this.http.delete<ApiResponse<MedicalDiagnosticExtended>>(
      `${apiUrl}/${parentDiagnosticId}/remove-sub-diagnostic/${subDiagnosticId}`
    );
  }
}