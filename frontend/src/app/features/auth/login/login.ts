import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);

  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  readonly showPassword = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  togglePassword() {
    this.showPassword.update((value) => !value);
  }

  isFieldInvalid(field: string) {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach((key) => this.loginForm.get(key)?.markAsTouched());
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.auth.loginWithEmail(
        this.loginForm.get('email')?.value,
        this.loginForm.get('password')?.value,
      );
    } catch (error) {
      console.error('Login failed', error);
      this.errorMessage.set('Invalid credentials or Firebase not configured.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loginWithGoogle() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      await this.auth.loginWithGoogle();
    } catch (error) {
      console.error('Google login failed', error);
      this.errorMessage.set('Google login failed.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loginWithGithub() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      await this.auth.loginWithGithub();
    } catch (error) {
      console.error('GitHub login failed', error);
      this.errorMessage.set('GitHub login failed.');
    } finally {
      this.isLoading.set(false);
    }
  }
}