import { Component } from '@angular/core';
import { PedidoService } from '../../share/services/pedido.service';
import { NotificationService } from '../../share/notification-service';
import { ActivatedRoute, Router } from '@angular/router';
import { PedidoModel } from '../../share/models/PedidoModel';
import { Subject, takeUntil } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-pedido-detail',
  standalone: false,
  templateUrl: './pedido-detail.html',
  styleUrl: './pedido-detail.css',
})
export class PedidoDetail {
  pedido: PedidoModel | null = null;
  productosNormales: any[] = [];
  productosPersonalizados: any[] = [];
  subtotalCalculado: number = 0;
  impuestoCalculado: number = 0;
  totalCalculado: number = 0;
  currentLang: string = 'es';

  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private pedidoService: PedidoService,
    private noti: NotificationService,
    private router: Router,
    private activeRoute: ActivatedRoute,
    private translate: TranslateService
  ) {

     
    this.currentLang = this.translate.currentLang || 'es';
    this.translate.onLangChange.subscribe(lang => {
      this.currentLang = lang.lang;
    });
    
    const id = Number(this.activeRoute.snapshot.paramMap.get('id'));
    if (!isNaN(id)) {
      this.obtenerPedido(id);
    }
  }

  obtenerPedido(id: number) {
    this.pedidoService
      .getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: PedidoModel) => {
        this.pedido = data;
        this.procesarProductos();
      });
  }

  procesarProductos() {
    if (!this.pedido) return;

    this.productosNormales = [];
    this.productosPersonalizados = [];
    this.subtotalCalculado = 0;

    for (const item of this.pedido.productos) {
      const subtotal = Number(item.precioUnitario) * item.cantidad;

      if (item.producto) {
        this.productosNormales.push({
          nombre: item.producto.nombre,
          cantidad: item.cantidad,
          precioUnitario: Number(item.precioUnitario),
          subtotal,
        });

        this.subtotalCalculado += subtotal;

      } else if (item.personalizado) {
        const base = item.personalizado.productoBase?.precio || 0;

        const componentes = (item.personalizado.componentes || []).map((pc: any) => ({
          nombre: pc.componente?.nombre || 'Sin nombre',
          precio: Number(pc.componente?.precio || 0),
        }));

        const totalComponentes = componentes.reduce((acc, c) => acc + c.precio, 0);
        const totalUnitario = base + totalComponentes;
        const totalSubtotal = totalUnitario * item.cantidad;

        const nombreFormateado = this.obtenerNombrePersonalizado(
          item.personalizado.productoBase?.nombre || 'Producto personalizado',
          item.personalizado.configuracion
        );

        this.productosPersonalizados.push({
          nombre: nombreFormateado,
          base,
          componentes,
          cantidad: item.cantidad,
          totalUnitario,
          subtotal: totalSubtotal,
        });

        this.subtotalCalculado += totalSubtotal;
      }
    }

    this.impuestoCalculado = this.subtotalCalculado * 0.13;
    this.totalCalculado = this.subtotalCalculado + this.impuestoCalculado;
  }

  private obtenerNombrePersonalizado(base: string, configuracionJson: string): string {
    try {
      const config = JSON.parse(configuracionJson);
      const partes = Object.entries(config)
        .map(([clave, valor]) => `${valor}`)
        .join(' ');
      return `${base} (${partes})`;
    } catch {
      return base;
    }
  }

  getPrecioCRC(valor: number): string {
  const formatter = new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    currencyDisplay: 'narrowSymbol', // o 'symbol'
  });

  const resultado = formatter.format(valor);

  // Si quieres mover el símbolo al frente a la fuerza:
  if (resultado.endsWith('₡')) {
    return `₡${resultado.slice(0, -1).trim()}`;
  }

  return resultado;
}

  goBack(): void {
    this.router.navigate(['/pedido']);
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
