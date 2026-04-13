import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Grupo } from '../interfaces/grupo';

@Injectable({
  providedIn: 'root'
})
export class GrupoService {

  private apiUrl = environment.apiUrl + '/api/grupos';
  private http = inject(HttpClient);
  private cacheGrupos = new Map<number, Grupo[]>();

  getAllByCarrera(carreraId: number): Observable<Grupo[]> {
    if (this.cacheGrupos.has(carreraId)) {
      return of(this.cacheGrupos.get(carreraId)!);
    }
    return this.http.get<Grupo[]>(`${this.apiUrl}/carrera/${carreraId}`).pipe(
      tap(grupos => this.cacheGrupos.set(carreraId, grupos))
    );
  }

  getAllByCarreraIds(carreraIds: number[]): Observable<Grupo[]> {
    if (carreraIds.length === 0) return of([]);
    
    // Podríamos ser más sofisticados y checar cuáles ya están en caché,
    // pero para simplificar hacemos la petición bulk si es necesaria.
    const params = new HttpParams().set('ids', carreraIds.join(','));
    return this.http.get<Grupo[]>(`${this.apiUrl}/carreras`, { params });
  }

  limpiarCache() {
    this.cacheGrupos.clear();
  }
}
