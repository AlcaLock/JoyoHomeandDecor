import { Injectable } from '@angular/core';
import { ProductoModel } from '../models/ProductoModel';
import { BaseAPI } from '../base-api';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductoService extends BaseAPI<ProductoModel> {
  constructor(httpClient: HttpClient, private httpCustom: HttpClient) {
    super(httpClient, environment.endPointProducto);
  }
// En producto.service.ts
getStockyComponentes(): Observable<ProductoModel[]> {
  return this.httpCustom.get<ProductoModel[]>(`${environment.apiURL}/${environment.endPointProducto}/productoStockCompo`);
}
}

