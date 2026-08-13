import { Injectable } from '@angular/core';
import { BaseAPI } from '../base-api';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { GrupoComponenteModel } from '../models/GrupoComponenteModel';

@Injectable({
  providedIn: 'root'
})
export class GrupoComponenteService extends BaseAPI<GrupoComponenteModel> {

  constructor(
    httpBase: HttpClient,
    private httpCustom: HttpClient
  ) {
    super(httpBase, environment.endPointGrupoComponente);
  }

}
