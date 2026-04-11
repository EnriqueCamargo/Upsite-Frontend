import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth';
import { PublicacionService } from '../../services/publicacion';
import { Usuario } from '../../interfaces/usuario';
import { Publicacion } from '../../interfaces/publicacion';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, RelativeTimePipe],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class PerfilComponent implements OnInit {
  private authService = inject(AuthService);
  private publicacionService = inject(PublicacionService);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  usuario: Usuario | null = null;
  publicaciones: Publicacion[] = [];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.usuario = this.authService.getUsuario();
      if (this.usuario) {
        this.cargarPublicaciones();
      }
    }
  }

  cargarPublicaciones() {
    if (this.usuario) {
      this.publicacionService.getPublicacionesUsuario(this.usuario.id).subscribe({
        next: (data) => {
          this.publicaciones = data;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar publicaciones del usuario', error);
        }
      });
    }
  }

  darLike(publicacion: Publicacion) {
    if (publicacion.meGusta) {
      this.publicacionService.quitarLike(publicacion.id).subscribe(() => {
        publicacion.meGusta = false;
        publicacion.totalLikes--;
        this.cdr.detectChanges();
      });
    } else {
      this.publicacionService.darLike(publicacion.id).subscribe(() => {
        publicacion.meGusta = true;
        publicacion.totalLikes++;
        this.cdr.detectChanges();
      });
    }
  }
}
