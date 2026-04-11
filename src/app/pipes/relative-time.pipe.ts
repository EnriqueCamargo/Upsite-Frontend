import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'relativeTime',
  standalone: true
})
export class RelativeTimePipe implements PipeTransform {

  transform(value: string | Date | undefined | null): string {
    if (!value) return 'publicado hace poco';

    const date = new Date(value);
    // Si la fecha es inválida (NaN)
    if (isNaN(date.getTime())) return 'publicado hace poco';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0) return 'hace unos instantes';

    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) {
      return 'publicado hace minutos';
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `Publicado hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }

    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `Publicado hace ${days} ${days === 1 ? 'día' : 'días'}`;
    }

    const weeks = Math.floor(days / 7);
    return `Publicado hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  }
}
