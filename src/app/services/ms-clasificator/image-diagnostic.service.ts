import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ImageDiagnostic, ApiResponse } from '@models/ms-clasificator';

const apiUrl = `${environment.url_backend_clasificator}/image-diagnostics`;

@Injectable({
  providedIn: 'root'
})
export class ImageDiagnosticService {
  constructor(private http: HttpClient) { }

  /**
   * Obtener todos los diagnósticos de imagen
   */
  findAll(): Observable<ImageDiagnostic[]> {
    return this.http.get<ImageDiagnostic[]>(`${apiUrl}`);
  }

  /**
   * Obtener un diagnóstico de imagen por ID
   */
  findById(id: number): Observable<ApiResponse<ImageDiagnostic>> {
    return this.http.get<ApiResponse<ImageDiagnostic>>(`${apiUrl}/${id}`);
  }

  /**
   * Crear un nuevo diagnóstico de imagen
   */
  create(imageDiagnostic: Partial<ImageDiagnostic>): Observable<ApiResponse<ImageDiagnostic>> {
    return this.http.post<ApiResponse<ImageDiagnostic>>(`${apiUrl}`, imageDiagnostic);
  }

  /**
   * Actualizar un diagnóstico de imagen existente
   */
  update(id: number, imageDiagnostic: Partial<ImageDiagnostic>): Observable<ApiResponse<ImageDiagnostic>> {
    return this.http.put<ApiResponse<ImageDiagnostic>>(`${apiUrl}/${id}`, imageDiagnostic);
  }

  /**
   * Eliminar un diagnóstico de imagen
   */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }
}
