import { AbstractControl, ValidationErrors } from '@angular/forms';

export function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmpassword')?.value;

  if (password !== confirmPassword) {
    return { passwordsMismatch: true };
  }

  return null;
}