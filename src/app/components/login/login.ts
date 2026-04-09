import { Component } from '@angular/core';
import { OAuthService, AuthConfig } from 'angular-oauth2-oidc';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment.development';
import { LoginResponse } from '../../interfaces/usuario';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  constructor(
    private oauthService: OAuthService,
    private authService: AuthService,
    private router: Router
  ) {
    if (typeof window !== 'undefined') {
      const googleAuthConfig: AuthConfig = {
        issuer: 'https://accounts.google.com',
        redirectUri: window.location.origin + '/login',
        clientId: environment.googleClientId,
        scope: 'openid profile email',
        strictDiscoveryDocumentValidation: false
      };

      this.oauthService.configure(googleAuthConfig);
      this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
        const idToken = this.oauthService.getIdToken();
        if (idToken) {
          this.authService.loginConGoogle(idToken).subscribe({
            next: (response: LoginResponse) => {
              this.authService.guardarSesion(response.token, response.usuario);
              this.router.navigate(['/feed']);
            },
            error: (err) => {
            console.error('Error al iniciar sesión', err);
            if (err.status === 401) {
                alert('Solo se permiten correos institucionales de upsin.edu.mx');
              }
            }
          });
        }
      });
    }
  }

  loginConGoogle() {
    this.oauthService.initImplicitFlow();
  }
}