import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Carrera } from '../interfaces/carrera';

@Injectable({
  providedIn: 'root'
})
export class CarreraService {

  private apiUrl = environment.apiUrl + '/api/carreras';
  private http = inject(HttpClient);
  private cacheCarreras: Carrera[] | null = null;

  getAll(): Observable<Carrera[]> {
    if (this.cacheCarreras) {
      return of(this.cacheCarreras);
    }
    return this.http.get<Carrera[]>(this.apiUrl).pipe(
      tap(carreras => this.cacheCarreras = carreras)
    );
  }

  limpiarCache() {
    this.cacheCarreras = null;
  }
}
