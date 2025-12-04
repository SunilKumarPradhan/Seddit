import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Signup {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);

  readonly showPassword = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  readonly signupForm: FormGroup = this.fb.group(
    {
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      agreeToTerms: [false, [Validators.requiredTrue]],
    },
    { validators: this.passwordMatchValidator },
  );

  readonly passwordStrength = computed(() => {
    const password = this.signupForm.get('password')?.value || '';
    if (!password) return 0;

    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;
    return Math.min(100, strength);
  });

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
    this.showPassword.update((value) => !value);
  }

  isFieldInvalid(field: string) {
    const control = this.signupForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getPasswordStrengthText() {
    const strength = this.passwordStrength();
    if (strength <= 33) return 'Weak';
    if (strength <= 66) return 'Medium';
    return 'Strong';
  }

  async onSubmit() {
    if (this.signupForm.invalid) {
      Object.keys(this.signupForm.controls).forEach((key) => this.signupForm.get(key)?.markAsTouched());
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.auth.signupWithEmail(
        this.signupForm.get('username')?.value,
        this.signupForm.get('email')?.value,
        this.signupForm.get('password')?.value,
      );
    } catch (error) {
      console.error('Signup failed', error);
      this.errorMessage.set('Failed to create account. Check Firebase configuration.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async signupWithGoogle() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      await this.auth.loginWithGoogle();
    } catch (error) {
      console.error('Google signup failed', error);
      this.errorMessage.set('Google signup failed.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async signupWithGithub() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      await this.auth.loginWithGithub();
    } catch (error) {
      console.error('GitHub signup failed', error);
      this.errorMessage.set('GitHub signup failed.');
    } finally {
      this.isLoading.set(false);
    }
  }
}