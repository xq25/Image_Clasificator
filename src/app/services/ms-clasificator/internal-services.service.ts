import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Doctor, Patient } from '@app/models/ms-clasificator';

@Injectable({
  providedIn: 'root',
})
export class InternalServicesService {
  private apiUrl = `${environment.url_backend_clasificator}/api/public/internal`;

  constructor(private http: HttpClient) {}

  existRelation(userId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/exist-relation/${userId}`);
  }

  existRelationWithDoctor(userId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/exist-relation-doctor/${userId}`);
  }

  existRelationWithPatient(userId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/exist-relation-patient/${userId}`);
  }

// Estos metodos permiten la generacion de doctor y patient sin necesidad de pasar por el proceso de registro, esto es necesario para la generacion de datos de prueba
  registerDoctor(doctor:Doctor): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/register/doctor`, doctor);
  }

  registerPatient(patient: Patient): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/register/patient`, patient);
  }
}
