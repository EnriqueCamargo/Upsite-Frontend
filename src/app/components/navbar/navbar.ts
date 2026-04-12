import { Component, inject, PLATFORM_ID, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { UsuarioService } from '../../services/usuario';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../interfaces/usuario';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  standalone: true
})
export class NavbarComponent implements OnInit {
  private authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  mostrarConfirmacion = false;
  searchText = '';
  searchResults: Usuario[] = [];
  mostrarResultados = false;
  esAdmin = false;
  cargandoBusqueda = false;

  ngOnInit() {
    const usuario = this.authService.getUsuario();
    this.esAdmin = usuario?.rol === 'ADMIN';
  }

  // Forzar búsqueda al presionar Enter o botón
  onSearch() {
    const query = this.searchText.trim();
    if (!query || query.length < 2) {
      this.searchResults = [];
      this.mostrarResultados = false;
      this.cdr.detectChanges();
      return;
    }

    this.cargandoBusqueda = true;
    this.mostrarResultados = true; // Mostrar el contenedor (con loading) de inmediato
    this.cdr.detectChanges();

    this.usuarioService.buscar(query, 0, 5).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.cargandoBusqueda = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargandoBusqueda = false;
        this.cdr.detectChanges();
      }
    });
  }

  cerrarResultados() {
    this.mostrarResultados = false;
    this.cdr.detectChanges();
  }

  irAPerfil(id: number) {
    this.router.navigate(['/perfil', id]);
    this.searchText = '';
    this.mostrarResultados = false;
  }

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
