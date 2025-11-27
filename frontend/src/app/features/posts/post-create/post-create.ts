import { Component, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-post-create',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './post-create.html',
  styleUrl: './post-create.css'
})
export class PostCreate {
  postForm: FormGroup;
  imagePreview = signal<string | null>(null);
  selectedFile = signal<File | null>(null);
  isDragging = signal(false);
  isSubmitting = signal(false);
  
  tags = signal([
    'Funny', 'Gaming', 'Programming', 'Dank', 'Wholesome',
    'Tech', 'Science', 'Politics', 'Sports', 'Music'
  ]);
  
  titleLength = computed(() => this.postForm?.get('title')?.value?.length || 0);
  descriptionLength = computed(() => this.postForm?.get('description')?.value?.length || 0);
  
  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.postForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(300)]],
      tag: [''],
      description: ['', [Validators.maxLength(1000)]]
    });
  }
  
  isFieldInvalid(fieldName: string): boolean {
    const field = this.postForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
  
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.handleFile(input.files[0]);
    }
  }
  
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }
  
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }
  
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
  }
  
  handleFile(file: File) {
    if (file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024) {
      this.selectedFile.set(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select an image file under 10MB');
    }
  }
  
  removeImage(event: Event) {
    event.stopPropagation();
    this.imagePreview.set(null);
    this.selectedFile.set(null);
  }
  
  async onSubmit() {
    if (this.postForm.invalid) {
      Object.keys(this.postForm.controls).forEach(key => {
        this.postForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    this.isSubmitting.set(true);
    
    try {
      const formData = new FormData();
      formData.append('title', this.postForm.get('title')?.value);
      formData.append('tag', this.postForm.get('tag')?.value || '');
      formData.append('description', this.postForm.get('description')?.value || '');
      
      if (this.selectedFile()) {
        formData.append('image', this.selectedFile()!);
      }
      
      // TODO: Submit to API
      console.log('Submitting post:', this.postForm.value);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      this.router.navigate(['/feed']);
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}