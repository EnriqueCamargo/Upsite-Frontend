import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario';
import { CarreraService } from '../../services/carrera';
import { GrupoService } from '../../services/grupo';
import { Usuario } from '../../interfaces/usuario';
import { Carrera } from '../../interfaces/carrera';
import { Grupo } from '../../interfaces/grupo';
import { Rol } from '../../enums/rol';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private carreraService = inject(CarreraService);
  private grupoService = inject(GrupoService);
  private cdr = inject(ChangeDetectorRef);

  usuarios: Usuario[] = [];
  carreras: Carrera[] = [];
  gruposPorCarrera = new Map<number, Grupo[]>();
  
  searchText = '';
  cargando = true;
  cargandoMas = false;
  pagina = 0;
  tamanio = 10;
  hayMas = true;
  roles = Object.values(Rol);

  ngOnInit() {
    this.intentarRecuperarCache();
  }

  intentarRecuperarCache() {
    const cache = this.usuarioService.getCachedAdmin();
    if (cache.usuarios.length > 0) {
      this.usuarios = cache.usuarios;
      this.pagina = cache.pagina;
      this.hayMas = cache.hayMas;
      this.searchText = cache.searchText;
      this.cargando = false;
      this.cdr.detectChanges();
      // Cargamos carreras en paralelo para que los selects funcionen
      this.carreraService.getAll().subscribe(c => this.carreras = c);
    } else {
      this.cargarDatosIniciales();
    }
  }

  cargarDatosIniciales() {
    this.cargando = true;
    this.cdr.detectChanges();
    this.carreraService.getAll().subscribe(c => {
      this.carreras = c;
      this.cargarUsuarios(true);
    });
  }

  cargarUsuarios(reset: boolean = false) {
    if (reset) {
      this.pagina = 0;
      this.usuarios = [];
      this.hayMas = true;
      this.usuarioService.clearAdminCache();
    }

    if (!this.hayMas && !reset) return;

    this.cargandoMas = true;
    this.cdr.detectChanges();
    
    // Persistir el término de búsqueda en cache
    this.usuarioService.setAdminSearchCache(this.searchText);

    const query = this.searchText.trim();
    const obs = query 
      ? this.usuarioService.buscar(query, this.pagina, this.tamanio)
      : this.usuarioService.getAll(this.pagina, this.tamanio, reset);

    obs.subscribe({
      next: (res) => {
        this.usuarios = [...this.usuarios, ...res];
        this.hayMas = res.length === this.tamanio;
        this.pagina++;
        this.cargando = false;
        this.cargandoMas = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.cargandoMas = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearch() {
    this.cargarUsuarios(true);
  }

  getGrupos(idCarrera?: number): Grupo[] {
    if (!idCarrera) return [];
    
    // Carga perezosa de grupos si no están en caché
    if (!this.gruposPorCarrera.has(idCarrera)) {
      this.gruposPorCarrera.set(idCarrera, []); // Evitar múltiples llamadas
      this.grupoService.getAllByCarrera(idCarrera).subscribe(g => {
        this.gruposPorCarrera.set(idCarrera, g.sort((a,b) => a.nombre.localeCompare(b.nombre)));
        this.cdr.detectChanges();
      });
    }
    
    return this.gruposPorCarrera.get(idCarrera) || [];
  }

  onCarreraChange(user: Usuario) {
    user.idGrupo = undefined;
    // Disparamos la carga de grupos para la nueva carrera
    if (user.idCarrera) {
      this.getGrupos(user.idCarrera);
    }
  }

  guardarCambios(user: Usuario) {
    this.usuarioService.actualizarAdmin(user.id, user).subscribe({
      next: (updated) => {
        alert(`Usuario ${updated.nombres} actualizado correctamente.`);
      },
      error: (err) => {
        console.error(err);
        alert('Error al actualizar usuario.');
      }
    });
  }

  toggleStatus(user: Usuario) {
    user.status = user.status === 1 ? 0 : 1;
    this.guardarCambios(user);
  }
}
