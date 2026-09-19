import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  icon?: string;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-header">
        <mat-icon [class.danger]="data.danger">{{ data.icon ?? 'help_outline' }}</mat-icon>
        <h2>{{ data.title }}</h2>
      </div>

      <p class="dialog-message">{{ data.message }}</p>

      <div class="dialog-actions">
        <button type="button" class="btn btn-cancel" (click)="dialogRef.close(false)">
          {{ data.cancelText ?? 'Cancelar' }}
        </button>
        <button
          type="button"
          class="btn btn-confirm"
          [class.danger]="data.danger"
          (click)="dialogRef.close(true)"
          cdkFocusInitial
        >
          {{ data.confirmText ?? 'Confirmar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      padding: var(--spacing-lg);
      min-width: 320px;
      max-width: 420px;
      background-color: var(--color-bg-card);
      color: var(--color-text-primary);
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }

    .dialog-header mat-icon {
      color: var(--color-primary);
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .dialog-header mat-icon.danger {
      color: var(--color-danger);
    }

    .dialog-header h2 {
      margin: 0;
      font-size: var(--font-size-lg);
      font-weight: 600;
    }

    .dialog-message {
      margin: 0 0 var(--spacing-xl);
      color: var(--color-text-secondary);
      line-height: 1.5;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-sm);
    }

    .btn {
      font-family: inherit;
      font-size: var(--font-size-sm);
      font-weight: 600;
      padding: 10px 20px;
      border-radius: var(--radius-md);
      border: 1px solid transparent;
      cursor: pointer;
      transition: background-color var(--transition-fast), border-color var(--transition-fast);
    }

    .btn-cancel {
      background: transparent;
      color: var(--color-text-secondary);
      border-color: var(--color-border);
    }

    .btn-cancel:hover {
      background-color: rgba(148, 163, 184, 0.12);
      color: var(--color-text-primary);
    }

    .btn-confirm {
      background-color: var(--color-primary);
      color: #fff;
    }

    .btn-confirm:hover {
      background-color: var(--color-primary-dark);
    }

    .btn-confirm.danger {
      background-color: var(--color-danger);
    }

    .btn-confirm.danger:hover {
      background-color: #dc2626;
    }
  `]
})
export class ConfirmDialogComponent {
  dialogRef = inject(MatDialogRef<ConfirmDialogComponent, boolean>);
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
