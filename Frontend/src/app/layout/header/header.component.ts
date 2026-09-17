import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/domain.models';

/**
 * HeaderComponent
 * Barra de navegación principal con logo, menú y usuario
 * Responsive para desktop y mobile
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule
  ],
  template: `
    <mat-toolbar color="primary" class="app-header">
      <!-- Logo -->
      <div class="logo">
        <span class="logo-text">💰 Finance App</span>
      </div>

      <!-- Navegación Desktop -->
      <nav class="nav-desktop">
        <a
          mat-button
          routerLink="/dashboard"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          <mat-icon>dashboard</mat-icon>
          Dashboard
        </a>
        <a
          mat-button
          routerLink="/transactions"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          <mat-icon>receipt</mat-icon>
          Transacciones
        </a>
        <a
          mat-button
          routerLink="/categories"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          <mat-icon>category</mat-icon>
          Categorías
        </a>
        <a
          mat-button
          routerLink="/debts"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          <mat-icon>credit_card</mat-icon>
          Deudas
        </a>
        <a
          mat-button
          routerLink="/budgets"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          <mat-icon>account_balance_wallet</mat-icon>
          Presupuestos
        </a>
        <a
          mat-button
          routerLink="/savings"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          <mat-icon>savings</mat-icon>
          Ahorros
        </a>
        <a
          mat-button
          routerLink="/reports"
          routerLinkActive="active"
        >
          <mat-icon>bar_chart</mat-icon>
          Reportes
        </a>
      </nav>

      <!-- Spacer -->
      <span class="spacer"></span>

      <!-- User Menu -->
      <button mat-icon-button [matMenuTriggerFor]="userMenu" class="user-menu-trigger">
        <mat-icon>account_circle</mat-icon>
        <span class="user-name">{{ (currentUser$ | async)?.nombre }}</span>
      </button>

      <mat-menu #userMenu="matMenu" class="user-menu">
        <button mat-menu-item disabled>
          <mat-icon>person</mat-icon>
          <span>{{ (currentUser$ | async)?.email }}</span>
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="onLogout()">
          <mat-icon>logout</mat-icon>
          <span>Cerrar sesión</span>
        </button>
      </mat-menu>
    </mat-toolbar>
  `,
  styles: [
    `
      .app-header {
        background-color: var(--color-bg-card);
        border-bottom: 1px solid var(--color-border);
        height: 64px;
        display: flex;
        align-items: center;
        padding: 0 var(--spacing-md);
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .logo {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

      .logo-text {
        font-size: var(--font-size-lg);
        font-weight: 700;
        color: var(--color-primary);
        text-decoration: none;
      }

      .nav-desktop {
        display: flex;
        gap: var(--spacing-md);
        margin-left: var(--spacing-lg);
        align-items: center;

        a {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          color: var(--color-text-secondary);
          text-decoration: none;
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);

          &:hover {
            background-color: var(--color-bg-input);
            color: var(--color-text-primary);
          }

          &.active {
            background-color: var(--color-primary);
            color: var(--color-bg-dark);
            font-weight: 600;
          }

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
      }

      .spacer {
        flex: 1 1 auto;
      }

      .user-menu-trigger {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        color: var(--color-text-primary);
      }

      .user-name {
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
        display: none;

        @media (min-width: 900px) {
          display: inline;
        }
      }

      .user-menu {
        min-width: 200px;
      }

      @media (max-width: 900px) {
        .nav-desktop {
          display: none;
        }
      }
    `
  ]
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Observable del usuario actual
  currentUser$ = this.authService.user$;

  /**
   * Maneja el logout del usuario
   */
  onLogout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}
