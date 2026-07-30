import { Component, OnInit, OnDestroy, computed } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ProductoService } from '../../share/services/producto.service';
import { ResenaService } from '../../share/services/resena.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ResenaModel } from '../../share/models/ResenaModel';
import { MatDialog } from '@angular/material/dialog';
import { ResenaDiag } from '../../resena/resena-diag/resena-diag';
import { NotificationService } from '../../share/notification-service';
import { UsuarioService } from '../../share/services/usuario.service';
import { UsuarioModel } from '../../share/models/UsuarioModel';
import { AuthenticationService } from '../../share/authentication.service';
import { TranslateService } from '@ngx-translate/core';
import { RolModel } from '../../share/models/RolModel';

@Component({
  selector: 'app-producto-detail',
  standalone: false,
  templateUrl: './producto-detail.html',
  styleUrl: './producto-detail.css',
})
export class ProductoDetail implements OnInit, OnDestroy {
  producto: any;
  selectedImage: string = '';
  destroy$: Subject<boolean> = new Subject<boolean>();

  puedeResenar: boolean = false;
  nuevoComentario: string = '';
  nuevaValoracion: number | null = null;

  usuarioLogueadoId!: number;
  nombreUsuarioLogueado: string = '';
  rolUsuario: string = '';



  constructor(
    private productoService: ProductoService,
    private resenaService: ResenaService,
    private dialog: MatDialog,
    private router: Router,
    private activeRoute: ActivatedRoute,
    private noti: NotificationService,
    private authService: AuthenticationService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.authService.getUserProfile().subscribe({
      next: (usuario) => {
        if (usuario) {
          this.usuarioLogueadoId = usuario.id;
          this.nombreUsuarioLogueado = usuario.nombre;
          this.rolUsuario = usuario.rol.toString();

          console.log(
            'Usuario logueado:',
            usuario.nombre,
            '| Rol:',
            this.rolUsuario
          );

          // 🔹 Ahora sí, cargar el producto ya con usuario listo
          const id = this.activeRoute.snapshot.paramMap.get('id');
          if (!isNaN(Number(id))) this.obtenerProducto(Number(id));
        }
      },
      error: (error) => {
        console.error('Error al obtener usuario logueado:', error);
      },
    });

    if (this.producto.imagenes?.length > 0) {
      this.selectedImage = this.producto.imagenes[0].url;
    }
  }

  public isAdmin = computed(() => {
    const user = this.authService.currentUserSignal();
    console.log('User: ', user?.rol.toString());
    return user?.rol.toString() == 'ADMIN';
  });

  selectImage(url: string) {
    this.selectedImage = url;
  }

  obtenerProducto(id: number) {
    this.productoService
      .getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          // Aplicar lógica de promoción similar a ProductoIndex
          const productoConPromocion = {
            ...data,
            tienePromocion: !!data.promocion,
            precioConPromocion: data.promocion
              ? this.calcularPrecioPromocion(
                  data.precio,
                  data.promocion.tipo,
                  data.promocion.descuento
                )
              : undefined,
            promocionActiva: data.promocion
              ? {
                  ...data.promocion,
                  nombre: data.promocion.nombre || 'Promoción',
                  tipo: data.promocion.tipo || 'PORCENTAJE',
                  descuento: data.promocion.descuento || 0,
                  fin: data.promocion.fin || new Date(),
                  esDeProducto: !!data.promocion.esDeProducto,
                }
              : null,
          };

          this.producto = productoConPromocion;

          // Lógica de reseñas (manteniendo tu implementación original)
          if (this.producto.resenas?.length > 0) {
            this.producto.resenas.sort(
              (a: any, b: any) =>
                new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
            );

            const total = this.producto.resenas.reduce(
              (sum: number, r: any) => sum + r.estrellas,
              0
            );
            this.producto.promedioValoracion =
              total / this.producto.resenas.length;
          } else {
            this.producto.promedioValoracion = 0;
          }

          //  Selección de imagen principal
          if (this.producto.imagenes?.length > 0) {
            this.selectedImage = this.producto.imagenes[0].url;
          }

          if (this.rolUsuario === 'CLIENTE') {
            this.verificarSiPuedeResenar();
          }

          console.log('Producto con promoción:', this.producto);
        },
        error: (err) => {
          console.error('Error al obtener el producto:', err);
        },
      });
  }

  // Reutilizamos el mismo método de cálculo (o lo puedes mover a un servicio compartido)
  private calcularPrecioPromocion(
    precioOriginal: number,
    tipoDescuento: string,
    descuento: number
  ): number {
    let precioConPromocion = precioOriginal;

    if (tipoDescuento === 'PORCENTAJE') {
      precioConPromocion = precioOriginal * (1 - descuento / 100);
    } else if (tipoDescuento === 'MONTO_FIJO') {
      precioConPromocion = precioOriginal - descuento;
    }

    return Number(Math.max(0, precioConPromocion).toFixed(2));
  }

  getConteoPorEstrella() {
    // Inicializar conteo 1 a 5 estrellas con cero
    const conteo = [5, 4, 3, 2, 1].map((n) => ({ estrellas: n, cantidad: 0 }));
    if (!this.producto?.resenas) return conteo;

    for (const resena of this.producto.resenas) {
      const item = conteo.find((c) => c.estrellas === resena.estrellas);
      if (item) item.cantidad++;
    }
    return conteo;
  }

  getArray(n: number): any[] {
    return Array(n).fill(0);
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

  getStars(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
  }

  verificarSiPuedeResenar() {
    console.log("Puede");
    this.resenaService
      .puedeResenar(this.usuarioLogueadoId, this.producto.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (respuesta) => {
          this.puedeResenar = respuesta.puedeResenar;
        },
        error: () => {
          this.puedeResenar = false;
        },
      });
  }

  ocultarResena(resena: ResenaModel) {
    this.resenaService
      .moderar(resena.id, {
        oculto: true,
        administradorId: this.usuarioLogueadoId,
        comentario: 'Reseña ocultada desde la vista de producto',
      })
      .subscribe({
        next: (res) => {
          this.noti.info(
            this.translate.instant('NOTIFICATIONS.INFO'),
            this.translate.instant('NOTIFICATIONS.REVIEW_HIDDEN')
          );
          this.obtenerProducto(this.producto.id);
        },
        error: () => {
          this.noti.error(
            this.translate.instant('NOTIFICATIONS.ERROR'),
            this.translate.instant('NOTIFICATIONS.REVIEW_HIDE_FAILED')
          );
        },
      });
  }

  enviarComentario() {
    if (!this.nuevoComentario || !this.nuevaValoracion) {
      this.noti.warning(
        this.translate.instant('NOTIFICATIONS.WARNING'),
        this.translate.instant('NOTIFICATIONS.COMPLETE_REVIEW_FIELDS')
      );
      return;
    }

    this.resenaService
      .create({
        usuarioId: this.usuarioLogueadoId,
        productoId: this.producto.id,
        comentario: this.nuevoComentario,
        estrellas: this.nuevaValoracion,
        fecha: new Date(), // si el backend lo necesita
        oculto: false, // por defecto, no oculto
      } as unknown as ResenaModel) // para evitar error de TypeScript
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.noti.success(
            this.translate.instant('NOTIFICATIONS.SUCCESS'),
            this.translate.instant('NOTIFICATIONS.REVIEW_CREATED')
          );
          this.nuevoComentario = '';
          this.nuevaValoracion = null;
          this.obtenerProducto(this.producto.id); // refresca datos
        },
        error: () => {
          this.noti.error(
            this.translate.instant('NOTIFICATIONS.ERROR'),
            this.translate.instant('NOTIFICATIONS.REVIEW_SUBMIT_FAILED')
          );
        },
      });
  }

  abrirFormularioReporteSiNoReportado(resena: ResenaModel) {
    this.resenaService
      .yaReportada(resena.id, this.usuarioLogueadoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.yaReportada) {
            this.noti.warning(
              this.translate.instant('NOTIFICATIONS.WARNING'),
              this.translate.instant('NOTIFICATIONS.REVIEW_ALREADY_REPORTED')
            );
          } else {
            this.abrirFormularioReporte(resena.id);
          }
        },
        error: () => {
          this.noti.error(
            this.translate.instant('NOTIFICATIONS.ERROR'),
            this.translate.instant('NOTIFICATIONS.CHECK_REVIEW_REPORT_FAILED')
          );
        },
      });
  }

  abrirFormularioReporte(resenaId: number) {
    const dialogRef = this.dialog.open(ResenaDiag, {
      width: '400px',
      data: { resenaId },
    });

    dialogRef.afterClosed().subscribe((motivo: string | null) => {
      if (!motivo) return;

      this.resenaService
        .reportarResena(resenaId, this.usuarioLogueadoId, motivo)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Podés usar snackbar o un estado local
            this.noti.success(
              this.translate.instant('NOTIFICATIONS.SUCCESS'),
              this.translate.instant('NOTIFICATIONS.REPORT_SENT')
            );
          },
          error: () => {
            this.noti.warning(
              this.translate.instant('NOTIFICATIONS.WARNING'),
              this.translate.instant('NOTIFICATIONS.REPORT_FAILED')
            );
          },
        });
    });
  }

  filtroEstrellas: number | null = null;
  ordenFecha: 'asc' | 'desc' = 'desc';

  getResenasFiltradas() {
    let resenas = [...this.producto.resenas];

    // Filtrar por estrellas
    if (this.filtroEstrellas !== null) {
      resenas = resenas.filter((r) => r.estrellas === this.filtroEstrellas);
    }

    // Ordenar por fecha
    resenas.sort((a, b) => {
      const fechaA = new Date(a.fecha).getTime();
      const fechaB = new Date(b.fecha).getTime();
      return this.ordenFecha === 'desc' ? fechaB - fechaA : fechaA - fechaB;
    });

    return resenas;
  }

  goBack(): void {
    this.router.navigate(['/producto']);
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
