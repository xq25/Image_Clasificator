import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@models/ms-clasificator';

const apiUrl = `${environment.url_backend_clasificator}/api/clinical-records`;

@Injectable({
  providedIn: 'root'
})
export class ClinicalRecordService {
  constructor(private http: HttpClient) { }

  findAll(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${apiUrl}`);
  }

  findById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${apiUrl}/${id}`);
  }

  findByPatientId(patientId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${apiUrl}/patient/${patientId}`);
  }

  create(clinicalRecord: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${apiUrl}`, clinicalRecord);
  }

  update(id: number, clinicalRecord: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${apiUrl}/${id}`, clinicalRecord);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }

  changePatient(clinicalRecordId: number, newPatientId: number): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${apiUrl}/${clinicalRecordId}/patient/${newPatientId}`, {});
  }
}