import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ImageDiagnostic, ApiResponse } from '@models/ms-clasificator';

const apiUrl = `${environment.url_backend_clasificator}/api/image-diagnostics`;

@Injectable({
  providedIn: 'root'
})
export class ImageDiagnosticService {
  constructor(private http: HttpClient) { }

  findAll(): Observable<ImageDiagnostic[]> {
    return this.http.get<ImageDiagnostic[]>(`${apiUrl}`);
  }

  findById(id: number): Observable<ApiResponse<ImageDiagnostic>> {
    return this.http.get<ApiResponse<ImageDiagnostic>>(`${apiUrl}/${id}`);
  }

  findByDoctorId(doctorId: number): Observable<ApiResponse<ImageDiagnostic[]>> {
    return this.http.get<ApiResponse<ImageDiagnostic[]>>(`${apiUrl}/doctor/${doctorId}`);
  }

  findByMedicalImageId(medicalImageId: number): Observable<ApiResponse<ImageDiagnostic[]>> {
    return this.http.get<ApiResponse<ImageDiagnostic[]>>(`${apiUrl}/image/${medicalImageId}`);
  }

  create(imageDiagnostic: Partial<ImageDiagnostic>): Observable<ApiResponse<ImageDiagnostic>> {
    return this.http.post<ApiResponse<ImageDiagnostic>>(`${apiUrl}`, imageDiagnostic);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }
}