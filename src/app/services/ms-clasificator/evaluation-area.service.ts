import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EvaluationArea, ApiResponse } from '@models/ms-clasificator';

const apiUrl = `${environment.url_backend_clasificator}/evaluation-areas`;

@Injectable({
  providedIn: 'root'
})
export class EvaluationAreaService {
  constructor(private http: HttpClient) { }

  /**
   * Obtener todas las áreas de evaluación
   */
  findAll(): Observable<EvaluationArea[]> {
    return this.http.get<EvaluationArea[]>(`${apiUrl}`);
  }

  /**
   * Obtener un área de evaluación por ID
   */
  findById(id: number): Observable<ApiResponse<EvaluationArea>> {
    return this.http.get<ApiResponse<EvaluationArea>>(`${apiUrl}/${id}`);
  }

  /**
   * Crear una nueva área de evaluación
   */
  create(evaluationArea: Partial<EvaluationArea>): Observable<ApiResponse<EvaluationArea>> {
    return this.http.post<ApiResponse<EvaluationArea>>(`${apiUrl}`, evaluationArea);
  }

  /**
   * Actualizar un área de evaluación existente
   */
  update(id: number, evaluationArea: Partial<EvaluationArea>): Observable<ApiResponse<EvaluationArea>> {
    return this.http.put<ApiResponse<EvaluationArea>>(`${apiUrl}/${id}`, evaluationArea);
  }

  /**
   * Eliminar un área de evaluación
   */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }
}
