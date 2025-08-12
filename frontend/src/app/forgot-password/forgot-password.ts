import { Component } from '@angular/core';
import { Auth } from '../services/auth/auth';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  email: string = '';
  isSendingEmail: boolean = false;

  constructor(private authService: Auth) {}

  forgotPassword(): void {
    const email = this.email;
    if (!email) {
      alert('Email is required to reset password');
      return;
    }

    this.isSendingEmail = true;
    this.authService.forgotPassword(email).subscribe({
      next: (res) => {
        alert('Reset password link sent to your email');
        this.isSendingEmail = false;
      },
      error: (err) => {
        console.error(
          'An error occurred while sending reset password link',
          err
        );
        alert(
          err.error.message ||
            'An error occurred while sending reset password link'
        );
        this.isSendingEmail = false;
      },
    });
  }
}
