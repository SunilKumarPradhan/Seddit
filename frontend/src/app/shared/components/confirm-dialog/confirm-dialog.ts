import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css'
})
export class ConfirmDialog {
  title = input<string>('Confirm Action');
  message = input<string>('Are you sure you want to proceed?');
  confirmText = input<string>('Confirm');
  cancelText = input<string>('Cancel');
  isDanger = input<boolean>(false);
  
  confirmed = output<void>();
  cancelled = output<void>();
  
  confirm() {
    this.confirmed.emit();
  }
  
  cancel() {
    this.cancelled.emit();
  }
}