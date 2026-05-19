import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UIConfig, ApiResponse } from '@models/ms-clasificator';

const apiUrl = `${environment.url_backend_clasificator}/api/ui-configs`;

@Injectable({
  providedIn: 'root'
})
export class UIConfigService {
  constructor(private http: HttpClient) { }

  /**
   * Obtener todas las configuraciones UI
   */
  findAll(): Observable<UIConfig[]> {
    return this.http.get<UIConfig[]>(`${apiUrl}`);
  }

  /**
   * Obtener una configuración UI por ID
   */
  findById(id: number): Observable<ApiResponse<UIConfig>> {
    return this.http.get<ApiResponse<UIConfig>>(`${apiUrl}/${id}`);
  }

  /**
   * Obtener todas las configuraciones UI de un diagnóstico médico
   */
  findByMedicalDiagnosticId(medicalDiagnosticId: number): Observable<ApiResponse<UIConfig[]>> {
    return this.http.get<ApiResponse<UIConfig[]>>(`${apiUrl}/diagnostic/${medicalDiagnosticId}`);
  }

  findByEvaluationAreaId(evaluationAreaId: number): Observable<ApiResponse<UIConfig>> {
    return this.http.get<ApiResponse<UIConfig>>(`${apiUrl}/area/${evaluationAreaId}`);
  }

  /**
   * Crear una nueva configuración UI
   */
  create(uiConfig: Partial<UIConfig>): Observable<ApiResponse<UIConfig>> {
    return this.http.post<ApiResponse<UIConfig>>(`${apiUrl}`, uiConfig);
  }

  /**
   * Actualizar una configuración UI existente
   */
  update(id: number, uiConfig: Partial<UIConfig>): Observable<ApiResponse<UIConfig>> {
    return this.http.put<ApiResponse<UIConfig>>(`${apiUrl}/${id}`, uiConfig);
  }

  /**
   * Eliminar una configuración UI
   */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }

  /**
   * Asignar una configuración UI a un área de evaluación
   */
  assignToEvaluationArea(uiConfigId: number, evaluationAreaId: number): Observable<ApiResponse<UIConfig>> {
    return this.http.put<ApiResponse<UIConfig>>(`${apiUrl}/${uiConfigId}/evaluation-area/${evaluationAreaId}`, {});
  }

  /**
   * Remover una configuración UI de su área de evaluación
   */
  removeFromEvaluationArea(uiConfigId: number): Observable<ApiResponse<UIConfig>> {
    return this.http.put<ApiResponse<UIConfig>>(`${apiUrl}/removeFromArea/${uiConfigId}`, {});
  }
}
