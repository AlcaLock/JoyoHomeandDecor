import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseAPI } from '../base-api';
import { environment } from '../../../environments/environment.development';
import { PedidoModel } from '../models/PedidoModel';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PedidoService extends BaseAPI<PedidoModel> {

  constructor(httpClient: HttpClient,
    private httpCustom: HttpClient
  ) {
    super(
      httpClient,
       environment.endPointPedido);
  }
cambiarEstado(
  idPedido: number,
  estado: 'PENDIENTE_PAGO' | 'PAGADO' | 'EN_PREPARACION' | 'ENTREGADO',
  administradorId?: number // opcional, solo si es admin
): Observable<PedidoModel> {
  const body: any = { estado };
  if (administradorId) body.administradorId = administradorId;

  return this.httpCustom.patch<PedidoModel>(
    `${environment.apiURL}/${environment.endPointPedido}/${idPedido}/estado`,
    body
  );
}


}
