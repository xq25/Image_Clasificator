import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@models/ms-clasificator';
import { ImageDiagnostic, ImageDiagnosticExtended } from '@app/models/ms-clasificator/ImageDiagnostic/ImageDiagnostic';

const apiUrl = `${environment.url_backend_clasificator}/api/image-diagnostics`;

@Injectable({
  providedIn: 'root'
})
export class ImageDiagnosticService {
  constructor(private http: HttpClient) {}

  /** Obtener todos los diagnósticos de imagen → List<ImageDiagnosticSummaryDTO> */
  findAll(): Observable<ImageDiagnostic[]> {
    return this.http.get<ImageDiagnostic[]>(`${apiUrl}`);
  }

  /** Obtener un diagnóstico de imagen por ID → ImageDiagnosticResponseDTO */
  findById(id: number): Observable<ApiResponse<ImageDiagnosticExtended>> {
    return this.http.get<ApiResponse<ImageDiagnosticExtended>>(`${apiUrl}/${id}`);
  }

  /** Obtener diagnósticos de imagen por doctor → List<ImageDiagnosticSummaryDTO> */
  findByDoctorId(doctorId: number): Observable<ApiResponse<ImageDiagnostic[]>> {
    return this.http.get<ApiResponse<ImageDiagnostic[]>>(`${apiUrl}/doctor/${doctorId}`);
  }

  /** Obtener diagnósticos de imagen por imagen médica → List<ImageDiagnosticSummaryDTO> */
  findByMedicalImageId(medicalImageId: number): Observable<ApiResponse<ImageDiagnostic[]>> {
    return this.http.get<ApiResponse<ImageDiagnostic[]>>(`${apiUrl}/image/${medicalImageId}`);
  }

  /** Crear un nuevo diagnóstico de imagen → ImageDiagnosticResponseDTO */
  create(imageDiagnostic: Partial<ImageDiagnostic>): Observable<ApiResponse<ImageDiagnosticExtended>> {
    return this.http.post<ApiResponse<ImageDiagnosticExtended>>(`${apiUrl}`, imageDiagnostic);
  }

  /** Eliminar un diagnóstico de imagen */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }
}