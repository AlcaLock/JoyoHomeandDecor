import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordComplexityValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    if (!value) return null; // no validar si está vacío

    const minLength = value.length >= 8;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const valid = minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

    return valid
      ? null
      : {
          passwordComplexity: {
            hasUpperCase,
            hasLowerCase,
            hasNumber,
            hasSpecialChar,
            minLength,
          },
        };
  };
}
