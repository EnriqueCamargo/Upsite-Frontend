import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Grupo } from '../interfaces/grupo';

@Injectable({
  providedIn: 'root'
})
export class GrupoService {

  private apiUrl = environment.apiUrl + '/api/grupos';

  constructor(private http: HttpClient) {}

  getAllByCarrera(carreraId: number): Observable<Grupo[]> {
    return this.http.get<Grupo[]>(`${this.apiUrl}/carrera/${carreraId}`);
  }
}
