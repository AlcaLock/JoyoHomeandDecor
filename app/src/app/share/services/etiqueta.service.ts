import { Injectable } from '@angular/core';
import { BaseAPI } from '../base-api';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { EtiquetaModel } from '../models/EtiquetaModel';

@Injectable({
  providedIn: 'root'
})
export class EtiquetaService extends BaseAPI<EtiquetaModel> {

  constructor(
    httpBase: HttpClient,
    private httpCustom: HttpClient
  ) {
    super(httpBase, environment.endPointEtiqueta);
  }

}
