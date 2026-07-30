import { Component, Inject } from '@angular/core';
import { NotificationService } from '../../share/notification-service';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-pago-efectivo',
  standalone: false,
  templateUrl: './pago-efectivo.html',
  styleUrl: './pago-efectivo.css'
})
export class PagoEfectivo {
 efectivoForm: FormGroup;
  totalAPagar: number;

  constructor(
    private fb: FormBuilder,
    private notification: NotificationService,
    private translate: TranslateService,
    public dialogRef: MatDialogRef<PagoEfectivo>,
    @Inject(MAT_DIALOG_DATA) public data: { total: number }
  ) {
    this.totalAPagar = data.total;

    this.efectivoForm = this.fb.group({
      montoEntregado: [
        '',
        [
          Validators.required,
          Validators.min(0),
          this.montoMayorIgualTotalValidator(this.totalAPagar)
        ]
      ]
    });
  }

  // Validator personalizado: monto >= total a pagar
  montoMayorIgualTotalValidator(total: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = parseFloat(control.value);
      if (isNaN(value) || value < total) {
        return { menorTotal: true };
      }
      return null;
    };
  }
   getPrecioCRC(valor: number): string {
    const formatter = new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      currencyDisplay: 'narrowSymbol',
    });

    const resultado = formatter.format(valor);

    if (resultado.endsWith('₡')) {
      return `₡${resultado.slice(0, -1).trim()}`;
    }

    return resultado;
  }

  // Calcular vuelto automáticamente
  get vuelto(): number {
    const monto = parseFloat(this.efectivoForm.controls['montoEntregado'].value) || 0;
    return monto - this.totalAPagar;
  }

  onSubmit() {
    if (this.efectivoForm.invalid) {
      this.notification.error(
  this.translate.instant('NOTIFICATIONS.ERROR'),
  this.translate.instant('NOTIFICATIONS.INVALID_ORDER_AMOUNT')
);

      return;
    }

    // Simular pago aceptado
    this.notification.success(
  this.translate.instant('NOTIFICATIONS.SUCCESS'),
  this.translate.instant('NOTIFICATIONS.CASH_PAYMENT_ACCEPTED')
);
    this.dialogRef.close(true); // devuelve true si el pago fue aceptado
  }

  onCancel() {
    this.dialogRef.close(false); // cancelar pago
  }
}
