import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ProductoComponenteModel } from '../../share/models/ProductoComponenteModel';
import { ProductoComponenteService } from '../../share/services/producto-componente.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../share/notification-service';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-producto-componente-admin',
  standalone: false,
  templateUrl: './producto-componente-admin.html',
  styleUrl: './producto-componente-admin.css',
})
export class ProductoComponenteAdmin implements OnInit, OnDestroy {
  relaciones: ProductoComponenteModel[] = [];
  dataSource = new MatTableDataSource<ProductoComponenteModel>();
  displayedColumns = ['producto', 'componente', 'tipo', 'precio', 'acciones'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  private destroy$ = new Subject<boolean>();

  constructor(
    private productoComponenteService: ProductoComponenteService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private notification: NotificationService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.paginator._intl.itemsPerPageLabel = 'Items por página';
    this.paginator._intl.nextPageLabel = 'Siguiente';
    this.paginator._intl.previousPageLabel = 'Anterior';
    this.paginator._intl.firstPageLabel = 'Primera página';
    this.paginator._intl.lastPageLabel = 'Última página';
  }

  ngAfterViewInit(): void {
    this.dataSource = new MatTableDataSource(this.relaciones);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.listarRelaciones();
    // Añade el filtro personalizado
    this.dataSource.filterPredicate = this.createFilter();
  }

  listarRelaciones() {
    this.productoComponenteService.get().subscribe({
      next: (relaciones: ProductoComponenteModel[]) => {
        this.dataSource.data = relaciones;
      },
      error: (err) => {
        console.error('Error al cargar relaciones:', err);
        this.notification.error(
          this.translate.instant('NOTIFICATIONS.ERROR'),
          this.translate.instant('NOTIFICATIONS.LOAD_RELATIONS_FAILED'),
          5000
        );
      },
    });
  }

  // Navegar a creación de relación
  crearRelacion() {
    this.router.navigate(['productoComponente/create']);
  }

  // Navegar a edición de relación
  editarRelacion(relacion: ProductoComponenteModel) {
    this.router.navigate(['/productoComponente/update', relacion.id_producto], {
      state: { producto: relacion.producto },
    });
  }

       getPrecioCRC(valor: number): string {
    const formatter = new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      currencyDisplay: 'narrowSymbol',
    });

    const resultado = formatter.format(valor);
    return resultado.endsWith('₡')
      ? `₡${resultado.slice(0, -1).trim()}`
      : resultado;
  }

  // Crea el método para el filtro personalizado
  createFilter(): (data: ProductoComponenteModel, filter: string) => boolean {
    return (data: ProductoComponenteModel, filter: string): boolean => {
      // Convierte todo a minúsculas para hacer la búsqueda case-insensitive
      const searchTerms = filter.toLowerCase();

      // Busca en el nombre del producto
      const productoMatch =
        data.producto?.nombre.toLowerCase().includes(searchTerms) || false;

      // Busca en el nombre del componente (opcional)
      const componenteMatch =
        data.componente?.nombre.toLowerCase().includes(searchTerms) || false;

      // Devuelve true si encuentra coincidencia en alguno de los campos
      return productoMatch || componenteMatch;
    };
  }

  // Modifica el método aplicarFiltro
  aplicarFiltro(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getTipoComponente(grupoId: number): string {
    switch (grupoId) {
      case 1:
        return 'Tamaño';
      case 2:
        return 'Color';
      case 3:
        return 'Material';
      default:
        return 'Desconocido';
    }
  }

  getIconoTipo(grupoId: number): string {
    switch (grupoId) {
      case 1:
        return 'straighten';
      case 2:
        return 'palette';
      case 3:
        return 'texture';
      default:
        return 'help';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
