import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { DebtService } from '../../../core/services/debt.service';
import { Debt } from '../../../core/models/domain.models';
import { PayoffStrategy, simulateDebtPayoff } from '../../../core/finance/debt-strategy';

@Component({
  selector: 'app-debt-comparison',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterLink
  ],
  template: `
    <div class="comparison-container">
      <div class="header">
        <div>
          <h1>Comparar estrategias</h1>
          <p class="subtitle">Qué orden de pago te cuesta menos intereses</p>
        </div>
        <button mat-button [routerLink]="['/debts']">
          <mat-icon>arrow_back</mat-icon>
          Volver
        </button>
      </div>

      <mat-card class="config-card" *ngIf="debts().length > 0">
        <mat-form-field appearance="outline">
          <mat-label>Pago extra al mes</mat-label>
          <input matInput type="number" [(ngModel)]="extraInput" (ngModelChange)="extra.set(+$event || 0)" step="10000" />
          <span matTextPrefix>$&nbsp;</span>
          <mat-hint>Lo que puedes aportar por encima de las cuotas mínimas</mat-hint>
        </mat-form-field>

        <div class="config-summary">
          <span>Deuda total: <strong>{{ formatCurrency(totalBalance()) }}</strong></span>
          <span>Cuotas mínimas: <strong>{{ formatCurrency(totalMinimum()) }}</strong></span>
          <span>Pago mensual: <strong>{{ formatCurrency(totalMinimum() + extra()) }}</strong></span>
        </div>
      </mat-card>

      <mat-card class="empty-card" *ngIf="debts().length === 0">
        <div class="empty-state">
          <mat-icon>compare_arrows</mat-icon>
          <p>Necesitas al menos una deuda registrada para comparar</p>
          <button mat-raised-button color="primary" [routerLink]="['/debts/create']">
            Registrar una deuda
          </button>
        </div>
      </mat-card>

      <div class="warning" *ngIf="debts().length > 0 && !snowball().finished">
        <mat-icon>warning</mat-icon>
        <span>
          Con el pago actual las deudas no llegan a saldarse: los intereses crecen más rápido
          que los abonos. Sube el pago extra para ver una simulación completa.
        </span>
      </div>

      <div class="strategies" *ngIf="debts().length > 0 && snowball().finished">
        <mat-card class="strategy-card" [class.winner]="winner() === 'snowball'">
          <div class="strategy-head">
            <mat-icon>ac_unit</mat-icon>
            <div>
              <h2>Bola de nieve</h2>
              <span class="strategy-desc">Primero la deuda más pequeña</span>
            </div>
            <span class="badge" *ngIf="winner() === 'snowball'">Ahorra más</span>
          </div>

          <div class="strategy-stats">
            <div class="stat">
              <span class="stat-label">Tiempo</span>
              <span class="stat-value">{{ formatMonths(snowball().months) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Intereses</span>
              <span class="stat-value">{{ formatCurrency(snowball().totalInterest) }}</span>
            </div>
          </div>

          <ol class="order-list">
            <li *ngFor="let nombre of snowball().order">{{ nombre }}</li>
          </ol>
        </mat-card>

        <mat-card class="strategy-card" [class.winner]="winner() === 'avalanche'">
          <div class="strategy-head">
            <mat-icon>trending_down</mat-icon>
            <div>
              <h2>Avalancha</h2>
              <span class="strategy-desc">Primero la de mayor interés</span>
            </div>
            <span class="badge" *ngIf="winner() === 'avalanche'">Ahorra más</span>
          </div>

          <div class="strategy-stats">
            <div class="stat">
              <span class="stat-label">Tiempo</span>
              <span class="stat-value">{{ formatMonths(avalanche().months) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Intereses</span>
              <span class="stat-value">{{ formatCurrency(avalanche().totalInterest) }}</span>
            </div>
          </div>

          <ol class="order-list">
            <li *ngFor="let nombre of avalanche().order">{{ nombre }}</li>
          </ol>
        </mat-card>
      </div>

      <mat-card class="verdict" *ngIf="debts().length > 0 && snowball().finished">
        <mat-icon>lightbulb</mat-icon>
        <p>{{ verdict() }}</p>
      </mat-card>
    </div>
  `,
  styles: [`
    .comparison-container {
      padding: var(--spacing-lg);
      max-width: 1000px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--spacing-lg);
      flex-wrap: wrap;
    }

    h1 {
      margin: 0 0 var(--spacing-xs);
      font-size: var(--font-size-2xl);
    }

    .subtitle {
      margin: 0;
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
    }

    .config-card {
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .config-summary {
      display: flex;
      gap: var(--spacing-xl);
      flex-wrap: wrap;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--color-border);
    }

    .config-summary strong { color: var(--color-text-primary); }

    .strategies {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: var(--spacing-lg);
    }

    .strategy-card {
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      border: 2px solid transparent;
    }

    .strategy-card.winner {
      border-color: var(--color-success);
    }

    .strategy-head {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .strategy-head mat-icon {
      color: var(--color-primary);
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .strategy-head h2 {
      margin: 0;
      font-size: var(--font-size-lg);
    }

    .strategy-desc {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .badge {
      margin-left: auto;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      background: rgba(16, 185, 129, 0.15);
      color: var(--color-success);
      font-size: var(--font-size-xs);
      font-weight: 700;
      white-space: nowrap;
    }

    .strategy-stats {
      display: flex;
      gap: var(--spacing-xl);
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-label {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      font-size: var(--font-size-lg);
      font-weight: 700;
    }

    .order-list {
      margin: 0;
      padding-left: var(--spacing-lg);
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .verdict {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
      border-left: 3px solid var(--color-primary);
    }

    .verdict mat-icon {
      color: var(--color-warning);
      flex-shrink: 0;
    }

    .verdict p { margin: 0; }

    .warning {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
      border-radius: var(--radius-lg);
      background: rgba(245, 158, 11, 0.12);
      color: var(--color-warning);
    }

    .warning mat-icon { flex-shrink: 0; }

    .empty-card { padding: var(--spacing-lg); }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-2xl);
      color: var(--color-text-muted);
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.5;
    }

    .empty-state p { margin: 0; }
  `]
})
export class DebtComparisonComponent implements OnInit {
  private debtService = inject(DebtService);

  debts = signal<Debt[]>([]);
  extra = signal(0);
  extraInput = 0;

  totalBalance = computed(() => this.debts().reduce((sum, d) => sum + d.balance, 0));
  totalMinimum = computed(() => this.debts().reduce((sum, d) => sum + d.minimumPayment, 0));

  snowball = computed(() => this.simulate('snowball'));
  avalanche = computed(() => this.simulate('avalanche'));

  winner = computed(() => {
    const s = this.snowball();
    const a = this.avalanche();
    if (!s.finished || !a.finished) return null;
    if (Math.abs(s.totalInterest - a.totalInterest) < 1) return null;
    return s.totalInterest < a.totalInterest ? 'snowball' : 'avalanche';
  });

  verdict = computed(() => {
    const s = this.snowball();
    const a = this.avalanche();
    const ganador = this.winner();

    if (!ganador) {
      return 'Ambas estrategias cuestan prácticamente lo mismo. Elige la que te motive más: la bola de nieve da victorias antes.';
    }

    const diferencia = Math.abs(s.totalInterest - a.totalInterest);

    if (ganador === 'avalanche') {
      return `Atacando primero la deuda con más interés te ahorras ${this.formatCurrency(diferencia)} en intereses. La bola de nieve cuesta más, pero salda deudas pequeñas antes y eso ayuda a no abandonar.`;
    }

    return `En tu caso la bola de nieve sale ${this.formatCurrency(diferencia)} más barata, además de liquidar deudas pequeñas cuanto antes.`;
  });

  ngOnInit() {
    this.debtService.getDebts().subscribe({
      next: (data) => {
        this.debts.set(data ?? []);
        // Arranca con algo de holgura para que la simulación tenga sentido.
        const sugerido = Math.round(this.totalMinimum() * 0.2);
        this.extra.set(sugerido);
        this.extraInput = sugerido;
      },
      error: () => this.debts.set([])
    });
  }

  private simulate(strategy: PayoffStrategy) {
    return simulateDebtPayoff(
      this.debts().map(d => ({
        nombre: d.nombre,
        balance: d.balance,
        annualRate: d.annualRate,
        minimumPayment: d.minimumPayment
      })),
      strategy,
      this.extra()
    );
  }

  formatMonths(months: number): string {
    if (months < 12) return `${months} ${months === 1 ? 'mes' : 'meses'}`;

    const years = Math.floor(months / 12);
    const rest = months % 12;
    const parteAnios = `${years} ${years === 1 ? 'año' : 'años'}`;

    return rest === 0 ? parteAnios : `${parteAnios} y ${rest} ${rest === 1 ? 'mes' : 'meses'}`;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}
