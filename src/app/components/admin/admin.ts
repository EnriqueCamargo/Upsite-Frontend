import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario';
import { CarreraService } from '../../services/carrera';
import { GrupoService } from '../../services/grupo';
import { Usuario } from '../../interfaces/usuario';
import { Carrera } from '../../interfaces/carrera';
import { Grupo } from '../../interfaces/grupo';
import { Rol } from '../../enums/rol';
import { forkJoin } from 'rxjs';

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

  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  carreras: Carrera[] = [];
  gruposPorCarrera = new Map<number, Grupo[]>();
  
  searchText = '';
  cargando = true;
  roles = Object.values(Rol);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    forkJoin({
      usuarios: this.usuarioService.getAll(),
      carreras: this.carreraService.getAll()
    }).subscribe({
      next: (res) => {
        this.usuarios = res.usuarios;
        this.usuariosFiltrados = res.usuarios;
        this.carreras = res.carreras;
        this.cargando = false;
        
        // Cargar grupos para cada carrera para tenerlos listos
        this.carreras.forEach(c => {
          this.grupoService.getAllByCarrera(c.id).subscribe(g => {
            this.gruposPorCarrera.set(c.id, g.sort((a,b) => a.nombre.localeCompare(b.nombre)));
          });
        });
      }
    });
  }

  filtrarUsuarios() {
    const q = this.searchText.toLowerCase().trim();
    this.usuariosFiltrados = this.usuarios.filter(u => 
      u.nombres.toLowerCase().includes(q) || 
      u.apellidos.toLowerCase().includes(q) || 
      u.matricula.toLowerCase().includes(q)
    );
  }

  getGrupos(idCarrera?: number): Grupo[] {
    if (!idCarrera) return [];
    return this.gruposPorCarrera.get(idCarrera) || [];
  }

  onCarreraChange(user: Usuario) {
    user.idGrupo = undefined; // Reset grupo al cambiar carrera
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
