import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UIConfig, ApiResponse } from '@models/ms-clasificator';

const apiUrl = `${environment.url_backend_clasificator}/api/datasets`;

@Injectable({
  providedIn: 'root'
})
export class UIConfigService {
  constructor(private http: HttpClient) { }

  findAll(): Observable<ApiResponse<UIConfig[]>> {
    return this.http.get<ApiResponse<UIConfig[]>>(`${apiUrl}`);
  }

  findById(id: number): Observable<ApiResponse<UIConfig>> {
    return this.http.get<ApiResponse<UIConfig>>(`${apiUrl}/${id}`);
  }

  findByMedicalDiagnosticId(medicalDiagnosticId: number): Observable<ApiResponse<UIConfig[]>> {
    return this.http.get<ApiResponse<UIConfig[]>>(`${apiUrl}/diagnostic/${medicalDiagnosticId}`);
  }

  findByEvaluationAreaId(evaluationAreaId: number): Observable<ApiResponse<UIConfig>> {
    return this.http.get<ApiResponse<UIConfig>>(`${apiUrl}/area/${evaluationAreaId}`);
  }

  create(uiConfig: Partial<UIConfig>): Observable<ApiResponse<UIConfig>> {
    return this.http.post<ApiResponse<UIConfig>>(`${apiUrl}`, uiConfig);
  }

  update(id: number, uiConfig: Partial<UIConfig>): Observable<ApiResponse<UIConfig>> {
    return this.http.put<ApiResponse<UIConfig>>(`${apiUrl}/${id}/change-diagnostic`, uiConfig);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }

  assignToEvaluationArea(uiConfigId: number, evaluationAreaId: number): Observable<ApiResponse<UIConfig>> {
    return this.http.put<ApiResponse<UIConfig>>(`${apiUrl}/${uiConfigId}/evaluation-area/${evaluationAreaId}`, {});
  }

  removeFromEvaluationArea(uiConfigId: number): Observable<ApiResponse<UIConfig>> {
    return this.http.put<ApiResponse<UIConfig>>(`${apiUrl}/removeFromArea/${uiConfigId}`, {});
  }
} 