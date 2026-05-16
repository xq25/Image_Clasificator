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
  findAll(): Observable<MedicalImg[]> {
    return this.http.get<MedicalImg[]>(`${apiUrl}`);
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
   * Crear una nueva imagen médica
   */
  create(medicalImg: Partial<MedicalImg>): Observable<ApiResponse<MedicalImg>> {
    return this.http.post<ApiResponse<MedicalImg>>(`${apiUrl}`, medicalImg);
  }

  /**
   * Actualizar una imagen médica existente
   */
  update(id: number, medicalImg: Partial<MedicalImg>): Observable<ApiResponse<MedicalImg>> {
    return this.http.put<ApiResponse<MedicalImg>>(`${apiUrl}/${id}`, medicalImg);
  }

  /**
   * Eliminar una imagen médica
   */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }

  /**
   * Asignar un paciente a una imagen médica
   */
  assignPatient(medicalImgId: number, patientId: number): Observable<ApiResponse<MedicalImg>> {
    return this.http.put<ApiResponse<MedicalImg>>(`${apiUrl}/${medicalImgId}/assign-patient/${patientId}`, {});
  }

  /**
   * Remover un paciente de una imagen médica
   */
  removePatient(medicalImgId: number): Observable<ApiResponse<MedicalImg>> {
    return this.http.delete<ApiResponse<MedicalImg>>(`${apiUrl}/${medicalImgId}/remove-patient`);
  }
}
