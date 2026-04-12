import { Rol } from '../enums/rol';

export interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  fotoPerfil: string;
  rol: Rol;
  matricula: string;
  grupo: string;
  carrera: string;
  seguidoresCount: number;
  siguiendoCount: number;
  loSigo: boolean;
  idCarrera?: number;
  idGrupo?: number;
  status: number;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}
