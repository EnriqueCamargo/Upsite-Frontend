import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Publicacion, Comentario } from '../interfaces/publicacion';
import { environment } from '../../environments/environment.development';
import { Importancia } from '../enums/importancia';
import { TipoMultimedia } from '../enums/tipo-multimedia';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class PublicacionService {

  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getFeed(carrera?: number, importancia?: Importancia, esGlobal?: boolean, grupo?: number, page: number = 0, size: number = 10): Observable<Publicacion[]> {
    let params = new HttpParams();
    if (carrera) params = params.set('carrera', carrera);
    if (importancia) params = params.set('importancia', importancia);
    if (esGlobal !== undefined) params = params.set('esGlobal', esGlobal);
    if (grupo) params = params.set('grupo', grupo);
    params = params.set('page', page.toString());
    params = params.set('size', size.toString());
    return this.http.get<Publicacion[]>(`${this.apiUrl}/publicaciones/feed`, { params });
  }

  getPublicacionesUsuario(usuarioId: number): Observable<Publicacion[]> {
    return this.http.get<Publicacion[]>(`${this.apiUrl}/publicaciones/autor/${usuarioId}`);
  }

  darLike(idPublicacion: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/publicaciones/${idPublicacion}/like`, {});
  }

  quitarLike(idPublicacion: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/publicaciones/${idPublicacion}/like`);
  }

  getComentarios(idPublicacion: number): Observable<Comentario[]> {
    return this.http.get<Comentario[]>(`${this.apiUrl}/publicaciones/${idPublicacion}/comentarios`);
  }

  comentar(idPublicacion: number, texto: string, idPadre?: number): Observable<Comentario> {
    return this.http.post<Comentario>(`${this.apiUrl}/publicaciones/${idPublicacion}/comentarios`, {
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

  crear(texto: string, importancia: Importancia, esGlobal: boolean, idsCarreras: number[] = [], idsGrupos: number[] = []): Observable<Publicacion> {
    const usuario = this.authService.getUsuario();
    return this.http.post<Publicacion>(`${this.apiUrl}/publicaciones`, {
        usuarioID: usuario?.id,
        texto,
        importancia,
        esGlobal,
        idsCarreras: idsCarreras,
        idsGrupos: idsGrupos,
        multimedia: []
    });
}

subirMultimedia(idPublicacion: number, url: string, tipo: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/publicaciones/${idPublicacion}/multimedia`, {
        ruta: url,
        tipoMultimedia: tipo.startsWith('image') ? TipoMultimedia.IMAGE : TipoMultimedia.VIDEO,
        idPublicacion: idPublicacion
    });
}
}