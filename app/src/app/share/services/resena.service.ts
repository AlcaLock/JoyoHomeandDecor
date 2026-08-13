import { Injectable } from '@angular/core';
import { ResenaModel } from '../models/ResenaModel';
import { BaseAPI } from '../base-api';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ModeracionResenaModel } from '../models/ModeracionResenaModel';
@Injectable({
  providedIn: 'root'
})

export class ResenaService extends BaseAPI<ResenaModel> {
  constructor(
    httpBase: HttpClient, // Para BaseAPI
    private httpCustom: HttpClient // Para métodos propios (nuevo instancia)
  ) {
    super(httpBase, environment.endPointResena);
  }

puedeResenar(usuarioId: number, productoId: number): Observable<{puedeResenar: boolean}> {
  return this.httpCustom.get<{puedeResenar: boolean}>(
    `${environment.apiURL}/${environment.endPointResena}/puede-resenar/${usuarioId}/${productoId}`
  );
}

  reportarResena(resenaId: number, usuarioId: number, motivo: string): Observable<any> {
  return this.httpCustom.post(
    `${environment.apiURL}/${environment.endPointResena}/reporte-resena`,
    { resenaId, usuarioId, motivo }
  );
}

moderar(
  resenaId: number, 
  data: { oculto: boolean; administradorId: number; comentario?: string }
): Observable<ResenaModel> {
  return this.httpCustom.put<ResenaModel>(
    `${environment.apiURL}/${environment.endPointResena}/${resenaId}`,
    data
  );
}

moderarAdmin(
  resenaId: number, 
  data: { estado: boolean; administradorId: number; comentario?: string }
): Observable<ModeracionResenaModel> {
  return this.httpCustom.put<ModeracionResenaModel>(
    `${environment.apiURL}/${environment.endPointResena}/moderar/${resenaId}`, // <- aquí cambia la ruta
    data
  );
}



yaReportada(resenaId: number, usuarioId: number): Observable<{ yaReportada: boolean }> {
  return this.httpCustom.get<{ yaReportada: boolean }>(
    `${environment.apiURL}/${environment.endPointResena}/ya-reportada/${resenaId}/${usuarioId}`
  );
}

getModeradas(): Observable<ResenaModel[]> {
  return this.httpCustom.get<ResenaModel[]>(`${environment.apiURL}/${environment.endPointResena}/reportadas`);
}

cambiarEstadoReportes(resenaId: number, estado: 'RECHAZADO' | 'ACEPTADO') {
  return this.httpCustom.patch(
    `${environment.apiURL}/${environment.endPointResena}/${resenaId}/estado`,
    { estado }
  );
}





  }

