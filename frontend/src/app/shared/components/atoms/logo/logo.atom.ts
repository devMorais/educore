import { Component, input } from '@angular/core';

/**
 * Logo reutilizável do EduCore.
 * Centraliza a marca para não duplicar o asset em navbar, footer, login e register.
 * Use [height] para ajustar o tamanho; o `alt` já vem acessível por padrão.
 */
@Component({
  selector: 'app-logo',
  template: `
    <img
      src="assets/LOGO_VIDEO.png"
      [alt]="alt()"
      class="app-logo"
      [style.height.px]="height()"
    />
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; }
    .app-logo { width: auto; object-fit: contain; display: block; }
  `],
})
export class Logo {
  /** Altura da logo em pixels. */
  height = input(44);
  /** Texto alternativo acessível. */
  alt = input('EduCore');
}
