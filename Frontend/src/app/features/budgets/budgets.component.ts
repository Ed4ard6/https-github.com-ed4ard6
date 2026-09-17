import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressBarModule, MatButtonModule, MatIconModule],
  template: `
    <div class="budgets-container">
      <div class="header">
        <h1>Presupuestos Mensuales</h1>
        <button mat-raised-button color="primary">
          <mat-icon>add</mat-icon>
          Nuevo Presupuesto
        </button>
      </div>

      <mat-card>
        <mat-card-content>
          <div class="budgets-list">
            <div class="budget-item">
              <div class="budget-header">
                <span class="budget-name">Alimentación</span>
                <span class="budget-amount">$450,000 / $500,000</span>
              </div>
              <mat-progress-bar [value]="90" color="warn" mode="determinate"></mat-progress-bar>
              <span class="budget-percentage">90% gastado</span>
            </div>

            <div class="budget-item">
              <div class="budget-header">
                <span class="budget-name">Transporte</span>
                <span class="budget-amount">$60,000 / $80,000</span>
              </div>
              <mat-progress-bar [value]="75" color="primary" mode="determinate"></mat-progress-bar>
              <span class="budget-percentage">75% gastado</span>
            </div>

            <div class="budget-item">
              <div class="budget-header">
                <span class="budget-name">Servicios</span>
                <span class="budget-amount">$150,000 / $200,000</span>
              </div>
              <mat-progress-bar [value]="75" color="accent" mode="determinate"></mat-progress-bar>
              <span class="budget-percentage">75% gastado</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .budgets-container { padding: var(--spacing-lg); }
    .header { display: flex; justify-content: space-between; margin-bottom: var(--spacing-lg); }
    .budgets-list { display: flex; flex-direction: column; gap: var(--spacing-lg); }
    .budget-item { display: flex; flex-direction: column; gap: var(--spacing-sm); }
    .budget-header { display: flex; justify-content: space-between; font-weight: 600; }
    .budget-percentage { font-size: var(--font-size-xs); color: var(--color-text-muted); }
  `]
})
export class BudgetsComponent {}
