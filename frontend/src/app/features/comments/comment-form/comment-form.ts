import { ChangeDetectionStrategy, Component, inject, input, output, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserAvatar } from '../../../shared/components/user-avatar/user-avatar';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-comment-form',
  standalone: true,
  imports: [ReactiveFormsModule, UserAvatar],
  templateUrl: './comment-form.html',
  styleUrl: './comment-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentForm {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);

  parentCommentId = input<number | null>(null);
  isReplying = input<boolean>(false);

  readonly submit = output<string>();
  readonly cancelReply = output<void>();

  readonly commentForm: FormGroup = this.fb.group({
    content: ['', [Validators.required, Validators.minLength(1)]],
  });

  readonly isFocused = signal(false);
  readonly isSubmitting = signal(false);
  
  // ✅ ADD THIS: Get current user data from auth
  readonly currentUser = computed(() => this.auth.user()?.username ?? 'You');
  readonly currentUserAvatar = computed(() => this.auth.user()?.avatarUrl ?? '');

  async onSubmit() {
    if (this.commentForm.invalid) return;

    this.isSubmitting.set(true);
    try {
      this.submit.emit(this.commentForm.get('content')?.value);
      this.commentForm.reset();
      this.isFocused.set(false);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  cancel() {
    this.commentForm.reset();
    this.isFocused.set(false);
    this.cancelReply.emit();
  }

  handleBlur() {
    if (!this.commentForm.get('content')?.value) {
      this.isFocused.set(false);
    }
  }

  // ✅ REMOVED: formatText() method
}