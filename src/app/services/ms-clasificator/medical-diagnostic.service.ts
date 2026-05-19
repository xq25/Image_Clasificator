import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MedicalDiagnostic, ApiResponse } from '@models/ms-clasificator';

const apiUrl = `${environment.url_backend_clasificator}/api/medical-diagnostics`;

@Injectable({
  providedIn: 'root'
})
export class MedicalDiagnosticService {
  constructor(private http: HttpClient) { }

  /**
   * Obtener todos los diagnósticos médicos
   */
  findAll(): Observable<MedicalDiagnostic[]> {
    return this.http.get<MedicalDiagnostic[]>(`${apiUrl}`);
  }

  /**
   * Obtener un diagnóstico médico por ID
   */
  findById(id: number): Observable<ApiResponse<MedicalDiagnostic>> {
    return this.http.get<ApiResponse<MedicalDiagnostic>>(`${apiUrl}/${id}`);
  }

  /**
   * Obtener los diagnósticos médicos hijos por ID de padre
   */
  findByParentId(parentId: number): Observable<ApiResponse<MedicalDiagnostic[]>> {
    return this.http.get<ApiResponse<MedicalDiagnostic[]>>(`${apiUrl}/parentId/${parentId}`);
  }

  /**
   * Crear un nuevo diagnóstico médico
   */
  create(medicalDiagnostic: Partial<MedicalDiagnostic>): Observable<ApiResponse<MedicalDiagnostic>> {
    return this.http.post<ApiResponse<MedicalDiagnostic>>(`${apiUrl}`, medicalDiagnostic);
  }

  /**
   * Actualizar un diagnóstico médico existente
   */
  update(id: number, medicalDiagnostic: Partial<MedicalDiagnostic>): Observable<ApiResponse<MedicalDiagnostic>> {
    return this.http.put<ApiResponse<MedicalDiagnostic>>(`${apiUrl}/${id}`, medicalDiagnostic);
  }

  /**
   * Eliminar un diagnóstico médico
   */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }

  /**
   * Agregar un sub-diagnóstico a un diagnóstico padre
   */
  addSubDiagnostic(parentDiagnosticId: number, subDiagnosticId: number): Observable<ApiResponse<MedicalDiagnostic>> {
    return this.http.put<ApiResponse<MedicalDiagnostic>>(`${apiUrl}/${parentDiagnosticId}/add-sub-diagnostic/${subDiagnosticId}`, {});
  }

  /**
   * Remover un sub-diagnóstico de un diagnóstico padre
   */
  removeSubDiagnostic(parentDiagnosticId: number, subDiagnosticId: number): Observable<ApiResponse<MedicalDiagnostic>> {
    return this.http.delete<ApiResponse<MedicalDiagnostic>>(`${apiUrl}/${parentDiagnosticId}/remove-sub-diagnostic/${subDiagnosticId}`);
  }
}
