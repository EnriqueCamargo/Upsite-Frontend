import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MultimediaPublicacion } from '../../interfaces/publicacion';

@Component({
  selector: 'app-lightbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lightbox.html',
  styleUrl: './lightbox.css'
})
export class LightboxComponent {
  @Input() mediaList: MultimediaPublicacion[] = [];
  @Input() currentIndex: number = 0;
  @Output() close = new EventEmitter<void>();

  get currentMedia(): MultimediaPublicacion {
    return this.mediaList[this.currentIndex];
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') this.next();
    if (event.key === 'ArrowLeft') this.prev();
    if (event.key === 'Escape') this.close.emit();
  }

  next(event?: Event) {
    event?.stopPropagation();
    if (this.currentIndex < this.mediaList.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0;
    }
  }

  prev(event?: Event) {
    event?.stopPropagation();
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.mediaList.length - 1;
    }
  }

  onClose() {
    this.close.emit();
  }
}
