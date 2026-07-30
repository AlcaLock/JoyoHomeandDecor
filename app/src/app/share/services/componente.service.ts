import { Injectable } from '@angular/core';
import { BaseAPI } from '../base-api';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';
import { ComponenteModel } from '../models/ComponenteModel';

@Injectable({
  providedIn: 'root',
})
export class ComponenteService extends BaseAPI<ComponenteModel> {
  constructor(
    httpBase: HttpClient, // Para BaseAPI
    private httpCustom: HttpClient // Para métodos propios
  ) {
    super(httpBase, environment.endPointComponente);
  }

getSizes(): Observable<ComponenteModel[]> {
    return this.httpCustom.get<ComponenteModel[]>(
      `${environment.apiURL}/${environment.endPointComponente}/tamanos`
    );
  }

  /**
   * Obtiene todos los componentes de tipo Color
   */
  getColors(): Observable<ComponenteModel[]> {
    return this.httpCustom.get<ComponenteModel[]>(
      `${environment.apiURL}/${environment.endPointComponente}/colores`
    );
  }

  /**
   * Obtiene todos los componentes de tipo Material
   */
  getMaterials(): Observable<ComponenteModel[]> {
    return this.httpCustom.get<ComponenteModel[]>(
      `${environment.apiURL}/${environment.endPointComponente}/materiales`
    );
  }

  createWithImage(componente: ComponenteModel, file?: File): Observable<ComponenteModel> {
  const formData = new FormData();
  formData.append('nombre', componente.nombre);
  formData.append('descripcion', componente.descripcion || '');
  formData.append('precio', componente.precio.toString());
  formData.append('grupoComponenteId', componente.grupoComponenteId.toString());
  if (file) {
    formData.append('imagen', file);
  }

  return this.httpCustom.post<ComponenteModel>(
    `${environment.apiURL}/${environment.endPointComponente}`,
    formData
  );
}

updateWithImage(componente: ComponenteModel, file?: File): Observable<ComponenteModel> {
  const formData = new FormData();
  formData.append('nombre', componente.nombre);
  formData.append('descripcion', componente.descripcion || '');
  formData.append('precio', componente.precio.toString());
  formData.append('grupoComponenteId', componente.grupoComponenteId.toString());
  if (file) {
    formData.append('imagen', file);
  }

  return this.httpCustom.put<ComponenteModel>(
    `${environment.apiURL}/${environment.endPointComponente}/${componente.id}`,
    formData
  );
}


}
