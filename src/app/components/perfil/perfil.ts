import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID, Inject, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { PublicacionService } from '../../services/publicacion';
import { UsuarioService } from '../../services/usuario';
import { Usuario } from '../../interfaces/usuario';
import { Publicacion } from '../../interfaces/publicacion';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, RelativeTimePipe, RouterModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class PerfilComponent implements OnInit {
  private authService = inject(AuthService);
  private publicacionService = inject(PublicacionService);
  private usuarioService = inject(UsuarioService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  usuario: Usuario | null = null;
  usuarioLogueado: Usuario | null = null;
  publicaciones: Publicacion[] = [];
  seguidores: Usuario[] = [];
  siguiendo: Usuario[] = [];
  mostrandoSeguidores = false;
  mostrandoSiguiendo = false;

  // Paginación
  pagina = 0;
  size = 10;
  hayMas = true;
  cargandoMas = false;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.usuarioLogueado = this.authService.getUsuario();
      
      this.route.params.subscribe(params => {
        const id = params['id'];
        const targetId = id ? Number(id) : (this.usuarioLogueado?.id);
        
        if (targetId) {
          // Si cambiamos de usuario, reseteamos vista pero intentamos recuperar caché
          if (this.usuario?.id !== targetId) {
            this.cargarUsuario(targetId);
          }
        }
      });
    }
  }

  cargarUsuario(id: number) {
    this.usuarioService.getPorId(id).subscribe({
      next: (user) => {
        this.usuario = user;
        this.intentarRecuperarCache(id);
        this.cargarSeguidoresYSiguiendo();
        this.cdr.detectChanges();
      },
      error: (error) => console.error('Error al cargar usuario', error)
    });
  }

  intentarRecuperarCache(usuarioId: number) {
    const cache = this.publicacionService.getCachedPerfil(usuarioId);
    if (cache) {
      this.publicaciones = cache.publicaciones;
      this.pagina = cache.pagina;
      this.hayMas = cache.hayMas;
    } else {
      this.cargarPublicaciones(true);
    }
  }

  cargarPublicaciones(reset = false) {
    if (reset) {
      this.pagina = 0;
      this.hayMas = true;
      this.publicaciones = [];
    }

    if (!this.usuario || !this.hayMas || this.cargandoMas) return;

    this.cargandoMas = true;
    this.publicacionService.getPublicacionesUsuario(this.usuario.id, this.pagina, this.size).subscribe({
      next: (data) => {
        if (data.length < this.size) {
          this.hayMas = false;
        }
        
        if (reset) {
          this.publicaciones = data;
        } else {
          this.publicaciones = [...this.publicaciones, ...data];
        }
        
        this.pagina++;
        this.cargandoMas = false;
        
        // Actualizar caché en el servicio
        this.publicacionService.updateCachedPerfil(this.usuario!.id, this.publicaciones, this.pagina, this.hayMas);
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar publicaciones', error);
        this.cargandoMas = false;
        this.cdr.detectChanges();
      }
    });
  }

  @HostListener('window:scroll')
  onScroll() {
    if (!isPlatformBrowser(this.platformId)) return;

    const pos = (document.documentElement.scrollTop || document.body.scrollTop) + document.documentElement.offsetHeight;
    const max = document.documentElement.scrollHeight;

    if (pos > max - 200) {
      this.cargarPublicaciones();
    }
  }

  cargarSeguidoresYSiguiendo() {
    if (this.usuario) {
      this.usuarioService.getSeguidores(this.usuario.id).subscribe(data => {
        this.seguidores = data;
        this.cdr.detectChanges();
      });
      this.usuarioService.getSiguiendo(this.usuario.id).subscribe(data => {
        this.siguiendo = data;
        this.cdr.detectChanges();
      });
    }
  }

  toggleFollow() {
    if (!this.usuario) return;

    if (this.usuario.loSigo) {
      this.usuarioService.dejarDeSeguir(this.usuario.id).subscribe(() => {
        this.cargarUsuario(this.usuario!.id);
      });
    } else {
      this.usuarioService.seguir(this.usuario.id).subscribe(() => {
        this.cargarUsuario(this.usuario!.id);
      });
    }
  }

  esMiPerfil(): boolean {
    return this.usuario?.id === this.usuarioLogueado?.id;
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
