import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';
import { BaseAPI } from '../base-api';
import { ProductoComponenteModel } from '../models/ProductoComponenteModel';
import { ComponenteModel } from '../models/ComponenteModel';

@Injectable({
  providedIn: 'root',
})
export class ProductoComponenteService extends BaseAPI<ProductoComponenteModel> {
  constructor(
    httpBase: HttpClient, // Para BaseAPI
    private httpCustom: HttpClient // Para métodos propios
  ) {
    super(httpBase, environment.endPointProductoComponente);
  }

  /**
   * Obtiene todos los componentes de tipo Tamaño para un producto específico
   * @param idProducto ID del producto
   */
  getSizesByProductId(idProducto: number): Observable<ComponenteModel[]> {
    return this.httpCustom.get<ComponenteModel[]>(
      `${environment.apiURL}/${environment.endPointProductoComponente}/${idProducto}/tamanos`
    );
  }

  /**
   * Obtiene todos los componentes de tipo Color para un producto específico
   * @param idProducto ID del producto
   */
  getColorsByProductId(idProducto: number): Observable<ComponenteModel[]> {
    return this.httpCustom.get<ComponenteModel[]>(
      `${environment.apiURL}/${environment.endPointProductoComponente}/${idProducto}/colores`
    );
  }

  /**
   * Obtiene todos los componentes de tipo Material para un producto específico
   * @param idProducto ID del producto
   */
  getMaterialsByProductId(idProducto: number): Observable<ComponenteModel[]> {
    return this.httpCustom.get<ComponenteModel[]>(
      `${environment.apiURL}/${environment.endPointProductoComponente}/${idProducto}/materiales`
    );
  }

  verificarRelacionExistente(
    idProducto: number,
    idComponente: number
  ): Observable<any> {
    const params = {
      id_producto: idProducto.toString(),
      id_componente: idComponente.toString(),
    };

    return this.httpCustom.get<any>(
      `${environment.apiURL}/${environment.endPointProductoComponente}/check-existing`,
      { params }
    );
  }

  /**
   * Obtiene todas las relaciones de un producto específico
   * @param idProducto ID del producto
   */
getByProductId(idProducto: number): Observable<ProductoComponenteModel[]> {
  return this.httpCustom.get<ProductoComponenteModel[]>(
    `${environment.apiURL}/${environment.endPointProductoComponente}/${idProducto}`
  );
}


  /**
   * Actualiza todas las relaciones de un producto
   * @param idProducto ID del producto
   * @param data Arrays con los IDs de componentes por tipo
   */
  updateByProduct(
    idProducto: number,
    data: {
      tamanos?: number[];
      colores?: number[];
      materiales?: number[];
    }
  ): Observable<ComponenteModel[]> {
    return this.httpCustom.put<ComponenteModel[]>(
      `${environment.apiURL}/${environment.endPointProductoComponente}/${idProducto}`,
      data
    );
  }
}
