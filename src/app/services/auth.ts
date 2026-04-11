import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Usuario, LoginResponse } from '../interfaces/usuario';
import { OAuthService } from 'angular-oauth2-oidc';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiUrl;
  private oauthService = inject(OAuthService);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  loginConGoogle(googleToken: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/google`, {
      token: googleToken
    });
  }

  guardarSesion(token: string, usuario: Usuario) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jwt', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jwt');
    }
    return null;
  }

  getUsuario(): Usuario | null {
    if (typeof window !== 'undefined') {
      const usuario = localStorage.getItem('usuario');
      return usuario ? JSON.parse(usuario) as Usuario : null;
    }
    return null;
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jwt');
      localStorage.removeItem('usuario');
      // También limpiar la sesión del proveedor OIDC (Google) para evitar auto-login inmediato
      this.oauthService.logOut();
    }
    this.router.navigate(['/login']);
  }
}