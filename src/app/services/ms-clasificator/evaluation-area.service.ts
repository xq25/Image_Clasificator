import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EvaluationArea, ApiResponse } from '@models/ms-clasificator';

const apiUrl = `${environment.url_backend_clasificator}/api/evaluation-areas`;

@Injectable({
  providedIn: 'root'
})
export class EvaluationAreaService {
  constructor(private http: HttpClient) {}

  /** Obtener todas las áreas de evaluación → List<EvaluationAreaResponseDTO> */
  findAll(): Observable<ApiResponse<EvaluationArea[]>> {
    return this.http.get<ApiResponse<EvaluationArea[]>>(`${apiUrl}`);
  }

  /** Obtener un área por ID → EvaluationAreaResponseDTO */
  findById(id: number): Observable<ApiResponse<EvaluationArea>> {
    return this.http.get<ApiResponse<EvaluationArea>>(`${apiUrl}/${id}`);
  }

  /** Crear un área de evaluación → EvaluationAreaResponseDTO */
  create(evaluationArea: Partial<EvaluationArea>): Observable<ApiResponse<EvaluationArea>> {
    return this.http.post<ApiResponse<EvaluationArea>>(`${apiUrl}`, evaluationArea);
  }

  /** Actualizar un área de evaluación → EvaluationAreaResponseDTO */
  update(id: number, evaluationArea: Partial<EvaluationArea>): Observable<ApiResponse<EvaluationArea>> {
    return this.http.put<ApiResponse<EvaluationArea>>(`${apiUrl}/${id}`, evaluationArea);
  }

  /** Eliminar un área de evaluación */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }
}