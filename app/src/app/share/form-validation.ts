import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
/**
 * Interface para los mensajes de error de form validation.
 */
export interface FormValidatorMessage {
  forControl: string;
  forValidator: string;
  text: string;
}

//Mensajes de errores de validación
export const FormErrorMessage: FormValidatorMessage[] = [
  {
    forControl: 'nombre',
    forValidator: 'required',
    text: 'El Nombre es requerido',
  },
  {
    forControl: 'nombre',
    forValidator: 'minlength',
    text: 'El nombre debe tener 3 carácteres mínimo',
  },
  {
    forControl: 'descripcion',
    forValidator: 'required',
    text: 'La descripción es requerida',
  },
  {
    forControl: 'precio',
    forValidator: 'required',
    text: 'El precio es requerido',
  },
  {
    forControl: 'precio',
    forValidator: 'pattern',
    text: 'El precio solo acepta números con dos decimales',
  },
  {
    forControl: 'publicar',
    forValidator: 'required',
    text: 'Publicar es requerido',
  },
  {
    forControl: 'generos',
    forValidator: 'required',
    text: 'Es requerido que seleccione un género',
  },
  {
    forControl: 'anno_lanzamiento',
    forValidator: 'required',
    text: 'El año de lanzamiento es obligatorio',
  },
  {
    forControl: 'anno_lanzamiento',
    forValidator: 'pattern',
    text: 'El año debe ser un número de 4 dígitos',
  },
  {
    forControl: 'plataformaId',
    forValidator: 'required',
    text: 'La plataforma es obligatoria',
  },
  {
    forControl: 'descripcion',
    forValidator: 'minWords',
    text: 'La descripción debe contener mínimo 3 palabras',
  },
  {
    forControl: 'email',
    forValidator: 'required',
    text: 'El email es requerido',
  },
  {
    forControl: 'password',
    forValidator: 'required',
    text: 'Es password es requerido',
  },
  { forControl: 'rol', forValidator: 'required', text: 'El rol es requerido' },
];

/**
 * Recupera el mensaje de error de validación apropiado para un control de formulario determinado.
 *
 * @param control La instancia de AbstractControl (FormControl, FormGroup o FormArray).
 * @param controlName el nombre del control, tal como se define en FormErrorMessage.
 * @returns La cadena del mensaje de error si existe un error y el control está touched/dirty, de lo contrario es falso.
 */
export function getFormValidationErrorMessage(
  formGroup: FormGroup | FormArray,
  controlPath: string
): string | false {
  const control = formGroup.get(controlPath);
  if (!control) {
    return false;
  }
  // Validar los FormControl individuales.
  if (control instanceof FormGroup || control instanceof FormArray) {
    // Si el path es para un grupo/array y no tiene errores *directos*,
    // significa que los errores están en sus hijos y se manejarían por separado.
    if (!control.errors || !Object.keys(control.errors).length) {
      return false;
    }
  }
  if (control.invalid && (control.dirty || control.touched)) {
    // Iterar sobre los posibles errores del control
    for (const validatorName in control.errors) {
      if (control.errors.hasOwnProperty(validatorName)) {
        // Obtenemos el nombre "base" del control, sin la ruta del array 
        // (ej. 'anno_lanzamiento' de 'plataformas.0.anno_lanzamiento')
        const baseControlName = controlPath.split('.').pop() || controlPath;

        // Buscamos el mensaje de error en la lista global
        for (const message of FormErrorMessage) {
          if (
            message.forControl === baseControlName &&
            message.forValidator === validatorName
          ) {
            return message.text;
          }
        }
      }
    }
  }

  return false;
}
