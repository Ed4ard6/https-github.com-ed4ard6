import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-waterfall',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="report-container">
      <h1>Reporte Waterfall</h1>
      <p>Flujo de caja mensual (Cascada)</p>
      <mat-card>
        <mat-card-content>
          <div class="chart-placeholder">
            <p>Gráfico de flujo de caja (Ingresos → Gastos → Balance)</p>
            <p style="font-size: 48px;">📊</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .report-container { padding: var(--spacing-lg); }
    .chart-placeholder { text-align: center; padding: var(--spacing-2xl); }
  `]
})
export class WaterfallComponent {}
