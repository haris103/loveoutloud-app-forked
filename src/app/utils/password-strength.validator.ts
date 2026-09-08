// password-strength.validator.ts
import { ValidatorFn, AbstractControl } from '@angular/forms';

export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): { passwordStrength: number } | null => {
    const value = control.value || '';
    let strength = 0;

    if (value.length >= 8) strength++;
    if (value.match(/[a-z]/) && value.match(/[A-Z]/)) strength++;
    if (value.match(/[0-9]/)) strength++;
    if (value.match(/[^a-zA-Z0-9]/)) strength++;

    return strength < 2 ? { passwordStrength: strength } : null;
  };
}
