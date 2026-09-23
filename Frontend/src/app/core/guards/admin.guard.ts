import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Oculta el panel a quien no es administrador.
 *
 * Es solo comodidad de navegación: quien edite el localStorage puede llegar
 * a la pantalla, pero no obtendrá datos. El permiso de verdad lo impone el
 * backend con el rol firmado en el token, que el cliente no puede falsear.
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) return true;

  router.navigate(['/dashboard']);
  return false;
};
