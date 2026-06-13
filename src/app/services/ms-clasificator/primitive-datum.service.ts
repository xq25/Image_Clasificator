import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@models/ms-clasificator';
import { PrimitiveDatum } from '@models/ms-clasificator/PrimitiveDatum/PrimitiveDatum';

const apiUrl = `${environment.url_backend_clasificator}/api/primitive-datums`;

@Injectable({
  providedIn: 'root'
})
export class PrimitiveDatumService {
  constructor(private http: HttpClient) {}

  /** Obtener todos los primitive datums → List<PrimitiveDatumResponseDTO> */
  findAll(): Observable<ApiResponse<PrimitiveDatum[]>> {
    return this.http.get<ApiResponse<PrimitiveDatum[]>>(`${apiUrl}`);
  }

  /** Obtener un primitive datum por ID → PrimitiveDatumResponseDTO */
  findById(id: number): Observable<ApiResponse<PrimitiveDatum>> {
    return this.http.get<ApiResponse<PrimitiveDatum>>(`${apiUrl}/${id}`);
  }

  /** Crear un nuevo primitive datum → PrimitiveDatumResponseDTO */
  create(dto: Partial<PrimitiveDatum>): Observable<ApiResponse<PrimitiveDatum>> {
    return this.http.post<ApiResponse<PrimitiveDatum>>(`${apiUrl}`, dto);
  }

  /** Actualizar un primitive datum → PrimitiveDatumResponseDTO */
  update(id: number, dto: Partial<PrimitiveDatum>): Observable<ApiResponse<PrimitiveDatum>> {
    return this.http.put<ApiResponse<PrimitiveDatum>>(`${apiUrl}/${id}`, dto);
  }

  /** Eliminar un primitive datum */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${apiUrl}/${id}`);
  }
}
