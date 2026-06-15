import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@models/ms-clasificator';
import { MedicalImg, MedicalImgExtended } from '@app/models/ms-clasificator/MedicalImage/MedicalImg';

const apiUrl = `${environment.url_backend_clasificator}/api/medical-images`;

@Injectable({
  providedIn: 'root'
})
export class MedicalImageService {
  constructor(private http: HttpClient) {}

  /** Obtener todas las imágenes médicas → List<MedicalImgSummaryDTO> */
  findAll(): Observable<ApiResponse<MedicalImg[]>> {
    return this.http.get<ApiResponse<MedicalImg[]>>(`${apiUrl}`);
  }

  /** Obtener una imagen médica por ID → MedicalImgResponseDTO */
  findById(id: number): Observable<ApiResponse<MedicalImgExtended>> {
    return this.http.get<ApiResponse<MedicalImgExtended>>(`${apiUrl}/${id}`);
  }

  /** Obtener imágenes por tipo de imagen médica → List<MedicalImgResponseDTO> */
  findByMedicalImageType(medicalImageTypeId: number): Observable<ApiResponse<MedicalImgExtended[]>> {
    return this.http.get<ApiResponse<MedicalImgExtended[]>>(`${apiUrl}/image-type/${medicalImageTypeId}`);
  }

  /** Obtener imágenes por clinical record → List<MedicalImgSummaryDTO> */
  findByClinicalRecord(clinicalRecordId: number): Observable<ApiResponse<MedicalImg[]>> {
    return this.http.get<ApiResponse<MedicalImg[]>>(`${apiUrl}/clinical-record/${clinicalRecordId}`);
  }

  /**
   * Subir una nueva imagen médica (multipart/form-data)
   * @param file Archivo de imagen
   * @param medicalImageTypeId ID del tipo de imagen médica
   * @param folder Carpeta destino (default: 'diagnostics')
   */
  upload(
    file: File,
    medicalImageTypeId: number,
    folder = 'diagnostics',
    clinicalRecordId?: number
  ): Observable<ApiResponse<MedicalImgExtended>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('medicalImageTypeId', String(medicalImageTypeId));
    formData.append('folder', folder);
    if (clinicalRecordId != null) {
      formData.append('clinicalRecordId', String(clinicalRecordId));
    }
    return this.http.post<ApiResponse<MedicalImgExtended>>(`${apiUrl}/upload`, formData);
  }

  /** Eliminar una imagen médica */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }
}