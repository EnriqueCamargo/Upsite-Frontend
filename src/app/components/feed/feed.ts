import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublicacionService } from '../../services/publicacion';
import { Publicacion } from '../../interfaces/publicacion';
import { SupabaseService } from '../../services/supabase';

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
  publicando = false;
  archivosSeleccionados: File[] = [];

  nuevaPublicacion = {
    texto: '',
    importancia: 'PUBLICACION',
    esGlobal: true
  };

  constructor(
    private publicacionService: PublicacionService,
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarFeed();
    } else {
      this.cargando = false;
    }
  }

  cargarFeed() {
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

  onArchivosSeleccionados(event: any) {
    this.archivosSeleccionados = Array.from(event.target.files);
  }

  async publicar() {
    if (!this.nuevaPublicacion.texto.trim()) return;
    this.publicando = true;

    this.publicacionService.crear(
        this.nuevaPublicacion.texto,
        this.nuevaPublicacion.importancia,
        this.nuevaPublicacion.esGlobal
    ).subscribe({
        next: async (publicacion) => {
            if (this.archivosSeleccionados.length > 0) {
                for (const archivo of this.archivosSeleccionados) {
                    const url = await this.supabaseService.subirArchivo(archivo);
                    await this.publicacionService.subirMultimedia(publicacion.id, url, archivo.type).toPromise();
                }
            }
            this.nuevaPublicacion.texto = '';
            this.archivosSeleccionados = [];
            this.publicando = false;
            this.cargarFeed();
        },
        error: (err) => {
            console.error('Error al publicar', err);
            this.publicando = false;
        }
    });
}
toggleLikeComentario(publicacion: Publicacion, comentario: any) {
  if (comentario.meGusta) {
    this.publicacionService.quitarLikeComentario(comentario.id).subscribe({
      next: () => {
        comentario.meGusta = false;
        comentario.totalLikes--;
        this.cdr.detectChanges();
      }
    });
  } else {
    this.publicacionService.darLikeComentario(comentario.id).subscribe({
      next: () => {
        comentario.meGusta = true;
        comentario.totalLikes++;
        this.cdr.detectChanges();
      }
    });
  }
}
}