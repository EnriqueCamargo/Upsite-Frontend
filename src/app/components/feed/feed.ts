import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublicacionService } from '../../services/publicacion';
import { Publicacion } from '../../interfaces/publicacion';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feed.html',
  styleUrl: './feed.css'
})
export class FeedComponent implements OnInit {

  publicaciones: Publicacion[] = [];
  cargando = true;
  error = false;

  constructor(
    private publicacionService: PublicacionService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.publicacionService.getFeed().subscribe({
        next: (data) => {
          this.publicaciones = data.map(p => ({
            ...p,
            comentariosAbiertos: false,
            comentarios: [],
            nuevoComentario: ''
          }));
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar el feed', err);
          this.error = true;
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.cargando = false;
    }
  }

  toggleLike(publicacion: Publicacion) {
    if (publicacion.meGusta) {
      this.publicacionService.quitarLike(publicacion.id).subscribe({
        next: () => {
          publicacion.meGusta = false;
          publicacion.totalLikes--;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.publicacionService.darLike(publicacion.id).subscribe({
        next: () => {
          publicacion.meGusta = true;
          publicacion.totalLikes++;
          this.cdr.detectChanges();
        }
      });
    }
  }

  toggleComentarios(publicacion: Publicacion) {
    publicacion.comentariosAbiertos = !publicacion.comentariosAbiertos;
    if (publicacion.comentariosAbiertos && publicacion.comentarios?.length === 0) {
      this.publicacionService.getComentarios(publicacion.id).subscribe({
        next: (comentarios) => {
          publicacion.comentarios = comentarios;
          this.cdr.detectChanges();
        }
      });
    }
  }

  comentar(publicacion: Publicacion, idPadre?: number, textoRespuesta?: string) {
  const texto = idPadre ? textoRespuesta : publicacion.nuevoComentario;
  if (!texto?.trim()) return;

  this.publicacionService.comentar(publicacion.id, texto, idPadre).subscribe({
    next: (comentario) => {
      publicacion.comentarios?.push(comentario);
      if (idPadre) {
        const padre = publicacion.comentarios?.find(c => c.id === idPadre);
        if (padre) {
          padre.respondiendo = false;
          padre.textoRespuesta = '';
        }
      } else {
        publicacion.nuevoComentario = '';
      }
      publicacion.totalComentarios++;
      this.cdr.detectChanges();
    }
  });
}
}