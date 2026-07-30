import { Injectable } from '@angular/core';
import { CategoriaModel } from '../models/CategoriaModel';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { BaseAPI } from '../base-api';
import { UsuarioModel } from '../models/UsuarioModel';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService extends BaseAPI<UsuarioModel> {
  constructor(
    httpBase: HttpClient,
    private httpCustom: HttpClient 
  ) {
    super(httpBase, environment.endPointUsuario);
  }


  updateUsuario(id: number, data: Partial<UsuarioModel>): Observable<UsuarioModel> {
  return this.httpCustom.put<UsuarioModel>(
    `${environment.apiURL}/${environment.endPointUsuario}/${id}`,
    data
  );
}

resetPassword(token: string, nuevaContrasenna: string): Observable<any> {
  return this.httpCustom.post(`${environment.apiURL}/${environment.endPointUsuario}/reset-password`, {
    token,
    nuevaContrasenna
  });
}

resetTempPassword(userId: number, nuevaContrasenna: string): Observable<any> {
  return this.httpCustom.post(`${environment.apiURL}/${environment.endPointUsuario}/reset-temp-password`, {
    userId,
    nuevaContrasenna
  });
}




   forgotPassword(data: { correo: string }): Observable<any> {
    return this.httpCustom.post(
      `${environment.apiURL}/${environment.endPointUsuario}/forgot-password`,
      data
    );
  }

  adminResetPassword(id: number): Observable<any> {
  return this.httpCustom.post(
    `${environment.apiURL}/${environment.endPointUsuario}/${id}/admin-reset-password`,
    {}
  );
}


}
