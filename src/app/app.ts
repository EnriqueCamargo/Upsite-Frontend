import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { AuthService } from './services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Upsite-Frontend');
  private authService = inject(AuthService);

  get isLoggedIn() {
    const logueado = this.authService.isLoggedIn();
    if (!logueado) return false;

    const usuario = this.authService.getUsuario();
    // Si es estudiante y no tiene datos, ocultamos el navbar para forzar el setup
    if (usuario?.rol === 'ESTUDIANTE' && (!usuario.idCarrera || !usuario.idGrupo)) {
      return false;
    }
    
    return true;
  }
}
