import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup;
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  
  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }
  
  togglePassword() {
    this.showPassword.update(v => !v);
  }
  
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
  
  async onSubmit() {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // TODO: Implement actual login logic
      console.log('Login data:', this.loginForm.value);
      
      this.router.navigate(['/feed']);
    } catch (error) {
      this.errorMessage.set('Invalid email or password');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  async loginWithGoogle() {
    this.isLoading.set(true);
    try {
      // TODO: Implement Firebase Google auth
      console.log('Login with Google');
    } catch (error) {
      this.errorMessage.set('Google login failed');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  async loginWithGithub() {
    this.isLoading.set(true);
    try {
      // TODO: Implement Firebase GitHub auth
      console.log('Login with GitHub');
    } catch (error) {
      this.errorMessage.set('GitHub login failed');
    } finally {
      this.isLoading.set(false);
    }
  }
}