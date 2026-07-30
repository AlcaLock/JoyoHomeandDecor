import { Component, Inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { NotificationService } from '../../share/notification-service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-pago-tarjeta',
  standalone: false,
  templateUrl: './pago-tarjeta.html',
  styleUrl: './pago-tarjeta.css',
})
export class PagoTarjeta {
  paymentForm: FormGroup;
  totalAPagar: number;

  constructor(
    private fb: FormBuilder,
    private notification: NotificationService,
    private translate: TranslateService,
    public dialogRef: MatDialogRef<PagoTarjeta>,
    @Inject(MAT_DIALOG_DATA) public data: { total: number }
  ) {
this.totalAPagar = data.total;

  this.paymentForm = this.fb.group({
    numeroTarjeta: [
      '',
      [Validators.required, this.cardNumberValidator()],
    ],
    fechaExpiracion: [
      '',
      [Validators.required, this.expirationDateValidator()],
    ],
    cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
    nombreTitular: ['', Validators.required],
  });

  // Insertar automáticamente "/" al escribir la fecha
  this.paymentForm.get('fechaExpiracion')?.valueChanges.subscribe(val => {
    if (!val) return;

    // Quita todo lo que no sea número
    const onlyDigits = val.replace(/\D+/g, '');
    if (onlyDigits.length > 2) {
      const mes = onlyDigits.slice(0, 2);
      const anio = onlyDigits.slice(2, 4);
      this.paymentForm.get('fechaExpiracion')?.setValue(
        `${mes}/${anio}`,
        { emitEvent: false }
      );
    } else {
      this.paymentForm.get('fechaExpiracion')?.setValue(onlyDigits, { emitEvent: false });
    }
  });
}

  cardNumberValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const raw = control.value ?? '';
      const value = String(raw).replace(/\D+/g, ''); // solo dígitos
      return value.length === 16 ? null : { longitudInvalida: true };
    };
  }

expirationDateValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    const value: string = control.value;
    if (!value) return null;

    const [mesStr, anioStr] = value.split('/');
    const mes = parseInt(mesStr, 10);
    let anio = parseInt(anioStr, 10);

    if (!mes || !anio || mes < 1 || mes > 12) return { fechaInvalida: true };

    if (anio < 100) anio += 2000;

    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1; 
    const anioActual = hoy.getFullYear();


    if (anio < anioActual) return { fechaExpirada: true };
    
    // Si es el mismo año pero el mes es menor o igual al actual, está expirado
    if (anio === anioActual && mes <= mesActual) return { fechaExpirada: true };

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
    return resultado.endsWith('₡')
      ? `₡${resultado.slice(0, -1).trim()}`
      : resultado;
  }

  onSubmit() {
    if (this.paymentForm.invalid) {
     this.notification.error(
  this.translate.instant('NOTIFICATIONS.ERROR'),
  this.translate.instant('NOTIFICATIONS.COMPLETE_FIELDS')
);
      return;
    }
    this.notification.success(
  this.translate.instant('NOTIFICATIONS.SUCCESS'),
  this.translate.instant('NOTIFICATIONS.PAYMENT_ACCEPTED')
);

    this.dialogRef.close(true);
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
