import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  private baseUrl = `${environment.apiURL}/imagen-producto`; // Usa el endpoint correcto

  constructor(private http: HttpClient) {}

  uploadMultiple(files: File[], productoId: number): Observable<HttpEvent<any>> {
    const formData = new FormData();
    
    // Agrega cada archivo (el campo 'files' debe coincidir con multer)
    files.forEach(file => {
      formData.append('files', file, file.name);
    });

    const req = new HttpRequest(
      'POST',
      `${this.baseUrl}/upload/${productoId}`, // Ruta final: http://localhost:3000/imagen-producto/upload/5
      formData,
      {
        reportProgress: true,
        responseType: 'json'
      }
    );

    return this.http.request(req);
  }
  updateImages(
    files: File[], 
    productoId: number, 
    imagesToDelete: number[] = []
  ): Observable<HttpEvent<any>> {
    const formData = new FormData();
    
    // 1. Agregar archivos nuevos (manteniendo 'files' para consistencia con el backend)
    files.forEach(file => {
      formData.append('files', file, file.name);
    });

    // 2. Agregar IDs de imágenes a eliminar
    formData.append('imagesToDelete', JSON.stringify(imagesToDelete));

    const req = new HttpRequest(
      'PUT', // Usamos PUT para actualización
      `${this.baseUrl}/upload/${productoId}`, // Nueva ruta específica para actualización
      formData,
      {
        reportProgress: true,
        responseType: 'json'
      }
    );

    return this.http.request(req);
  }

}
