import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ImageDoctorDiagnostics, ImageDoctorDiagnosticsExtended, ApiResponse } from '@models/ms-clasificator';

const apiUrl = `${environment.url_backend_clasificator}/api/image-doctor-diagnostics`;

@Injectable({
  providedIn: 'root'
})
export class ImageDoctorDiagnosticsService {
  constructor(private http: HttpClient) {}

  /** Obtener todas las asociaciones imagen-diagnóstico → List<ImageDoctorDiagnosticsSummaryDTO> */
  findAll(): Observable<ApiResponse<ImageDoctorDiagnostics[]>> {
    return this.http.get<ApiResponse<ImageDoctorDiagnostics[]>>(`${apiUrl}`);
  }

  /** Obtener una asociación por ID → ImageDoctorDiagnosticsResponseDTO */
  findById(id: number): Observable<ApiResponse<ImageDoctorDiagnosticsExtended>> {
    return this.http.get<ApiResponse<ImageDoctorDiagnosticsExtended>>(`${apiUrl}/${id}`);
  }

  /** Obtener asociaciones por diagnóstico de imagen → List<ImageDoctorDiagnosticsSummaryDTO> */
  findByImageDiagnosticId(imageDiagnosticId: number): Observable<ApiResponse<ImageDoctorDiagnostics[]>> {
    return this.http.get<ApiResponse<ImageDoctorDiagnostics[]>>(`${apiUrl}/image-diagnostic/${imageDiagnosticId}`);
  }

  /** Crear una nueva asociación imagen-diagnóstico → ImageDoctorDiagnosticsResponseDTO */
  create(dto: Partial<ImageDoctorDiagnostics>): Observable<ApiResponse<ImageDoctorDiagnosticsExtended>> {
    return this.http.post<ApiResponse<ImageDoctorDiagnosticsExtended>>(`${apiUrl}`, dto);
  }

  /** Eliminar una asociación imagen-diagnóstico */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }
}
