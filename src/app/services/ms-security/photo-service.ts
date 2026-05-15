import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PhotoService {

  private apiUrl = `${environment.url_backend}/api/photos`;

  constructor(private http: HttpClient) {}

  // Sube la foto y retorna la URL
  uploadPhoto(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/upload`, formData);
  }

  // Elimina la foto por URL
  deletePhoto(url: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/delete`, {
      params: { url }
    });
  }
}