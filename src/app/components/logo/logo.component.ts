import { Component, computed, input, model } from '@angular/core';
import { booleanAttribute } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss'
})
export class LogoComponent {
  readonly src = input<string>('../../assets/icon/logo.png');
  readonly alt = input('Logo');

  // Size inputs
  readonly size = input<
    'xxx-small' | 'xx-small' | 'x-small' | 'small' | 'medium' |
    'large' | 'x-large' | 'xx-large' | 'xxx-large'
  >('medium');
  readonly padding = input<string>('5px');

  // Custom dimensions
  readonly width = input<number | undefined>(undefined);
  readonly height = input<number | undefined>(undefined);

  // Style inputs
  readonly objectFit = input<
    'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
  >('contain');
  readonly opacity = input(1);
  readonly disabled = input(false, { transform: booleanAttribute });

  // Computed properties
  protected sizeClass = computed(() =>
    !this.width() && !this.height() ? this.size() : ''
  );

  protected styles = computed(() => ({
    width: this.width() ? `${this.width()}px` : null,
    height: this.height() ? `${this.height()}px` : null,
    'object-fit': this.objectFit(),
    opacity: this.opacity(),
    'pointer-events': this.disabled() ? 'none' : 'auto'
  }));
}