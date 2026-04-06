export interface MultimediaPublicacion {
  id: number;
  ruta: string;
}

export interface Publicacion {
  id: number;
  texto: string;
  importancia: string;
  multimedia: MultimediaPublicacion[];
}