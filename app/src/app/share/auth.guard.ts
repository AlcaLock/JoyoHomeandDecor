import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  UrlTree,
} from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { NotificationService } from './notification-service';

// No necesitamos la clase UserGuard como tal para una CanActivateFn
// sino que la lógica se integra directamente en la función.

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
): boolean | UrlTree | Observable<boolean | UrlTree> => {
  // CanActivateFn puede retornar boolean, UrlTree u Observable de cualquiera de los dos

  const authService = inject(AuthenticationService);
  const router = inject(Router);
  const noti = inject(NotificationService);

  // 1. Verificar si el usuario está autenticado
  const isAuthenticated = authService.isAuthenticatedSignal();

  if (!isAuthenticated) {
    // Si no está autenticado, redirigir y notificar
    const message = 'Usuario No autenticado';
    noti.warning('Autorización', 'Acceso Denegado', 3000);
    return router.createUrlTree(['/usuario/login']); // Redirige explícitamente
  }

  const rolesAllowed = route.data['roles'] || [];

  // 2. Esperar a que la carga inicial del perfil (tras un refresh de página) termine antes
  //    de decidir por rol; de lo contrario currentUserSignal() aún puede estar en null.
  return authService.ensureProfileLoaded().pipe(
    map(() => {
      const currentUser = authService.currentUserSignal();
      const userRole = currentUser?.rol;

      // 3. Verificar roles si están definidos en la ruta
      if (rolesAllowed.length > 0 && !rolesAllowed.includes(userRole)) {
        const message = 'Usuario Sin permisos para acceder a esta sección.';
        noti.warning('Acceso Restringido', message, 3000);
        return router.createUrlTree(['/access-denied']);
      }

      // 4. Si pasa todas las comprobaciones, permitir el acceso
      return true;
    })
  );
};
