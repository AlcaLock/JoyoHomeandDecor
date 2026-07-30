import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseAPI } from '../base-api';
import { environment } from '../../../environments/environment.development';
import { ProductoPersonalizadoModel } from '../models/ProductoPersonalizadoModel';

@Injectable({
  providedIn: 'root'
})
export class ProductoPeronalizadoService extends BaseAPI<ProductoPersonalizadoModel> {

  constructor(httpClient: HttpClient) {
    super(
      httpClient,
       environment.endPointProductoPerzonalizado);
  }
}
