import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthIntroComponent } from '../../components/auth-intro/auth-intro';
import { PrimaryButton } from '../../components/primary-button/primary-button';
import { Auth } from '../../services/auth/auth';
import { SocketService } from '../../services/socket/socket-service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PrimaryButton,
    AuthIntroComponent,
  ],
  templateUrl: './signup.html',
  styleUrl: '../auth.scss',
})
export class Signup {
  title: string = 'Sign Up';
  description: string =
    'Create a new account to start chatting with your friends.';
  errorMessage: string = '';
  formData!: FormGroup;
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    // public themeService: ThemeService,
    private authService: Auth,
    private socketService: SocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.formData = this.fb.group({
      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(20),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(20),
        ],
      ],
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(10),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    this.loading = true;
    this.errorMessage = '';
    if (this.formData.valid) {
      this.authService.signup(this.formData.value).subscribe({
        next: (response: any) => {
          this.socketService.connect();
          console.log('Signup successful', response);
          this.router.navigate(['/']);
        },
        error: (error: any) => {
          console.error('Signup failed', error.error.message);
          this.errorMessage =
            error.error.message || 'Signup failed. Please try again.';
          this.loading = false;
        },
      });
    } else {
      console.error('Form is invalid');
      // Mark all fields as touched to show validation messages
      this.formData.markAllAsTouched();
      this.loading = false;
    }
  }
  // get isDarkMode(): boolean {
  //   return this.themeService.isDarkMode();
  // }
}
