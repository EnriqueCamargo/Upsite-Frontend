import { Usuario } from './usuario';

export interface MultimediaPublicacion {
  id: number;
  ruta: string;
  tipo: string;
}

export interface Comentario {
  id: number;
  texto: string;
  fecha: string;
  autorNombre: string;
  autorFoto: string;
  matricula: string;
  idPublicacion: number;
  idPadre: number | null;
  respondiendo?: boolean;
  textoRespuesta?: string;
  totalLikes: number;
  meGusta: boolean;
}

export interface Publicacion {
  id: number;
  texto: string;
  importancia: string;
  multimedia: MultimediaPublicacion[];
  usuario: any;
  totalLikes: number;
  totalComentarios: number;
  meGusta: boolean;
  comentariosAbiertos?: boolean;
  comentarios?: Comentario[];
  nuevoComentario?: string;
}