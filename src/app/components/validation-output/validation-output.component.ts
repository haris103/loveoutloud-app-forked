import { Component, input } from '@angular/core';

@Component({
  selector: 'app-validation-output',
  templateUrl: './validation-output.component.html',
  styleUrls: ['./validation-output.component.scss'],
  host: {
    '[class.text-red]': 'type() === "error" || !type()',
    '[class.text-green]': 'type() === "success"',
    '[class.text-gray]': 'type() === "info"',
  },
  standalone: true,
  imports: []
})
export class ValidationOutputComponent {

  value = input.required<string | null | undefined>();
  type = input<'error' | 'success' | 'info' | undefined>('error');
  styleClass = input<string | undefined>('');
}
