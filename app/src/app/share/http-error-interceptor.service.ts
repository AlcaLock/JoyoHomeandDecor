import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpRequest,
  HttpHandler,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from './notification-service';


@Injectable({
  providedIn: 'root',
})

export class HttpErrorInterceptorService implements HttpInterceptor {
  //Recuerde que es necesario llamarlo como Proveedor
  //en AppModule
  constructor(private noti: NotificationService) {}
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    console.log('Request URL: ' + request.url);
    //Capturar el error
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let message: string | null = null;
        if (error.error instanceof ErrorEvent) {
          console.log('Error del Lado del Cliente');
          message = `Error: ${error.error.message}`;
        } else {
          console.log('Error del Lado del Servidor');
          message = `Código: ${error.status},  Mensaje: ${error.message}`;
          console.log(message);
          //Códigos de estado HTTP con su respectivo mensaje
          switch (error.status) {
            case 0:
              message="Error desconocido"
              break
            case 400:
              message = 'Solicitud incorrecta';
              break;
            case 401:
              message = 'No autorizado';
              break;
            case 403:
              message = 'Acceso denegado';
              break;
            case 404:
              message = 'Recurso No encontrado';
              break;
            case 422:
              message = 'Se ha presentado un error';
              break;
            case 500:
              message = 'Error interno del servidor';
              break;
            case 503:
              message = 'Servicio no disponible';
              break;
          }
        }
        this.noti.error('Error '+error.status,message,5000)
        throw new Error(error.message);
      })
    );
  }
}
