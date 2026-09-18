import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/domain.models';

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
    MatSidenavModule,
    MatDividerModule
  ],
  template: `
    <mat-toolbar color="primary" class="app-header">
      <!-- Logo -->
      <div class="logo">
        <div class="logo-emoji">💰</div>
        <span class="logo-text">Finance App</span>
      </div>

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
        min-width: fit-content;
      }

      .logo-emoji {
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .logo-text {
        font-size: var(--font-size-lg);
        font-weight: 700;
        color: var(--color-primary);
        text-decoration: none;
        white-space: nowrap;
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

    `
  ]
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  @Output() logoutClick = new EventEmitter<void>();

  // Observable del usuario actual
  currentUser$ = this.authService.user$;

  /**
   * Maneja el logout del usuario
   */
  onLogout(): void {
    this.logoutClick.emit();
  }
}
