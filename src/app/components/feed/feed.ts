import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID, HostListener, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublicacionService } from '../../services/publicacion';
import { Publicacion, Comentario, MultimediaPublicacion } from '../../interfaces/publicacion';
import { SupabaseService } from '../../services/supabase';
import { Importancia } from '../../enums/importancia';
import { CarreraService } from '../../services/carrera';
import { Carrera } from '../../interfaces/carrera';
import { AuthService } from '../../services/auth';
import { Rol } from '../../enums/rol';
import { GrupoService } from '../../services/grupo';
import { Grupo } from '../../interfaces/grupo';
import { Usuario } from '../../interfaces/usuario';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';
import { RouterModule } from '@angular/router';
import { LightboxComponent } from '../lightbox/lightbox';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, RelativeTimePipe, RouterModule, LightboxComponent],
  templateUrl: './feed.html',
  styleUrl: './feed.css'
})
export class FeedComponent implements OnInit {

  publicaciones: Publicacion[] = [];
  carreras: Carrera[] = [];
  gruposDisponibles: Grupo[] = [];
  cargando = true;
  error = false;
  publicando = false;
  esEstudiante = false;
  esDocente = false;
  esAdmin = false;
  usuario: Usuario | null = null;
  
  archivosSeleccionados: File[] = [];
  previsualizaciones: string[] = [];

  // Lightbox
  lightboxAbierto = false;
  lightboxMedia: MultimediaPublicacion[] = [];
  lightboxIndex = 0;

  // Paginación
  pagina = 0;
  size = 5;
  hayMas = true;
  cargandoMas = false;

  filtros = {
    carrera: undefined as number | undefined,
    importancia: undefined as Importancia | undefined,
    scope: 'GLOBAL' as 'GLOBAL' | 'CARRERA' | 'GRUPO',
    esGlobal: undefined as boolean | undefined,
    grupo: undefined as number | undefined
  };

  nuevaPublicacion = {
    texto: '',
    importancia: Importancia.PUBLICACION,
    esGlobal: true,
    idsCarreras: [] as number[],
    idsGrupos: [] as number[]
  };

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private publicacionService: PublicacionService,
    private carreraService: CarreraService,
    private grupoService: GrupoService,
    private supabaseService: SupabaseService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.usuario = this.authService.getUsuario();
    this.esEstudiante = this.usuario?.rol === Rol.ESTUDIANTE;
    this.esDocente = this.usuario?.rol === Rol.DOCENTE;
    this.esAdmin = this.usuario?.rol === Rol.ADMIN;
    if (this.esEstudiante) {
        this.nuevaPublicacion.esGlobal = true;
        this.nuevaPublicacion.importancia = Importancia.PUBLICACION;
        this.filtros.scope = 'GLOBAL';
    }
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.intentarRecuperarCache();
      this.cargarCarreras();
    } else {
      this.cargando = false;
    }
  }

  intentarRecuperarCache() {
    const cache = this.publicacionService.getCachedFeed();
    if (cache.publicaciones.length > 0) {
      this.publicaciones = cache.publicaciones;
      this.pagina = cache.pagina;
      this.hayMas = cache.hayMas;
      if (cache.filtros) this.filtros = cache.filtros;
      this.cargando = false;
      this.cdr.detectChanges();
    } else {
      this.cargarFeed(true);
    }
  }

  onImportanciaChange() {
    if (this.esDocente && this.nuevaPublicacion.importancia === Importancia.AVISO) {
      this.nuevaPublicacion.esGlobal = false;
    }
  }

  cargarFeed(reset = false) {
    if (reset) {
        this.pagina = 0;
        this.hayMas = true;
        this.publicaciones = [];
        this.cargando = true;
        this.publicacionService.clearFeedCache();
    }

    if (!this.hayMas || this.cargandoMas) return;
    if (!reset) this.cargandoMas = true;
    
    this.publicacionService.setFiltrosCache(this.filtros);

    if (this.esEstudiante) {
        if (this.filtros.scope === 'GLOBAL') {
            this.filtros.esGlobal = true;
            this.filtros.carrera = undefined;
            this.filtros.grupo = undefined;
        } else if (this.filtros.scope === 'CARRERA') {
            this.filtros.esGlobal = false;
            this.filtros.carrera = this.usuario?.idCarrera;
            this.filtros.grupo = undefined;
        } else if (this.filtros.scope === 'GRUPO') {
            this.filtros.esGlobal = false;
            this.filtros.carrera = this.usuario?.idCarrera;
            this.filtros.grupo = this.usuario?.idGrupo;
        }
    }

    this.publicacionService.getFeed(
        this.filtros.carrera, 
        this.filtros.importancia, 
        this.filtros.esGlobal, 
        this.filtros.grupo,
        this.pagina,
        this.size,
        reset
    ).subscribe({
      next: (data) => {
        const nuevas = data.map(p => ({
          ...p,
          comentariosAbiertos: false,
          comentarios: p.comentarios || [],
          nuevoComentario: ''
        }));

        if (reset) {
            this.publicaciones = nuevas;
        } else {
            this.publicaciones = [...this.publicaciones, ...nuevas];
        }
        
        if (nuevas.length < this.size) {
            this.hayMas = false;
        }

        this.pagina++;
        this.cargando = false;
        this.cargandoMas = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = true;
        this.cargando = false;
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
        this.cargarFeed();
    }
  }

  cargarCarreras() {
    this.carreraService.getAll().subscribe({
      next: (data) => {
        this.carreras = data;
        this.cdr.detectChanges();
      }
    });
  }

  toggleCarrera(id: number) {
    const index = this.nuevaPublicacion.idsCarreras.indexOf(id);
    if (index > -1) {
        this.nuevaPublicacion.idsCarreras.splice(index, 1);
    } else {
        this.nuevaPublicacion.idsCarreras.push(id);
    }
    this.onCarrerasChange();
  }

  toggleGrupo(id: number) {
    const index = this.nuevaPublicacion.idsGrupos.indexOf(id);
    if (index > -1) {
        this.nuevaPublicacion.idsGrupos.splice(index, 1);
    } else {
        this.nuevaPublicacion.idsGrupos.push(id);
    }
  }

  onCarrerasChange() {
    if (this.nuevaPublicacion.idsCarreras.length > 0) {
        this.grupoService.getAllByCarreraIds(this.nuevaPublicacion.idsCarreras).subscribe({
            next: (results) => {
                this.gruposDisponibles = results.sort((a, b) => this.compararNombresGrupos(a.nombre, b.nombre));
                this.nuevaPublicacion.idsGrupos = this.nuevaPublicacion.idsGrupos.filter(idG => 
                    this.gruposDisponibles.some(g => g.id === idG)
                );
                this.cdr.detectChanges();
            }
        });
    } else {
        this.gruposDisponibles = [];
        this.nuevaPublicacion.idsGrupos = [];
    }
  }

  private compararNombresGrupos(a: string, b: string): number {
    try {
        const s1 = a.split('-');
        const s2 = b.split('-');
        const n1 = parseInt(s1[0]);
        const n2 = parseInt(s2[0]);
        if (n1 !== n2) return n1 - n2;
        if (s1.length > 1 && s2.length > 1) {
            return parseInt(s1[1]) - parseInt(s2[1]);
        }
    } catch (e) {
        return a.localeCompare(b);
    }
    return a.localeCompare(b);
  }

  aplicarFiltros() {
    this.cargarFeed(true);
  }

  toggleLike(publicacion: Publicacion) {
    const estadoAnterior = publicacion.meGusta;
    const likesAnteriores = publicacion.totalLikes;

    publicacion.meGusta = !publicacion.meGusta;
    publicacion.totalLikes += publicacion.meGusta ? 1 : -1;
    this.cdr.detectChanges();

    const accion = estadoAnterior 
      ? this.publicacionService.quitarLike(publicacion.id) 
      : this.publicacionService.darLike(publicacion.id);

    accion.subscribe({
      error: (err) => {
        publicacion.meGusta = estadoAnterior;
        publicacion.totalLikes = likesAnteriores;
        this.cdr.detectChanges();
        alert('No se pudo procesar el like. Inténtalo de nuevo.');
      }
    });
  }

  toggleLikeComentario(comentario: Comentario) {
    const estadoAnterior = comentario.meGusta;
    const likesAnteriores = comentario.totalLikes;

    comentario.meGusta = !comentario.meGusta;
    comentario.totalLikes += comentario.meGusta ? 1 : -1;
    this.cdr.detectChanges();

    const accion = estadoAnterior
      ? this.publicacionService.quitarLikeComentario(comentario.id)
      : this.publicacionService.darLikeComentario(comentario.id);

    accion.subscribe({
      error: (err) => {
        comentario.meGusta = estadoAnterior;
        comentario.totalLikes = likesAnteriores;
        this.cdr.detectChanges();
      }
    });
  }

  toggleComentarios(publicacion: Publicacion) {
    publicacion.comentariosAbiertos = !publicacion.comentariosAbiertos;
    if (publicacion.comentariosAbiertos && (!publicacion.comentarios || publicacion.comentarios.length === 0)) {
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

    if (idPadre) {
      const padre = publicacion.comentarios?.find(c => c.id === idPadre);
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
          const padre = publicacion.comentarios?.find(c => c.id === idPadre);
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
            const padre = publicacion.comentarios?.find(c => c.id === idPadre);
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

  onArchivosSeleccionados(event: any) {
    const files = Array.from(event.target.files) as File[];
    const espacioDisponible = 5 - this.archivosSeleccionados.length;
    if (files.length > espacioDisponible) {
      alert(`Solo puedes subir hasta 5 archivos. Se añadirán ${espacioDisponible}.`);
    }
    const archivosAceptados = files.slice(0, espacioDisponible);
    for (const archivo of archivosAceptados) {
      if (this.esEstudiante && archivo.type.startsWith('video/')) {
        alert('Los estudiantes no pueden subir videos.');
        continue;
      }
      this.archivosSeleccionados.push(archivo);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previsualizaciones.push(e.target.result);
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(archivo);
    }
    event.target.value = '';
  }

  descartarArchivo(index: number) {
    this.archivosSeleccionados.splice(index, 1);
    this.previsualizaciones.splice(index, 1);
    this.cdr.detectChanges();
  }

  async publicar() {
    if (!this.nuevaPublicacion.texto.trim()) return;
    this.publicando = true;
    if (this.esEstudiante) {
        this.nuevaPublicacion.esGlobal = true;
        this.nuevaPublicacion.importancia = Importancia.PUBLICACION;
        this.nuevaPublicacion.idsCarreras = [];
        this.nuevaPublicacion.idsGrupos = [];
    }
    this.publicacionService.crear(
        this.nuevaPublicacion.texto,
        this.nuevaPublicacion.importancia,
        this.nuevaPublicacion.esGlobal,
        this.nuevaPublicacion.idsCarreras,
        this.nuevaPublicacion.idsGrupos
    ).subscribe({
        next: async (publicacion) => {
            if (publicacion.moderacion === 'RECHAZADO') {
                alert('Tu publicación ha sido rechazada por moderación automática. Por favor, asegúrate de que el contenido sea apropiado.');
                this.publicando = false;
                this.cdr.detectChanges();
                return;
            }

            if (this.archivosSeleccionados.length > 0) {
                for (const archivo of this.archivosSeleccionados) {
                    const url = await this.supabaseService.subirArchivo(archivo);
                    await this.publicacionService.subirMultimedia(publicacion.id, url, archivo.type).toPromise();
                }
            }
            this.limpiarFormulario();
            this.publicando = false;
            this.cargarFeed(true);
        },
        error: (err) => {
            this.publicando = false;
            if (err.status === 400) {
                alert(err.error.message || 'Error al crear la publicación');
            }
            this.cdr.detectChanges();
        }
    });
  }

  limpiarFormulario() {
    this.nuevaPublicacion.texto = '';
    this.nuevaPublicacion.idsCarreras = [];
    this.nuevaPublicacion.idsGrupos = [];
    this.gruposDisponibles = [];
    this.archivosSeleccionados = [];
    this.previsualizaciones = [];
    this.cdr.detectChanges();
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
