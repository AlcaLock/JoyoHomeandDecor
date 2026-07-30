import { Component, ViewChild } from '@angular/core';
import { ProductoService } from '../../share/services/producto.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog,MatDialogConfig } from '@angular/material/dialog';
import { ProductoModel } from '../../share/models/ProductoModel';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { NotificationService } from '../../share/notification-service';
import { ProductoDiag } from '../producto-diag/producto-diag';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-producto-admin',
  standalone: false,
  templateUrl: './producto-admin.html',
  styleUrl: './producto-admin.css'
})
export class ProductoAdmin {
    private destroy$ = new Subject<boolean>();
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  dataSource = new MatTableDataSource<ProductoModel>();

  // Columnas a mostrar
  displayedColumns = ['nombre', 'precio', 'stock', 'acciones'];

  constructor(
    private productoService: ProductoService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {}

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
    this.listarProductos();
  }

  // Listar todos los productos del API
  listarProductos() {
    this.productoService.get().subscribe({
      next: (productos: ProductoModel[]) => {
        this.dataSource.data = productos;
      },
      error: (err) => console.error('Error al cargar productos:', err)
    });
  }

  // Ver detalle del producto en un diálogo
  verDetalle(id: number) {
    const dialogConfig = {
      height: '80%',
      width: '50%',
      disableClose: false,
      data: { id: id }
    };
    this.dialog.open(ProductoDiag, dialogConfig);
  }

  // Navegar a edición de producto
editarProducto(producto: ProductoModel) {
  this.router.navigate(['/producto/update', producto.id], {
    state: { producto } // ← Así se pasa correctamente el estado
  });
}

aplicarFiltro(event: Event) {
  const filterValue = (event.target as HTMLInputElement).value;
  this.dataSource.filter = filterValue.trim().toLowerCase();

  if (this.dataSource.paginator) {
    this.dataSource.paginator.firstPage();
  }
}


eliminarProducto(id: number) {

  console.log('Eliminar producto con id:', id);

}
  // Navegar a creación de producto
  crearProducto() {
    this.router.navigate(['/producto/create'])
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

    ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}