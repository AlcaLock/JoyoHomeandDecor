import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ComponenteModel } from '../../share/models/ComponenteModel';
import { ComponenteService } from '../../share/services/componente.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../share/notification-service';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-componente-admin',
  standalone: false,
  templateUrl: './componente-admin.html',
  styleUrl: './componente-admin.css'
})
export class ComponenteAdmin implements OnInit, OnDestroy {
  componentes: ComponenteModel[] = [];
  dataSource = new MatTableDataSource<ComponenteModel>();
  displayedColumns = ['nombre', 'descripcion', 'precio', 'grupoComponente', 'acciones'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  private destroy$ = new Subject<boolean>();

  constructor(
    private componenteService: ComponenteService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private notification: NotificationService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    // Configurar el filtro personalizado
    this.dataSource.filterPredicate = this.createFilter();
  }

  ngAfterViewInit(): void {
    // @ViewChild solo resuelve aqu\u00ed, no en ngOnInit -- accederlo antes lanzaba
    // "Cannot read properties of undefined (reading '_intl')" y rompia la pantalla.
    this.paginator._intl.itemsPerPageLabel = 'Items por página';
    this.paginator._intl.nextPageLabel = 'Siguiente';
    this.paginator._intl.previousPageLabel = 'Anterior';
    this.paginator._intl.firstPageLabel = 'Primera página';
    this.paginator._intl.lastPageLabel = 'Última página';

    // Asignar el paginador y ordenamiento al dataSource existente
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.listarComponentes();
  }

  listarComponentes() {
    this.componenteService.get().subscribe({
      next: (componentes: ComponenteModel[]) => {
        this.dataSource.data = componentes;
        // Asegurarse de que el paginador se actualice con los nuevos datos
        if (this.dataSource.paginator) {
          this.dataSource.paginator.firstPage();
        }
      },
      error: (err) => {
        console.error('Error al cargar componentes:', err);
        this.notification.error(
          'Error',
          'Error al cargar los componentes',
          5000
        );
      }
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

  // Navegar a creación de componente
  crearComponente() {
    this.router.navigate(['componente/create']);
  }

  // Navegar a edición de componente
  editarComponente(componente: ComponenteModel) {
    this.router.navigate(['/componente/update', componente.id], {
      state: { componente }
    });
  }

  // Crea el método para el filtro personalizado
  createFilter(): (data: ComponenteModel, filter: string) => boolean {
    return (data: ComponenteModel, filter: string): boolean => {
      // Convierte todo a minúsculas para hacer la búsqueda case-insensitive
      const searchTerms = filter.toLowerCase();
      
      // Busca en el nombre del componente
      const nombreMatch = data.nombre.toLowerCase().includes(searchTerms) || false;
      
      // Busca en la descripción del componente
      const descripcionMatch = data.descripcion?.toLowerCase().includes(searchTerms) || false;
      
      // Busca en el nombre del grupo de componente
      const grupoMatch = data.grupoComponente?.nombre.toLowerCase().includes(searchTerms) || false;
      
      // Devuelve true si encuentra coincidencia en alguno de los campos
      return nombreMatch || descripcionMatch || grupoMatch;
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
    switch(grupoId) {
      case 1: return 'Tamaño';
      case 2: return 'Color';
      case 3: return 'Material';
      default: return 'Desconocido';
    }
  }

  getIconoTipo(grupoId: number): string {
    switch(grupoId) {
      case 1: return 'straighten';
      case 2: return 'palette';
      case 3: return 'texture';
      default: return 'help';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}