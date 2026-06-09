import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MedicalImg, ApiResponse } from '@models/ms-clasificator';

const apiUrl = `${environment.url_backend_clasificator}/api/medical-images`;

@Injectable({
  providedIn: 'root'
})
export class MedicalImageService {
  constructor(private http: HttpClient) { }

  findAll(): Observable<ApiResponse<MedicalImg[]>> {
    return this.http.get<ApiResponse<MedicalImg[]>>(`${apiUrl}`);
  }

  findById(id: number): Observable<ApiResponse<MedicalImg>> {
    return this.http.get<ApiResponse<MedicalImg>>(`${apiUrl}/${id}`);
  }

  findByMedicalImageType(medicalImageTypeId: number): Observable<ApiResponse<MedicalImg[]>> {
    return this.http.get<ApiResponse<MedicalImg[]>>(`${apiUrl}/image-type/${medicalImageTypeId}`);
  }

  findByClinicalRecord(clinicalRecordId: number): Observable<ApiResponse<MedicalImg[]>> {
    return this.http.get<ApiResponse<MedicalImg[]>>(`${apiUrl}/clinical-record/${clinicalRecordId}`);
  }

  upload(file: File, medicalImageTypeId: number, folder = 'diagnostics'): Observable<ApiResponse<MedicalImg>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('medicalImageTypeId', String(medicalImageTypeId));
    formData.append('folder', folder);
    return this.http.post<ApiResponse<MedicalImg>>(`${apiUrl}/upload`, formData);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }
}