import { Component, ViewChild } from '@angular/core';
import { PromocionService } from '../../share/services/promocion.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { PromocionModel } from '../../share/models/PromocionModel';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { NotificationService } from '../../share/notification-service';
import { PromocionDiag } from '../promocion-diag/promocion-diag';
import { TipoDescuentoModel } from '../../share/models/TipoDescuentoModel';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-promocion-admin',
  standalone: false,
  templateUrl: './promocion-admin.html',
  styleUrl: './promocion-admin.css'
})
export class PromocionAdmin {
    private destroy$ = new Subject<boolean>();
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  dataSource = new MatTableDataSource<PromocionModel>();

  // Columnas a mostrar (deben coincidir con las del HTML)
  displayedColumns = ['nombre', 'tipo', 'descuento', 'vigencia', 'aplicacion', 'acciones'];
  currentLang: string = 'es'; // por defecto

  constructor(
    private promocionService: PromocionService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private notification: NotificationService,
    private translate: TranslateService
  ) {

    this.translate.onLangChange.subscribe(lang => {
  this.currentLang = lang.lang;
});

  }

  ngOnInit() {
    // Configurar etiquetas del paginador
    this.paginator._intl.itemsPerPageLabel = 'Items por página';
    this.paginator._intl.nextPageLabel = 'Siguiente';
    this.paginator._intl.previousPageLabel = 'Anterior';
    this.paginator._intl.firstPageLabel = 'Primera página';
    this.paginator._intl.lastPageLabel = 'Última página';
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.listarPromociones();
  }

  // Listar todas las promociones del API
listarPromociones() {
  this.promocionService.get().subscribe({
    next: (promociones: PromocionModel[]) => {
      this.dataSource.data = promociones;
    },
    error: (err) => {
      console.error('Error al cargar promociones:', err);
      this.notification.error(
  this.translate.instant('NOTIFICATIONS.ERROR'),
  this.translate.instant('NOTIFICATIONS.LOAD_PROMOTIONS_FAILED'),
  5000
);
    }
  });
  }

  // Ver detalle de la promoción en un diálogo
  verDetalle(id: number) {
    const dialogConfig = {
      width: '50%',
      disableClose: false,
      data: { id: id }
    };
    this.dialog.open(PromocionDiag, dialogConfig);
  }

  // Navegar a creación de promoción
  crearPromocion() {
    this.router.navigate(['promocion/create']);
  }

  // Navegar a edición de promoción
editarPromocion(promocion: PromocionModel) {

  if (this.getEstadoPromocion(promocion) === 'aplicada') {
    this.notification.warning(
  this.translate.instant('NOTIFICATIONS.WARNING'),
  this.translate.instant('NOTIFICATIONS.CANNOT_EDIT_FINALIZED_PROMOTION')
);

    return;
  }
  
  this.router.navigate(['/promocion/update', promocion.id], {
    state: { promocion }
  });
}

  // Aplicar filtro a la tabla
  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

// Método para obtener el texto del tipo de descuento
getTipoDescuentoTexto(tipo: TipoDescuentoModel): string {
  switch(tipo) {
    case TipoDescuentoModel.PORCENTAJE: return 'Porcentaje';
    case TipoDescuentoModel.MONTO_FIJO: return 'Monto fijo';
    default: return 'Desconocido';
  }
}

// Método para formatear el descuento según el tipo
getFormatoDescuento(tipo: TipoDescuentoModel, valor: number): string {
  if (valor == null) return 'N/A'; // Maneja null/undefined

  switch(tipo) {
    case TipoDescuentoModel.PORCENTAJE:
      // Asegura que el valor sea tratado como porcentaje (15 → 15%, 0.15 → 15%)
      const porcentaje = valor >= 1 ? valor : valor * 100;
      return `${porcentaje.toFixed(0)}%`; // Sin decimales para porcentajes

    case TipoDescuentoModel.MONTO_FIJO:
      // Formato de moneda para montos fijos (similar a tu lógica de precios)
      return `₡${Math.round(valor).toLocaleString('es-CR')}`; // Formato costarricense

    default:
      return valor.toString();
  }
}
getClaseDescuento(tipo: TipoDescuentoModel): string {
  return tipo === TipoDescuentoModel.PORCENTAJE ? 'descuento-porcentaje' : 'descuento-monto';
}

 // Método para determinar el estado (sin modificar el modelo)
// Método para determinar el estado (modificado para manejar promociones de un día)
getEstadoPromocion(promocion: PromocionModel): string {
  const ahora = new Date();
  const hoy = new Date(ahora.setHours(0, 0, 0, 0)); // Normalizar a inicio del día
  
  const inicio = new Date(promocion.inicio);
  inicio.setHours(0, 0, 0, 0); // Normalizar fecha inicio
  
  const fin = new Date(promocion.fin);
  fin.setHours(23, 59, 59, 999); // Normalizar fecha fin (hasta final del día)

  if (hoy < inicio) return 'proxima';
  if (hoy > fin) return 'aplicada';
  return 'activa';
}

  // Método para obtener el texto a mostrar
getTextoVigencia(promocion: PromocionModel): string {
  const estado = this.getEstadoPromocion(promocion);
  // Opciones de formato corregidas (usando los valores correctos)
  const opcionesFecha: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  };

  switch(estado) {
  case 'activa':
    return `${this.translate.instant('PROMOCION.vigenteHasta')} ${new Date(promocion.fin).toLocaleDateString(this.currentLang, opcionesFecha)}`;
  case 'aplicada':
    return `${this.translate.instant('PROMOCION.finalizo')} ${new Date(promocion.fin).toLocaleDateString(this.currentLang, opcionesFecha)}`;
  case 'proxima':
    return `${this.translate.instant('PROMOCION.inicia')} ${new Date(promocion.inicio).toLocaleDateString(this.currentLang, opcionesFecha)}`;
  default:
    return `${new Date(promocion.inicio).toLocaleDateString(this.currentLang, opcionesFecha)} - ${new Date(promocion.fin).toLocaleDateString(this.currentLang, opcionesFecha)}`;
}
}

  // Método para obtener el color según el estado
  getColorEstado(promocion: PromocionModel): string {
    switch(this.getEstadoPromocion(promocion)) {
      case 'activa': return 'accent';
      case 'vencida': return 'warn';
      case 'proxima': return 'primary';
      default: return '';
    }
  }

  // Método para obtener el icono según el estado
  getIconoEstado(promocion: PromocionModel): string {
    switch(this.getEstadoPromocion(promocion)) {
      case 'activa': return 'event_available';
      case 'vencida': return 'event_busy';
      case 'proxima': return 'event_upcoming';
      default: return 'event';
    }
  }

  // Método existente para días restantes (actualizado)
diasRestantes(promocion: PromocionModel): number {
  const fin = new Date(promocion.fin);
  fin.setHours(23, 59, 59, 999); // Considerar hasta fin del día
  
  const ahora = new Date();
  const diff = fin.getTime() - ahora.getTime();
  
  // Si la diferencia es negativa (ya pasó), devolver 0
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

    ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
