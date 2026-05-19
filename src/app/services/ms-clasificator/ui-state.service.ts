import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UIState, ApiResponse } from '@models/ms-clasificator';

const apiUrl = `${environment.url_backend_clasificator}/api/ui-states`;

@Injectable({
  providedIn: 'root'
})
export class UIStateService {
  constructor(private http: HttpClient) { }

  /**
   * Obtener todos los estados UI
   */
  findAll(): Observable<UIState[]> {
    return this.http.get<UIState[]>(`${apiUrl}`);
  }

  /**
   * Obtener un estado UI por ID
   */
  findById(id: number): Observable<ApiResponse<UIState>> {
    return this.http.get<ApiResponse<UIState>>(`${apiUrl}/${id}`);
  }

  /**
   * Obtener todos los estados UI de una configuración
   */
  findByUiConfigId(uiConfigId: number): Observable<ApiResponse<UIState[]>> {
    return this.http.get<ApiResponse<UIState[]>>(`${apiUrl}/config/${uiConfigId}`);
  }

  /**
   * Obtener todos los estados UI de un diagnóstico
   */
  findByMedicalDiagnosticId(medicalDiagnosticId: number): Observable<ApiResponse<UIState[]>> {
    return this.http.get<ApiResponse<UIState[]>>(`${apiUrl}/diagnostic/${medicalDiagnosticId}`);
  }

  /**
   * Crear un nuevo estado UI
   */
  create(uiState: Partial<UIState>): Observable<ApiResponse<UIState>> {
    return this.http.post<ApiResponse<UIState>>(`${apiUrl}`, uiState);
  }

  /**
   * Actualizar un estado UI existente
   */
  update(id: number, uiState: Partial<UIState>): Observable<ApiResponse<UIState>> {
    return this.http.put<ApiResponse<UIState>>(`${apiUrl}/${id}`, uiState);
  }

  /**
   * Eliminar un estado UI
   */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }
}
