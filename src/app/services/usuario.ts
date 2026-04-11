import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../interfaces/usuario';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = `${environment.apiUrl}/usuarios`;
  private http = inject(HttpClient);

  buscar(query: string): Observable<Usuario[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<Usuario[]>(`${this.apiUrl}/buscar`, { params });
  }

  getPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  seguir(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/follow`, {});
  }

  dejarDeSeguir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/follow`);
  }

  getSeguidores(id: number): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/${id}/seguidores`);
  }

  getSiguiendo(id: number): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/${id}/siguiendo`);
  }
}
