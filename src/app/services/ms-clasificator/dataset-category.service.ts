import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@models/ms-clasificator';

const apiUrl = `${environment.url_backend_clasificator}/api/dataset-categories`;

@Injectable({
  providedIn: 'root'
})
export class DatasetCategoryService {
  constructor(private http: HttpClient) { }

  findAll(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${apiUrl}`);
  }

  findById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${apiUrl}/${id}`);
  }

  findByDatasetId(datasetId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${apiUrl}/dataset/${datasetId}`);
  }

  create(datasetCategory: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${apiUrl}`, datasetCategory);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }
}