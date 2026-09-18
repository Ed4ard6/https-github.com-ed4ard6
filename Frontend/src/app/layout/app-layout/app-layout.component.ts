import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { HeaderComponent } from '../header/header.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    HeaderComponent
  ],
  template: `
    <div class="layout-wrapper">
      <!-- Header -->
      <header class="app-header">
        <div class="header-content">
          <div class="logo-section">
            <div class="logo">💰</div>
            <h1>Finance App</h1>
          </div>
          <div class="spacer"></div>
          <app-header (logoutClick)="logout()"></app-header>
        </div>
      </header>

      <!-- Contenido con Sidebar -->
      <div class="content-wrapper">
        <mat-sidenav-container autosize>
          <mat-sidenav mode="side" [opened]="true" class="sidebar">
            <nav class="nav-menu">
              <a class="nav-item active" [routerLink]="['/dashboard']" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
                <mat-icon>dashboard</mat-icon>
                <span>Dashboard</span>
              </a>
              <a class="nav-item" [routerLink]="['/transactions']" routerLinkActive="active">
                <mat-icon>receipt_long</mat-icon>
                <span>Transacciones</span>
              </a>
              <a class="nav-item" [routerLink]="['/categories']" routerLinkActive="active">
                <mat-icon>label</mat-icon>
                <span>Categorías</span>
              </a>
              <a class="nav-item" [routerLink]="['/debts']" routerLinkActive="active">
                <mat-icon>credit_card</mat-icon>
                <span>Deudas</span>
              </a>
              <a class="nav-item" [routerLink]="['/budgets']" routerLinkActive="active">
                <mat-icon>account_balance_wallet</mat-icon>
                <span>Presupuestos</span>
              </a>
              <a class="nav-item" [routerLink]="['/savings']" routerLinkActive="active">
                <mat-icon>savings</mat-icon>
                <span>Ahorros</span>
              </a>
              <a class="nav-item" [routerLink]="['/reports']" routerLinkActive="active">
                <mat-icon>analytics</mat-icon>
                <span>Reportes</span>
              </a>
            </nav>
          </mat-sidenav>

          <mat-sidenav-content>
            <div class="main-content">
              <router-outlet></router-outlet>
            </div>
          </mat-sidenav-content>
        </mat-sidenav-container>
      </div>
    </div>
  `,
  styles: [`
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .layout-wrapper {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background-color: var(--color-bg-dark);
    }

    .app-header {
      background-color: var(--color-bg-card);
      border-bottom: 1px solid var(--color-border);
      height: 70px;
      display: flex;
      align-items: center;
      padding: 0 var(--spacing-lg);
      flex-shrink: 0;
    }

    .header-content {
      display: flex;
      align-items: center;
      width: 100%;
      gap: var(--spacing-lg);
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      min-width: 200px;
      flex-shrink: 0;
    }

    .logo {
      font-size: 32px;
      line-height: 1;
    }

    .logo-section h1 {
      font-size: var(--font-size-xl);
      font-weight: 700;
      color: var(--color-primary);
      margin: 0;
      white-space: nowrap;
    }

    .spacer {
      flex: 1;
    }

    .content-wrapper {
      flex: 1;
      overflow: hidden;
      display: flex;
    }

    mat-sidenav-container {
      width: 100%;
      height: 100%;
    }

    .sidebar {
      width: 280px !important;
      background-color: var(--color-bg-darker);
      border-right: 1px solid var(--color-border);
      padding: var(--spacing-lg) 0;
      flex-shrink: 0;
    }

    .nav-menu {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      padding: 0 var(--spacing-sm);
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: 12px 16px;
      color: var(--color-text-secondary);
      text-decoration: none;
      border-radius: var(--radius-md);
      transition: all 0.2s ease;
      cursor: pointer;
      border-left: 3px solid transparent;
      margin-left: -3px;
      font-weight: 500;
      font-size: var(--font-size-sm);

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: currentColor;
      }

      &:hover {
        background-color: rgba(167, 139, 250, 0.1);
        color: var(--color-primary);
      }

      &.active {
        background-color: rgba(167, 139, 250, 0.15);
        border-left-color: var(--color-primary);
        color: var(--color-primary);
        font-weight: 600;
      }
    }

    mat-sidenav-content {
      overflow-y: auto;
      background-color: var(--color-bg-dark);
    }

    .main-content {
      height: 100%;
      background-color: var(--color-bg-dark);
    }
  `]
})
export class AppLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}
