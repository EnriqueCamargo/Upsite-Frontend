import { Usuario } from './usuario';
import { Importancia } from '../enums/importancia';
import { TipoMultimedia } from '../enums/tipo-multimedia';
import { Carrera } from './carrera';
import { Grupo } from './grupo';

export interface MultimediaPublicacion {
  id: number;
  ruta: string;
  tipo: TipoMultimedia;
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
  totalLikes: number;
  meGusta: boolean;
  idAutor: number;
  totalRespuestas: number;
  respuestas?: Comentario[];
  respuestasAbiertas?: boolean;
  enviando?: boolean;
  respondiendo?: boolean;
  textoRespuesta?: string;
}

export interface Publicacion {
  id: number;
  texto: string;
  importancia: Importancia;
  multimedia: MultimediaPublicacion[];
  usuario: Usuario;
  totalLikes: number;
  totalComentarios: number;
  meGusta: boolean;
  targetCarreras: Carrera[];
  targetGrupos: Grupo[];
  fechaPublicacion: string;
  mostrarMenu?: boolean;
  comentando?: boolean;
  comentariosAbiertos?: boolean;
  comentarios?: Comentario[];
  nuevoComentario?: string;
}
