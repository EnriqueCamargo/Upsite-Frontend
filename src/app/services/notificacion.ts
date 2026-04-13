import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notificacion } from '../interfaces/notificacion';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private apiUrl = `${environment.apiUrl}/notificaciones`;
  private http = inject(HttpClient);

  listar(page: number = 0, size: number = 50): Observable<Notificacion[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<Notificacion[]>(this.apiUrl, { params });
  }

  marcarComoLeida(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/leer`, {});
  }

  getContadorPendientes(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/pendientes`);
  }
}
