export interface Notificacion {
  id: number;
  mensaje: string;
  emisorNombre: string;
  emisorFoto: string;
  tipo: string;
  refId: number;
  leido: boolean;
  fecha: string;
}
