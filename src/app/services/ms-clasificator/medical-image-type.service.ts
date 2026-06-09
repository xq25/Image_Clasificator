import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@models/ms-clasificator';

const apiUrl = `${environment.url_backend_clasificator}/api/medical-image-types`;

@Injectable({
  providedIn: 'root'
})
export class MedicalImageTypeService {
  constructor(private http: HttpClient) { }

  findAll(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${apiUrl}`);
  }

  findById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${apiUrl}/${id}`);
  }

  findByEvaluationAreaId(evaluationAreaId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${apiUrl}/area/${evaluationAreaId}`);
  }

  create(medicalImageType: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${apiUrl}`, medicalImageType);
  }

  update(id: number, medicalImageType: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${apiUrl}/${id}`, medicalImageType);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }

  assignEvaluationArea(id: number, evaluationAreaId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${apiUrl}/${id}/evaluation-area/${evaluationAreaId}`, {});
  }

  removeEvaluationArea(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${apiUrl}/${id}/evaluation-area`);
  }
}