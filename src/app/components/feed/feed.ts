import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PublicacionService } from '../../services/publicacion';
import { Publicacion } from '../../interfaces/publicacion';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule],
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
          this.publicaciones = data;
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

  darLike(publicacion: Publicacion) {
    publicacion.meGusta = !publicacion.meGusta;
    publicacion.totalLikes += publicacion.meGusta ? 1 : -1;
  }

  toggleComentarios(publicacion: Publicacion) {
    // lo implementamos después
  }
}