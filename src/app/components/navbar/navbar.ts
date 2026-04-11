import { Component, inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  standalone: true
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  mostrarConfirmacion = false;

  isLoggedIn() {
    if (isPlatformBrowser(this.platformId)) {
      return this.authService.isLoggedIn();
    }
    return false;
  }

  toggleConfirmacion() {
    this.mostrarConfirmacion = !this.mostrarConfirmacion;
  }

  confirmarLogout() {
    this.authService.logout();
    this.mostrarConfirmacion = false;
  }

  cancelarLogout() {
    this.mostrarConfirmacion = false;
  }
}
