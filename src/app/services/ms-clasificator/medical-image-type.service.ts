import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MedicalImageType, MedicalImageTypeExtended, ApiResponse } from '@models/ms-clasificator';

const apiUrl = `${environment.url_backend_clasificator}/api/medical-image-types`;

@Injectable({
  providedIn: 'root'
})
export class MedicalImageTypeService {
  constructor(private http: HttpClient) {}

  /** Obtener todos los tipos de imagen médica → List<MedicalImageTypeSummaryDTO> */
  findAll(): Observable<ApiResponse<MedicalImageType[]>> {
    return this.http.get<ApiResponse<MedicalImageType[]>>(`${apiUrl}`);
  }

  /** Obtener un tipo de imagen médica por ID → MedicalImageTypeResponseDTO */
  findById(id: number): Observable<ApiResponse<MedicalImageTypeExtended>> {
    return this.http.get<ApiResponse<MedicalImageTypeExtended>>(`${apiUrl}/${id}`);
  }

  /** Obtener tipos de imagen por área de evaluación → List<MedicalImageTypeSummaryDTO> */
  findByEvaluationAreaId(evaluationAreaId: number): Observable<ApiResponse<MedicalImageType[]>> {
    return this.http.get<ApiResponse<MedicalImageType[]>>(`${apiUrl}/area/${evaluationAreaId}`);
  }

  /** Crear un nuevo tipo de imagen médica → MedicalImageTypeResponseDTO */
  create(dto: Partial<MedicalImageType>): Observable<ApiResponse<MedicalImageTypeExtended>> {
    return this.http.post<ApiResponse<MedicalImageTypeExtended>>(`${apiUrl}`, dto);
  }

  /** Actualizar un tipo de imagen médica → MedicalImageTypeResponseDTO */
  update(id: number, dto: Partial<MedicalImageType>): Observable<ApiResponse<MedicalImageTypeExtended>> {
    return this.http.put<ApiResponse<MedicalImageTypeExtended>>(`${apiUrl}/${id}`, dto);
  }

  /** Eliminar un tipo de imagen médica */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }

  /** Asignar un área de evaluación a un tipo de imagen → MedicalImageTypeResponseDTO */
  assignEvaluationArea(id: number, evaluationAreaId: number): Observable<ApiResponse<MedicalImageTypeExtended>> {
    return this.http.post<ApiResponse<MedicalImageTypeExtended>>(
      `${apiUrl}/${id}/evaluation-area/${evaluationAreaId}`,
      {}
    );
  }

  /** Remover el área de evaluación de un tipo de imagen → MedicalImageTypeResponseDTO */
  removeEvaluationArea(id: number): Observable<ApiResponse<MedicalImageTypeExtended>> {
    return this.http.delete<ApiResponse<MedicalImageTypeExtended>>(`${apiUrl}/${id}/evaluation-area`);
  }
}
