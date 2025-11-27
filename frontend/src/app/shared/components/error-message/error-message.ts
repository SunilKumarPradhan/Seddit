import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-message',
  templateUrl: './error-message.html',
  styleUrl: './error-message.css'
})
export class ErrorMessage {
  type = input<'error' | 'warning' | 'info' | 'success'>('error');
  title = input<string>('');
  message = input.required<string>();
  dismissible = input<boolean>(false);
  
  dismiss = output<void>();
  
  getIcon(): string {
    switch (this.type()) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      case 'success': return 'check_circle';
      default: return 'error';
    }
  }
}