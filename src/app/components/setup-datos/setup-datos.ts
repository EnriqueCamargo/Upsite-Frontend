import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CarreraService } from '../../services/carrera';
import { GrupoService } from '../../services/grupo';
import { UsuarioService } from '../../services/usuario';
import { AuthService } from '../../services/auth';
import { Carrera } from '../../interfaces/carrera';
import { Grupo } from '../../interfaces/grupo';

@Component({
  selector: 'app-setup-datos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './setup-datos.html',
  styleUrl: './setup-datos.css'
})
export class SetupDatosComponent implements OnInit {
  private carreraService = inject(CarreraService);
  private grupoService = inject(GrupoService);
  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  carreras: Carrera[] = [];
  grupos: Grupo[] = [];
  
  idCarreraSeleccionada?: number;
  idGrupoSeleccionado?: number;
  cargando = false;

  ngOnInit() {
    this.carreraService.getAll().subscribe(data => {
      this.carreras = data;
      this.cdr.detectChanges();
    });
  }

  onCarreraChange() {
    this.idGrupoSeleccionado = undefined;
    if (this.idCarreraSeleccionada) {
      this.grupoService.getAllByCarrera(Number(this.idCarreraSeleccionada)).subscribe(data => {
        this.grupos = data.sort((a, b) => a.nombre.localeCompare(b.nombre));
        this.cdr.detectChanges();
      });
    } else {
      this.grupos = [];
    }
  }

  guardar() {
    const usuario = this.authService.getUsuario();
    if (usuario && this.idGrupoSeleccionado) {
      this.cargando = true;
      // Usamos el endpoint existente en el backend: PUT /usuarios/{idUsuario}/asignar-grupo/{idGrupo}
      // Necesitamos una pequeña modificación en UsuarioService (frontend) para llamar a este PUT
      this.usuarioService.asignarGrupo(usuario.id, this.idGrupoSeleccionado).subscribe({
        next: () => {
          // Actualizar usuario en localStorage para que el resto de la app vea los cambios
          usuario.idCarrera = this.idCarreraSeleccionada;
          usuario.idGrupo = this.idGrupoSeleccionado;
          // Buscamos nombres para el objeto usuario
          const g = this.grupos.find(x => x.id === this.idGrupoSeleccionado);
          const c = this.carreras.find(x => x.id === this.idCarreraSeleccionada);
          usuario.grupo = g?.nombre || '';
          usuario.carrera = c?.nombre || '';
          
          localStorage.setItem('usuario', JSON.stringify(usuario));
          this.router.navigate(['/feed']);
        },
        error: (err) => {
          console.error(err);
          this.cargando = false;
          alert('Error al guardar los datos. Inténtalo de nuevo.');
        }
      });
    }
  }
}
