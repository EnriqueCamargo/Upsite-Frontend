import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { Usuario } from '../interfaces/usuario';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = `${environment.apiUrl}/usuarios`;
  private http = inject(HttpClient);

  // Caché simple para perfiles de usuario
  private cacheUsuarios = new Map<number, Usuario>();

  // Caché para Administración
  private cacheAdminUsuarios: Usuario[] = [];
  private adminPagina = 0;
  private adminHayMas = true;
  private adminSearchText = '';

  buscar(query: string, page: number = 0, size: number = 10): Observable<Usuario[]> {
    const params = new HttpParams()
      .set('q', query)
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<Usuario[]>(`${this.apiUrl}/buscar`, { params });
  }

  getPorId(id: number, forceRefresh: boolean = false): Observable<Usuario> {
    if (!forceRefresh && this.cacheUsuarios.has(id)) {
      return of(this.cacheUsuarios.get(id)!);
    }
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`).pipe(
      tap(user => this.cacheUsuarios.set(id, user))
    );
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

  asignarGrupo(idUsuario: number, idGrupo: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${idUsuario}/asignar-grupo/${idGrupo}`, {});
  }

  actualizarAdmin(idUsuario: number, dto: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${idUsuario}/actualizar`, dto).pipe(
      tap(user => this.cacheUsuarios.set(idUsuario, user))
    );
  }

  getAll(page: number = 0, size: number = 20, forceRefresh: boolean = false): Observable<Usuario[]> {
    if (!forceRefresh && page === 0 && this.cacheAdminUsuarios.length > 0) {
      return of(this.cacheAdminUsuarios);
    }

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Usuario[]>(this.apiUrl, { params }).pipe(
      tap(data => {
        if (page === 0) {
          this.cacheAdminUsuarios = data;
        } else {
          this.cacheAdminUsuarios = [...this.cacheAdminUsuarios, ...data];
        }
        this.adminPagina = page;
        this.adminHayMas = data.length === size;
      })
    );
  }

  getCachedAdmin() {
    return {
      usuarios: this.cacheAdminUsuarios,
      pagina: this.adminPagina,
      hayMas: this.adminHayMas,
      searchText: this.adminSearchText
    };
  }

  setAdminSearchCache(text: string) {
    this.adminSearchText = text;
  }

  clearAdminCache() {
    this.cacheAdminUsuarios = [];
    this.adminPagina = 0;
    this.adminHayMas = true;
  }

  limpiarCache(id?: number) {
    if (id) {
      this.cacheUsuarios.delete(id);
    } else {
      this.cacheUsuarios.clear();
    }
  }
}
