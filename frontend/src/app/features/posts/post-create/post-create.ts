import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PostService } from '../services/post';
import { CATEGORIES } from '../../../core/constants/categories';

@Component({
  selector: 'app-post-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './post-create.html',
  styleUrls: ['./post-create.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCreate {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly postService = inject(PostService);

  readonly tags = signal(CATEGORIES);
  readonly imagePreview = signal<string | null>(null);
  readonly isDragging = signal(false);
  readonly isSubmitting = signal(false);

  readonly postForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(300)]],
    tag: [''],
    description: ['', [Validators.maxLength(1000)]],
  });

  readonly titleLength = computed(() => this.postForm.get('title')?.value?.length ?? 0);
  readonly descriptionLength = computed(() => this.postForm.get('description')?.value?.length ?? 0);

  isFieldInvalid(field: string) {
    const control = this.postForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.readFile(input.files[0]);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    if (!event.dataTransfer?.files?.length) return;
    this.readFile(event.dataTransfer.files[0]);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
  }

  removeImage(event: Event) {
    event.stopPropagation();
    this.imagePreview.set(null);
  }

  private readFile(file: File) {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Images must be ≤10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => this.imagePreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async onSubmit() {
    if (this.postForm.invalid) {
      Object.keys(this.postForm.controls).forEach((key) => this.postForm.get(key)?.markAsTouched());
      return;
    }

    this.isSubmitting.set(true);
    try {
      const post = await this.postService
        .create({
          title: this.postForm.get('title')?.value,
          description: this.postForm.get('description')?.value || null,
          tag: this.postForm.get('tag')?.value || null,
          imageUrl: this.imagePreview(),
        })
        .toPromise();

      await this.router.navigate(['/post', post?.id ?? '']);
    } catch (error) {
      console.error('Failed to create post', error);
      alert('Failed to create post. Try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}