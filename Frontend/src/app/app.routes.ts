import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

/**
 * APP ROUTES - Rutas principales de la aplicación
 *
 * Estructura:
 * - /auth/* - Rutas públicas (login, register)
 * - /* - Rutas protegidas (requieren autenticación)
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'transactions',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/transactions/transactions-list/transactions-list.component').then(
            m => m.TransactionsListComponent
          )
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./features/transactions/transaction-form/transaction-form.component').then(
            m => m.TransactionFormComponent
          )
      },
      {
        path: 'edit/:id',
        loadComponent: () =>
          import('./features/transactions/transaction-form/transaction-form.component').then(
            m => m.TransactionFormComponent
          )
      }
    ]
  },
  {
    path: 'categories',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/categories/categories-list/categories-list.component').then(
            m => m.CategoriesListComponent
          )
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./features/categories/category-form/category-form.component').then(
            m => m.CategoryFormComponent
          )
      },
      {
        path: 'edit/:id',
        loadComponent: () =>
          import('./features/categories/category-form/category-form.component').then(
            m => m.CategoryFormComponent
          )
      }
    ]
  },
  {
    path: 'debts',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/debts/debts-list/debts-list.component').then(
            m => m.DebtsListComponent
          )
      },
      {
        path: 'compare',
        loadComponent: () =>
          import('./features/debts/debt-comparison/debt-comparison.component').then(
            m => m.DebtComparisonComponent
          )
      }
    ]
  },
  {
    path: 'budgets',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/budgets/budgets.component').then(m => m.BudgetsComponent)
  },
  {
    path: 'savings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/savings/savings.component').then(m => m.SavingsComponent)
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    children: [
      {
        path: 'waterfall',
        loadComponent: () =>
          import('./features/reports/waterfall/waterfall.component').then(
            m => m.WaterfallComponent
          )
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/reports/calendar/calendar.component').then(
            m => m.CalendarComponent
          )
      },
      {
        path: 'monthly',
        loadComponent: () =>
          import('./features/reports/monthly/monthly.component').then(m => m.MonthlyComponent)
      },
      {
        path: 'planner',
        loadComponent: () =>
          import('./features/reports/planner/planner.component').then(m => m.PlannerComponent)
      },
      {
        path: '',
        redirectTo: 'waterfall',
        pathMatch: 'full'
      }
    ]
  },
  // Ruta wildcard - debe estar al final
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
