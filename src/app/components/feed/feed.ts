import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID, HostListener, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublicacionService } from '../../services/publicacion';
import { Publicacion } from '../../interfaces/publicacion';
import { SupabaseService } from '../../services/supabase';
import { Importancia } from '../../enums/importancia';
import { CarreraService } from '../../services/carrera';
import { Carrera } from '../../interfaces/carrera';
import { AuthService } from '../../services/auth';
import { Rol } from '../../enums/rol';
import { GrupoService } from '../../services/grupo';
import { Grupo } from '../../interfaces/grupo';
import { Usuario } from '../../interfaces/usuario';
import { forkJoin } from 'rxjs';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, RelativeTimePipe, RouterModule],
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
  usuario: Usuario | null = null;
  archivosSeleccionados: File[] = [];

  // Paginación
  pagina = 0;
  size = 10;
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
    if (this.esEstudiante) {
        this.nuevaPublicacion.esGlobal = true;
        this.nuevaPublicacion.importancia = Importancia.PUBLICACION;
        this.filtros.scope = 'GLOBAL'; // Por defecto ver globales
    }
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarFeed(true);
      this.cargarCarreras();
    } else {
      this.cargando = false;
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
    }

    if (!this.hayMas || this.cargandoMas) return;

    if (!reset) this.cargandoMas = true;
    
    // Preparar filtros según el scope si es estudiante
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
        this.size
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
        console.error('Error al cargar el feed', err);
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

    // Si estamos a menos de 200px del final, cargar más
    if (pos > max - 200) {
        this.cargarFeed();
    }
  }

  cargarCarreras() {
    this.carreraService.getAll().subscribe({
      next: (data) => {
        this.carreras = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar carreras', err);
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
        const requests = this.nuevaPublicacion.idsCarreras.map(id => this.grupoService.getAllByCarrera(id));
        
        forkJoin(requests).subscribe({
            next: (results) => {
                // Combinar todos los grupos y ordenar naturalmente
                const todosLosGrupos = results.flat();
                this.gruposDisponibles = todosLosGrupos.sort((a, b) => this.compararNombresGrupos(a.nombre, b.nombre));
                
                // Limpiar ids seleccionadas que ya no están disponibles
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

    this.publicacionService.comentar(publicacion.id, texto, idPadre).subscribe({
      next: (comentario) => {
        if (!publicacion.comentarios) publicacion.comentarios = [];
        publicacion.comentarios.push(comentario);
        if (idPadre) {
          const padre = publicacion.comentarios.find(c => c.id === idPadre);
          if (padre) {
            padre.respondiendo = false;
            padre.textoRespuesta = '';
          }
        } else {
          publicacion.nuevoComentario = '';
        }
        publicacion.totalComentarios++;
        this.cdr.detectChanges();
      },
      error: (err) => {
          if (err.status === 400) {
              alert(err.error.message || "Error al comentar");
          }
      }
    });
  }

  onArchivosSeleccionados(event: any) {
    const files = Array.from(event.target.files) as File[];
    
    if (this.esEstudiante) {
        const tieneVideo = files.some(f => f.type.startsWith('video/'));
        if (tieneVideo) {
            alert('Los estudiantes no pueden subir videos, solo imágenes.');
            event.target.value = ''; // Reset input
            this.archivosSeleccionados = [];
            return;
        }
    }
    
    this.archivosSeleccionados = files;
  }

  async publicar() {
    if (!this.nuevaPublicacion.texto.trim()) return;
    this.publicando = true;

    // Si es estudiante, forzar global y publicacion
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
            if (this.archivosSeleccionados.length > 0) {
                for (const archivo of this.archivosSeleccionados) {
                    const url = await this.supabaseService.subirArchivo(archivo);
                    await this.publicacionService.subirMultimedia(publicacion.id, url, archivo.type).toPromise();
                }
            }
            this.nuevaPublicacion.texto = '';
            this.nuevaPublicacion.idsCarreras = [];
            this.nuevaPublicacion.idsGrupos = [];
            this.gruposDisponibles = [];
            this.archivosSeleccionados = [];
            this.publicando = false;
            this.cargarFeed(true); // Recargar feed completo para ver la nueva publicación
        },
        error: (err) => {
            console.error('Error al publicar', err);
            if (err.status === 400) {
                alert(err.error.message || "Error al publicar");
            }
            this.publicando = false;
        }
    });
}
}
