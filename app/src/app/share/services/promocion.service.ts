import { Injectable } from '@angular/core';
import { PromocionModel } from '../models/PromocionModel';
import { HttpClient } from '@angular/common/http';
import { BaseAPI } from '../base-api';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PromocionService extends BaseAPI<PromocionModel> {
    constructor(httpClient: HttpClient) { 
        super(
          httpClient,
          environment.endPointPromocion);
          
      }
      
}

