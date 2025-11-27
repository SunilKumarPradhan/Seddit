import { Component, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {
  signupForm: FormGroup;
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  
  passwordStrength = computed(() => {
    const password = this.signupForm?.get('password')?.value || '';
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;
    
    return Math.min(100, strength);
  });
  
  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      agreeToTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }
  
  passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password?.value !== confirmPassword?.value) {
      confirmPassword?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }
  
  togglePassword() {
    this.showPassword.update(v => !v);
  }
  
  isFieldInvalid(fieldName: string): boolean {
    const field = this.signupForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
  
  getPasswordStrengthText(): string {
    const strength = this.passwordStrength();
    if (strength <= 33) return 'Weak';
    if (strength <= 66) return 'Medium';
    return 'Strong';
  }
  
  async onSubmit() {
    if (this.signupForm.invalid) {
      Object.keys(this.signupForm.controls).forEach(key => {
        this.signupForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // TODO: Implement actual signup logic
      console.log('Signup data:', this.signupForm.value);
      
      this.router.navigate(['/feed']);
    } catch (error) {
      this.errorMessage.set('Failed to create account. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  async signupWithGoogle() {
    this.isLoading.set(true);
    try {
      // TODO: Implement Firebase Google auth
      console.log('Signup with Google');
    } catch (error) {
      this.errorMessage.set('Google signup failed');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  async signupWithGithub() {
    this.isLoading.set(true);
    try {
      // TODO: Implement Firebase GitHub auth
      console.log('Signup with GitHub');
    } catch (error) {
      this.errorMessage.set('GitHub signup failed');
    } finally {
      this.isLoading.set(false);
    }
  }
}