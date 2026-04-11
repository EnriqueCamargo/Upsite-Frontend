import { Component, inject, PLATFORM_ID, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { UsuarioService } from '../../services/usuario';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../interfaces/usuario';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  standalone: true
})
export class NavbarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  mostrarConfirmacion = false;
  searchText = '';
  searchResults: Usuario[] = [];
  mostrarResultados = false;
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  ngOnInit() {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.trim().length < 2) {
          return of([]);
        }
        return this.usuarioService.buscar(query);
      })
    ).subscribe(results => {
      this.searchResults = results;
      this.mostrarResultados = results.length > 0;
    });
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }

  onSearchChange() {
    this.searchSubject.next(this.searchText);
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
