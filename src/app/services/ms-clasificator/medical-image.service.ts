import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MedicalImg, ApiResponse } from '@models/ms-clasificator';

const apiUrl = `${environment.url_backend_clasificator}/medical-images`;

@Injectable({
  providedIn: 'root'
})
export class MedicalImageService {
  constructor(private http: HttpClient) { }

  /**
   * Obtener todas las imágenes médicas
   */
  findAll(): Observable<ApiResponse<MedicalImg[]>> {
    return this.http.get<ApiResponse<MedicalImg[]>>(`${apiUrl}`);
  }

  /**
   * Obtener una imagen médica por ID
   */
  findById(id: number): Observable<ApiResponse<MedicalImg>> {
    return this.http.get<ApiResponse<MedicalImg>>(`${apiUrl}/${id}`);
  }

  /**
   * Obtener todas las imágenes médicas de un área de evaluación
   */
  findByEvaluationAreaId(evaluationAreaId: number): Observable<ApiResponse<MedicalImg[]>> {
    return this.http.get<ApiResponse<MedicalImg[]>>(`${apiUrl}/area/${evaluationAreaId}`);
  }

  /**
   * Subir una nueva imagen médica con metadatos
   */
  upload(file: File, evaluationAreaId: number, patientId?: number, folder = 'diagnostics'): Observable<ApiResponse<MedicalImg>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('evaluationAreaId', String(evaluationAreaId));

    if (patientId != null) {
      formData.append('patientId', String(patientId));
    }

    formData.append('folder', folder);

    return this.http.post<ApiResponse<MedicalImg>>(`${apiUrl}/upload`, formData);
  }

  /**
   * Asignar un paciente a una imagen médica
   */
  assignPatient(medicalImgId: number, patientId: number): Observable<ApiResponse<MedicalImg>> {
    return this.http.put<ApiResponse<MedicalImg>>(`${apiUrl}/${medicalImgId}/assign-patient/${patientId}`, {});
  }

  /**
   * Eliminar una imagen médica
   */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }

  /**
   * Remover un paciente de una imagen médica
   */
  removePatient(medicalImgId: number): Observable<ApiResponse<MedicalImg>> {
    return this.http.delete<ApiResponse<MedicalImg>>(`${apiUrl}/${medicalImgId}/remove-patient`);
  }

  /**
   * Cambiar el área de evaluación de una imagen médica
   */
  changeEvaluationArea(medicalImgId: number, evaluationAreaId: number): Observable<ApiResponse<MedicalImg>> {
    return this.http.put<ApiResponse<MedicalImg>>(
      `${apiUrl}/${medicalImgId}/change-evaluation-area/${evaluationAreaId}`,
      {}
    );
  }
}
