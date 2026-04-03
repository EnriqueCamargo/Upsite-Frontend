import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8080';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  loginConGoogle(googleToken: string) {
    return this.http.post<any>(`${this.apiUrl}/auth/google`, {
      token: googleToken
    });
  }

  guardarSesion(token: string, usuario: any) {
    localStorage.setItem('jwt', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }

  getToken(): string | null {
    return localStorage.getItem('jwt');
  }

  getUsuario(): any {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  logout() {
    localStorage.removeItem('jwt');
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }
}