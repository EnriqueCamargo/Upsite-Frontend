import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID, Inject, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { PublicacionService } from '../../services/publicacion';
import { UsuarioService } from '../../services/usuario';
import { Usuario } from '../../interfaces/usuario';
import { Publicacion, Comentario, MultimediaPublicacion } from '../../interfaces/publicacion';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';
import { FormsModule } from '@angular/forms';
import { LightboxComponent } from '../lightbox/lightbox';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, RelativeTimePipe, RouterModule, FormsModule, LightboxComponent],
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

  // Lightbox
  lightboxAbierto = false;
  lightboxMedia: MultimediaPublicacion[] = [];
  lightboxIndex = 0;

  // Paginación
  pagina = 0;
  size = 5;
  hayMas = true;
  cargandoMas = false;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.usuarioLogueado = this.authService.getUsuario();
      
      this.route.params.subscribe(params => {
        const id = params['id'];
        const targetId = id ? Number(id) : (this.usuarioLogueado?.id);
        
        if (targetId) {
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
        this.publicacionService.updateCachedPerfil(this.usuario!.id, this.publicaciones, this.pagina, this.hayMas);
        this.cdr.detectChanges();
      },
      error: (error) => {
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
    
    // Guardar estado previo
    const loSigoAnterior = this.usuario.loSigo;
    const seguidoresAnterior = this.usuario.seguidoresCount;

    // Cambio optimista
    this.usuario.loSigo = !this.usuario.loSigo;
    this.usuario.seguidoresCount += this.usuario.loSigo ? 1 : -1;
    this.cdr.detectChanges();

    const accion = loSigoAnterior
      ? this.usuarioService.dejarDeSeguir(this.usuario.id)
      : this.usuarioService.seguir(this.usuario.id);

    accion.subscribe({
      next: () => {
        // En lugar de recargar todo el usuario, simplemente refrescamos las listas en segundo plano
        this.cargarSeguidoresYSiguiendo();
      },
      error: (err) => {
        // Revertir si falla
        if (this.usuario) {
          this.usuario.loSigo = loSigoAnterior;
          this.usuario.seguidoresCount = seguidoresAnterior;
          this.cdr.detectChanges();
        }
        alert('No se pudo procesar la acción de seguir. Inténtalo de nuevo.');
      }
    });
  }

  esMiPerfil(): boolean {
    return this.usuario?.id === this.usuarioLogueado?.id;
  }

  comentar(publicacion: any, idPadre?: number, textoRespuesta?: string) {
    const texto = idPadre ? textoRespuesta : publicacion.nuevoComentario;
    if (!texto?.trim()) return;

    if (idPadre) {
      const padre = publicacion.comentarios?.find((c: any) => c.id === idPadre);
      if (padre) {
        if (padre.enviando) return;
        padre.enviando = true;
      }
    } else {
      if (publicacion.comentando) return;
      publicacion.comentando = true;
    }

    this.publicacionService.comentar(publicacion.id, texto, idPadre).subscribe({
      next: (comentario) => {
        if (idPadre) {
          const padre = publicacion.comentarios?.find((c: any) => c.id === idPadre);
          if (padre) {
            if (!padre.respuestas) padre.respuestas = [];
            padre.respuestas.push(comentario);
            padre.respondiendo = false;
            padre.textoRespuesta = '';
            padre.totalRespuestas++;
            padre.respuestasAbiertas = true;
            padre.enviando = false;
          }
        } else {
          if (!publicacion.comentarios) publicacion.comentarios = [];
          publicacion.comentarios.push(comentario);
          publicacion.nuevoComentario = '';
          publicacion.comentando = false;
        }
        publicacion.totalComentarios++;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (idPadre) {
          const padre = publicacion.comentarios?.find((c: any) => c.id === idPadre);
          if (padre) padre.enviando = false;
        } else {
          publicacion.comentando = false;
        }
        if (err.status === 400) {
            alert(err.error.message || "Error al comentar");
        }
        this.cdr.detectChanges();
      }
    });
  }

  toggleRespuestas(comentario: Comentario) {
    comentario.respuestasAbiertas = !comentario.respuestasAbiertas;
    if (comentario.respuestasAbiertas && (!comentario.respuestas || comentario.respuestas.length === 0)) {
      this.publicacionService.getRespuestas(comentario.id).subscribe({
        next: (respuestas) => {
          comentario.respuestas = respuestas;
          this.cdr.detectChanges();
        }
      });
    }
  }

  darLike(publicacion: Publicacion) {
    const estadoAnterior = publicacion.meGusta;
    const likesAnteriores = publicacion.totalLikes;

    // Cambio optimista
    publicacion.meGusta = !publicacion.meGusta;
    publicacion.totalLikes += publicacion.meGusta ? 1 : -1;
    this.cdr.detectChanges();

    const accion = estadoAnterior 
      ? this.publicacionService.quitarLike(publicacion.id) 
      : this.publicacionService.darLike(publicacion.id);

    accion.subscribe({
      error: () => {
        publicacion.meGusta = estadoAnterior;
        publicacion.totalLikes = likesAnteriores;
        this.cdr.detectChanges();
      }
    });
  }

  toggleLikeComentario(comentario: Comentario) {
    const estadoAnterior = comentario.meGusta;
    const likesAnteriores = comentario.totalLikes;

    // Cambio optimista
    comentario.meGusta = !comentario.meGusta;
    comentario.totalLikes += comentario.meGusta ? 1 : -1;
    this.cdr.detectChanges();

    const accion = estadoAnterior
      ? this.publicacionService.quitarLikeComentario(comentario.id)
      : this.publicacionService.darLikeComentario(comentario.id);

    accion.subscribe({
      error: () => {
        comentario.meGusta = estadoAnterior;
        comentario.totalLikes = likesAnteriores;
        this.cdr.detectChanges();
      }
    });
  }

  abrirLightbox(media: MultimediaPublicacion[], index: number) {
    this.lightboxMedia = media;
    this.lightboxIndex = index;
    this.lightboxAbierto = true;
    this.cdr.detectChanges();
  }

  cerrarLightbox() {
    this.lightboxAbierto = false;
    this.cdr.detectChanges();
  }

  eliminarPublicacion(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar esta publicación?')) {
      this.publicacionService.eliminar(id).subscribe({
        next: () => {
          this.publicaciones = this.publicaciones.filter(p => p.id !== id);
          // Limpiar caché de este perfil ya que cambió
          if (this.usuario) this.publicacionService.clearCachePerfil(this.usuario.id);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          alert('No se pudo eliminar la publicación.');
        }
      });
    }
  }
}
