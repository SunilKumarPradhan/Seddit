import { Component, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserAvatar } from '../../../shared/components/user-avatar/user-avatar';

@Component({
  selector: 'app-comment-form',
  imports: [ReactiveFormsModule, UserAvatar],
  templateUrl: './comment-form.html',
  styleUrl: './comment-form.css'
})
export class CommentForm {
  parentCommentId = input<string | null>(null);
  isReplying = input<boolean>(false);
  
  submit = output<string>();
  cancelReply = output<void>();
  
  commentForm: FormGroup;
  isFocused = signal(false);
  isSubmitting = signal(false);
  currentUser = signal('currentUser'); // Will get from auth service
  
  constructor(private fb: FormBuilder) {
    this.commentForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(1)]]
    });
  }
  
  async onSubmit() {
    if (this.commentForm.invalid) return;
    
    this.isSubmitting.set(true);
    const content = this.commentForm.get('content')?.value;
    
    // Emit the content
    this.submit.emit(content);
    
    // Reset form
    this.commentForm.reset();
    this.isFocused.set(false);
    this.isSubmitting.set(false);
  }
  
  cancel() {
    this.commentForm.reset();
    this.isFocused.set(false);
    this.cancelReply.emit();
  }
  
  handleBlur() {
    // Only unfocus if form is empty
    if (!this.commentForm.get('content')?.value) {
      this.isFocused.set(false);
    }
  }
  
  formatText(format: string) {
    // Implement text formatting
    console.log('Format:', format);
  }
}