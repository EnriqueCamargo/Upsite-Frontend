import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { Publicacion } from '../interfaces/publicacion';
import { environment } from '../../environments/environment.development';
import { Importancia } from '../enums/importancia';
import { TipoMultimedia } from '../enums/tipo-multimedia';
import { AuthService } from './auth';

interface CachePerfil {
  publicaciones: Publicacion[];
  pagina: number;
  hayMas: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PublicacionService {

  private apiUrl = environment.apiUrl;
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  // Caché para perfiles: ID Usuario -> Datos de publicaciones
  private cachePerfiles = new Map<number, CachePerfil>();

  // Caché para el Feed principal
  private cacheFeed: Publicacion[] = [];
  private feedPagina = 0;
  private feedHayMas = true;
  private filtrosActuales: any = null;

  getFeed(carrera?: number, importancia?: Importancia, esGlobal?: boolean, grupo?: number, page: number = 0, size: number = 10, forceRefresh: boolean = false): Observable<Publicacion[]> {
    // Si no es refresco forzado y ya tenemos datos en memoria para esa página, los devolvemos
    if (!forceRefresh && page === 0 && this.cacheFeed.length > 0) {
      return of(this.cacheFeed);
    }

    let params = new HttpParams();
    if (carrera) params = params.set('carrera', carrera);
    if (importancia) params = params.set('importancia', importancia);
    if (esGlobal !== undefined) params = params.set('esGlobal', esGlobal);
    if (grupo) params = params.set('grupo', grupo);
    params = params.set('page', page.toString());
    params = params.set('size', size.toString());
    
    return this.http.get<Publicacion[]>(`${this.apiUrl}/publicaciones/feed`, { params }).pipe(
      tap(data => {
        if (page === 0) {
          this.cacheFeed = data;
        } else {
          this.cacheFeed = [...this.cacheFeed, ...data];
        }
        this.feedPagina = page;
        this.feedHayMas = data.length === size;
      })
    );
  }

  // Métodos para gestionar el estado del feed
  getCachedFeed() {
    return {
      publicaciones: this.cacheFeed,
      pagina: this.feedPagina,
      hayMas: this.feedHayMas,
      filtros: this.filtrosActuales
    };
  }

  setFiltrosCache(filtros: any) {
    this.filtrosActuales = filtros;
  }

  clearFeedCache() {
    this.cacheFeed = [];
    this.feedPagina = 0;
    this.feedHayMas = true;
  }

  getPublicacionesUsuario(usuarioId: number, page: number = 0, size: number = 10, forceRefresh: boolean = false): Observable<Publicacion[]> {
    // Si es la página 0 y no forzamos refresco, intentamos sacar de caché
    if (page === 0 && !forceRefresh && this.cachePerfiles.has(usuarioId)) {
      return of(this.cachePerfiles.get(usuarioId)!.publicaciones);
    }

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Publicacion[]>(`${this.apiUrl}/publicaciones/autor/${usuarioId}`, { params }).pipe(
      tap((data: Publicacion[]) => {
        if (page === 0) {
          // Guardar primera página en caché
          this.cachePerfiles.set(usuarioId, {
            publicaciones: data,
            pagina: 1,
            hayMas: data.length === size
          });
        }
      })
    );
  }

  // Método para obtener el estado de la caché de un perfil
  getCachedPerfil(usuarioId: number): CachePerfil | undefined {
    return this.cachePerfiles.get(usuarioId);
  }

  // Actualizar la caché tras cargar más (scroll infinito)
  updateCachedPerfil(usuarioId: number, publicaciones: Publicacion[], pagina: number, hayMas: boolean) {
    this.cachePerfiles.set(usuarioId, { publicaciones, pagina, hayMas });
  }

  // Limpiar caché de un perfil (útil tras crear una nueva publicación)
  clearCachePerfil(usuarioId: number) {
    this.cachePerfiles.delete(usuarioId);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/publicaciones/${id}`);
  }

  darLike(idPublicacion: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/publicaciones/${idPublicacion}/like`, {});
  }

  quitarLike(idPublicacion: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/publicaciones/${idPublicacion}/like`);
  }

  darLikeComentario(idComentario: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/publicaciones/comentarios/${idComentario}/like`, {});
  }

  quitarLikeComentario(idComentario: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/publicaciones/comentarios/${idComentario}/like`);
  }

  getComentarios(idPublicacion: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/publicaciones/${idPublicacion}/comentarios`);
  }

  getRespuestas(idComentario: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/publicaciones/comentarios/${idComentario}/respuestas`);
  }

  comentar(idPublicacion: number, texto: string, idPadre?: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/publicaciones/${idPublicacion}/comentarios`, {
      texto,
      idPadre: idPadre ?? null
    });
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
    }).pipe(
      tap(() => {
        if (usuario) this.clearCachePerfil(usuario.id);
      })
    );
  }

  subirMultimedia(idPublicacion: number, url: string, tipo: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/publicaciones/${idPublicacion}/multimedia`, {
        ruta: url,
        tipoMultimedia: tipo.startsWith('image') ? TipoMultimedia.IMAGE : TipoMultimedia.VIDEO,
        idPublicacion: idPublicacion
    });
  }
}
