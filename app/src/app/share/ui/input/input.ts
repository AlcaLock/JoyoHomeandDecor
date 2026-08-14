import { Component, forwardRef, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextId = 0;

export type InputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'tel';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './input.html',
  styleUrl: './input.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppInput),
      multi: true,
    },
  ],
})
export class AppInput implements ControlValueAccessor {
  label = input('');
  hint = input('');
  error = input('');
  placeholder = input('');
  type = input<InputType>('text');
  maxlength = input<number | null>(null);
  required = input(false);

  protected readonly inputId = `app-input-${nextId++}`;
  protected readonly value = signal('');
  protected readonly disabled = signal(false);
  protected onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  handleInput(target: EventTarget | null): void {
    const value = (target as HTMLInputElement)?.value ?? '';
    this.value.set(value);
    this.onChange(value);
  }

  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
