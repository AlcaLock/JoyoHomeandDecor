import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
export enum TipoMessage {
  success = 'success',
  info = 'info',
  warning = 'warning',
  error = 'error',
}
@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private snackBar: MatSnackBar, private router: Router) { }

  /**
   * Muestra un mensaje de notificación simple
   * @param title El título del mensaje (opcional)
   * @param message El contenido principal del mensaje
   * @param type El tipo de mensaje (success, info, warning, error) para aplicar estilos
   * @param duration Duración en milisegundos que el snack-bar estará visible (por defecto 3000ms)
   */
  mensaje(
    title: string | null, // Puedes pasar null si no quieres título
    message: string,
    type: TipoMessage,
    duration: number = 3000
  ): void {
    const config: MatSnackBarConfig = {
      duration: duration,
      panelClass: [type], // Clase CSS según el tipo de mensaje
      horizontalPosition: 'end', // Posición en la pantalla (start, center, end, left, right)
      verticalPosition: 'top',   // Posición vertical (top, bottom)
    };

    const finalMessage = title ? `${title}: ${message}` : message;

    this.snackBar.open(finalMessage, 'Cerrar', config);
  }

  /**
   * Muestra un mensaje y redirige a una ruta específica después de la duración
   * @param title El título del mensaje
   * @param message El contenido principal del mensaje
   * @param type El tipo de mensaje
   * @param redirectTo La ruta a la que se redirigirá
   * @param duration Duración en milisegundos
   */
  mensajeRedirect(
    title: string | null,
    message: string,
    type: TipoMessage,
    redirectTo: string,
    duration: number = 3000
  ): void {
    const config: MatSnackBarConfig = {
      duration: duration,
      panelClass: [type],
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    };

    const finalMessage = title ? `${title}: ${message}` : message;

    this.snackBar.open(finalMessage, 'Cerrar', config)
      .afterDismissed() // Observable que emite cuando el snack-bar se ha cerrado
      .subscribe(() => {
        this.router.navigate([redirectTo]);
      });
  }

  // Métodos de acceso rápido para cada tipo de mensaje
  success(title: string | null, message: string, duration?: number, redirectTo?:string): void {
   if (redirectTo) { 
      this.mensajeRedirect(title, message, TipoMessage.success, redirectTo, duration);
    } else {
      this.mensaje(title, message, TipoMessage.success, duration);
    }
  }

  info(title: string | null, message: string, duration?: number, redirectTo?:string): void {
   if (redirectTo) {
      this.mensajeRedirect(title, message, TipoMessage.info, redirectTo, duration);
    } else {
      this.mensaje(title, message, TipoMessage.info, duration);
    }
  }

  warning(title: string | null, message: string, duration?: number, redirectTo?:string): void {
    if (redirectTo) {
      this.mensajeRedirect(title, message, TipoMessage.warning, redirectTo, duration);
    } else {
      this.mensaje(title, message, TipoMessage.warning, duration);
    }
  }

  error(title: string | null, message: string, duration?: number, redirectTo?:string): void {
    if (redirectTo) {
      this.mensajeRedirect(title, message, TipoMessage.error, redirectTo, duration);
    } else {
      this.mensaje(title, message, TipoMessage.error, duration);
    }
  }
}

