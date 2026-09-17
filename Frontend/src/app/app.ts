import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { AuthService } from './core/services/auth.service';

/**
 * App - Componente raíz de la aplicación
 * Renderiza el header solo si el usuario está autenticado
 * Renderiza el contenido con router-outlet
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent],
  template: `
    <div class="app-container">
      <!-- Header: Solo mostrar si está autenticado -->
      <app-header *ngIf="(isAuthenticated$ | async)"></app-header>

      <!-- Contenido principal -->
      <div class="app-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [
    `
      .app-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background-color: var(--color-bg-dark);
        color: var(--color-text-primary);
      }

      .app-content {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }
    `
  ]
})
export class App {
  private authService = inject(AuthService);

  // Observable para saber si el usuario está autenticado
  isAuthenticated$ = this.authService.isAuthenticated$;
}
