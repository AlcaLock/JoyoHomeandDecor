import { Injectable } from '@angular/core';
import { CategoriaModel } from '../models/CategoriaModel';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { BaseAPI } from '../base-api';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService extends BaseAPI<CategoriaModel> {

  constructor(httpClient: HttpClient) {
    super(
      httpClient,
       environment.endPointCategoria);
  }
}
