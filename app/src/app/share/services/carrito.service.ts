import { Injectable } from '@angular/core';
import { BaseAPI } from '../base-api';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';
import { CarritoModel } from '../models/CarritoModel';
import { CarritoProductoModel } from '../models/CarritoProductoModel';

@Injectable({
  providedIn: 'root',
})
export class CarritoService extends BaseAPI<CarritoModel> {
  constructor(
    httpBase: HttpClient, // Para BaseAPI
    private httpCustom: HttpClient // Para métodos propios
  ) {
    super(httpBase, environment.endPointCarrito);
  }

  // Carrito Routes
  getByUser(usuarioId: number): Observable<CarritoModel> {
    return this.httpCustom.get<CarritoModel>(
      `${environment.apiURL}/${environment.endPointCarrito}/usuario/${usuarioId}`
    );
  }

guardarCarrito(usuarioId: number) {
  return this.httpCustom.put(
       `${environment.apiURL}/${environment.endPointCarrito}/guardar/${usuarioId}`, {});
}

abandonarCarrito(usuarioId: number) {
  return this.httpCustom.put(
       `${environment.apiURL}/${environment.endPointCarrito}/abandonar/${usuarioId}`, {});

  }
  

}
