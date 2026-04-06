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

  darLike(idPublicacion: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/publicaciones/${idPublicacion}/like`, {});
  }

  quitarLike(idPublicacion: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/publicaciones/${idPublicacion}/like`);
  }

  getComentarios(idPublicacion: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/publicaciones/${idPublicacion}/comentarios`);
  }

  comentar(idPublicacion: number, texto: string, idPadre?: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/publicaciones/${idPublicacion}/comentarios`, {
      texto,
      idPadre: idPadre ?? null
    });
  }

  darLikeComentario(idComentario: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/publicaciones/comentarios/${idComentario}/like`, {});
  }

  quitarLikeComentario(idComentario: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/publicaciones/comentarios/${idComentario}/like`);
  }

  crear(texto: string, importancia: string, esGlobal: boolean): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/publicaciones`, {
        texto,
        importancia,
        esGlobal,
        idsGrupos: []
    });
}

subirMultimedia(idPublicacion: number, url: string, tipo: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/publicaciones/${idPublicacion}/multimedia`, {
        ruta: url,
        tipoMultimedia: tipo.startsWith('image') ? 'IMAGE' : 'VIDEO'
    });
}
}