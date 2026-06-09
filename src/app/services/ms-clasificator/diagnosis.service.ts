import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@models/ms-clasificator';

const apiUrl = `${environment.url_backend_clasificator}/api/diagnosis`;

@Injectable({
  providedIn: 'root'
})
export class DiagnosisService {
  constructor(private http: HttpClient) { }

  findAll(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${apiUrl}`);
  }

  findById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${apiUrl}/${id}`);
  }

  findByClinicalRecordId(clinicalRecordId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${apiUrl}/clinical-record/${clinicalRecordId}`);
  }

  create(diagnosis: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${apiUrl}`, diagnosis);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }
}