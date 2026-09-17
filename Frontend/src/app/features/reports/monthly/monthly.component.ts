import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-monthly',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="report-container">
      <h1>Reporte Mensual</h1>
      <p>Análisis narrativo de tu mes financiero</p>
      <mat-card>
        <mat-card-content>
          <div class="report-content">
            <h3>Resumen del Mes</h3>
            <p>
              Este mes tuviste ingresos por $3,000,000 y gastos totales de $730,000, dejando un
              balance positivo de $2,270,000.
            </p>
            <h3>Categorías Principales</h3>
            <ul>
              <li>Alimentación: $450,000 (61.6%)</li>
              <li>Transporte: $80,000 (11.0%)</li>
              <li>Servicios: $200,000 (27.4%)</li>
            </ul>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .report-container { padding: var(--spacing-lg); }
    .report-content { line-height: 1.8; }
    h3 { margin-top: var(--spacing-lg); }
    ul { padding-left: var(--spacing-lg); }
  `]
})
export class MonthlyComponent {}
