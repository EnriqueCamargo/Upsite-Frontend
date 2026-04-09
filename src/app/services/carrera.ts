import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Carrera } from '../interfaces/carrera';

@Injectable({
  providedIn: 'root'
})
export class CarreraService {

  private apiUrl = environment.apiUrl + '/api/carreras';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Carrera[]> {
    return this.http.get<Carrera[]>(this.apiUrl);
  }
}
