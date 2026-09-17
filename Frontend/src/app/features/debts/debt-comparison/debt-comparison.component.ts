import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { MockDataService } from '../../../core/services/mock-data.service';
import { DebtComparison } from '../../../core/models/domain.models';

@Component({
  selector: 'app-debt-comparison',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule],
  template: `
    <div class="comparison-container">
      <h1>Comparador de Estrategias de Deuda</h1>
      <p>Snowball vs Avalanche</p>

      <div class="comparison-grid">
        <mat-card class="strategy-card">
          <mat-card-header>
            <mat-card-title>Estrategia Snowball</mat-card-title>
            <mat-card-subtitle>Pagar deudas pequeñas primero</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="metric">
              <span class="label">Tiempo para pagar:</span>
              <span class="value">{{ comparison.snowball.monthsToPayOff }} meses</span>
            </div>
            <div class="metric">
              <span class="label">Interés total:</span>
              <span class="value">{{ formatCurrency(comparison.snowball.totalInterest) }}</span>
            </div>
            <button mat-raised-button color="primary" (click)="selectStrategy('snowball')">
              Seleccionar
            </button>
          </mat-card-content>
        </mat-card>

        <mat-card class="strategy-card">
          <mat-card-header>
            <mat-card-title>Estrategia Avalanche</mat-card-title>
            <mat-card-subtitle>Pagar deudas con mayor tasa primero</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="metric">
              <span class="label">Tiempo para pagar:</span>
              <span class="value">{{ comparison.avalanche.monthsToPayOff }} meses</span>
            </div>
            <div class="metric">
              <span class="label">Interés total:</span>
              <span class="value">{{ formatCurrency(comparison.avalanche.totalInterest) }}</span>
            </div>
            <button mat-raised-button color="accent" (click)="selectStrategy('avalanche')">
              Seleccionar
            </button>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="back-button">
        <button mat-button (click)="navigateTo('/debts')">
          <mat-icon>arrow_back</mat-icon>
          Volver
        </button>
      </div>
    </div>
  `,
  styles: [`
    .comparison-container { padding: var(--spacing-lg); max-width: 1000px; margin: 0 auto; }
    h1 { font-size: var(--font-size-2xl); margin-bottom: var(--spacing-sm); }
    p { color: var(--color-text-secondary); margin-bottom: var(--spacing-lg); }
    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-lg);
    }
    .strategy-card { background-color: var(--color-bg-card) !important; }
    .metric { display: flex; justify-content: space-between; padding: var(--spacing-md) 0; border-bottom: 1px solid var(--color-border); }
    .label { color: var(--color-text-secondary); }
    .value { font-weight: 700; color: var(--color-primary); }
    .back-button { text-align: center; }
  `]
})
export class DebtComparisonComponent implements OnInit {
  private mockDataService = inject(MockDataService);
  private router = inject(Router);

  comparison: DebtComparison = { snowball: { strategy: 'snowball', totalInterest: 0, monthsToPayOff: 0, paymentSchedule: [] }, avalanche: { strategy: 'avalanche', totalInterest: 0, monthsToPayOff: 0, paymentSchedule: [] } };

  ngOnInit() {
    this.comparison = this.mockDataService.calculateDebtComparison();
  }

  formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);
  }

  selectStrategy(strategy: string) {
    alert(`Estrategia ${strategy} seleccionada`);
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}
