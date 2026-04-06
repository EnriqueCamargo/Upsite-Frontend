import { Usuario } from './usuario';

export interface MultimediaPublicacion {
  id: number;
  ruta: string;
}

export interface Publicacion {
  id: number;
  texto: string;
  importancia: string;
  multimedia: MultimediaPublicacion[];
  usuario: Usuario;
  totalLikes: number;
  totalComentarios: number;
  meGusta: boolean;
}