import { Component } from '@angular/core';
import { OAuthService, AuthConfig } from 'angular-oauth2-oidc';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

const googleAuthConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  redirectUri: window.location.origin,
  clientId: environment.googleClientId,
  scope: 'openid profile email',
  strictDiscoveryDocumentValidation: false
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  constructor(
    private oauthService: OAuthService,
    private authService: AuthService,
    private router: Router
  ) {
    this.oauthService.configure(googleAuthConfig);
    this.oauthService.loadDiscoveryDocumentAndTryLogin();
  }

  loginConGoogle() {
    this.oauthService.initImplicitFlow();
  }
}