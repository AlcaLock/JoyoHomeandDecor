import { Injectable } from "@angular/core";
import { RolModel } from "../models/RolModel";
import { BaseAPI } from "../base-api";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";


@Injectable({
  providedIn: 'root'
})

export class RolService extends BaseAPI<RolModel> {
  constructor(
    httpBase: HttpClient, // Para BaseAPI
    private httpCustom: HttpClient // Para métodos propios (nuevo instancia)
  ) {
    super(httpBase, environment.endPointRol);
  }
}
