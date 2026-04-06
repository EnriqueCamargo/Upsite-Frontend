import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Publicacion } from '../interfaces/publicacion';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class PublicacionService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getFeed(carrera?: number, importancia?: string): Observable<Publicacion[]> {
    let params = new HttpParams();
    if (carrera) params = params.set('carrera', carrera);
    if (importancia) params = params.set('importancia', importancia);

    return this.http.get<Publicacion[]>(`${this.apiUrl}/publicaciones/feed`, { params });
  }
}