import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * App - Componente raíz de la aplicación.
 * El header lo renderiza AppLayoutComponent en las rutas protegidas.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
        background-color: var(--color-bg-dark);
        color: var(--color-text-primary);
      }
    `
  ]
})
export class App {}
