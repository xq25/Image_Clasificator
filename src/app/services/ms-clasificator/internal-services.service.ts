import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Doctor, Patient } from '@models/ms-clasificator';

const apiUrl = `${environment.url_backend_clasificator}/api/public/internal`;

@Injectable({
  providedIn: 'root'
})
export class InternalServicesService {
  constructor(private http: HttpClient) {}

  /** Verificar si un userId tiene relación con doctor o paciente */
  existRelation(userId: string): Observable<boolean> {
    return this.http.get<boolean>(`${apiUrl}/exist-relation/${userId}`);
  }

  /** Verificar si un userId tiene relación con un doctor */
  existRelationWithDoctor(userId: string): Observable<boolean> {
    return this.http.get<boolean>(`${apiUrl}/exist-relation-doctor/${userId}`);
  }

  /** Verificar si un userId tiene relación con un paciente */
  existRelationWithPatient(userId: string): Observable<boolean> {
    return this.http.get<boolean>(`${apiUrl}/exist-relation-patient/${userId}`);
  }

  /**
   * Registrar un doctor sin pasar por el flujo de registro estándar.
   * Útil para generación de datos de prueba.
   */
  registerDoctor(doctor: Partial<Doctor>): Observable<boolean> {
    return this.http.post<boolean>(`${apiUrl}/register/doctor`, doctor);
  }

  /**
   * Registrar un paciente sin pasar por el flujo de registro estándar.
   * Útil para generación de datos de prueba.
   */
  registerPatient(patient: Partial<Patient>): Observable<boolean> {
    return this.http.post<boolean>(`${apiUrl}/register/patient`, patient);
  }
}