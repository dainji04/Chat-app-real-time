import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../services/auth/auth';
import { PrimaryButton } from '../../components/primary-button/primary-button';
import { AuthIntroComponent } from '../../components/auth-intro/auth-intro';
import { SocketService } from '../../services/socket/socket-service';
import {ShowErrorValidate} from '../../components/show-error-validate/show-error-validate';

@Component({
  selector: 'app-login',
    imports: [
        PrimaryButton,
        AuthIntroComponent,
        ReactiveFormsModule,
        RouterModule,
        ShowErrorValidate,
    ],
  templateUrl: './login.html',
  styleUrls: ['../auth.scss'],
})
export class Login {
  title: string = 'Login';
  description: string =
    'Login to your account to start chatting with your friends.';
  errorMessage: string = '';
  formData!: FormGroup;
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private socketService: SocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.formData = this.fb.group({
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(10),
        ],
      ],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    this.loading = true;
    this.errorMessage = '';
    if (this.formData.valid) {
      const { username, password } = this.formData.value;
      this.authService.login(username, password).subscribe({
        next: (response: any) => {
          // Reconnect socket với token mới
          this.socketService.reconnectWithNewToken();
          console.log('Login successful', response);
          this.loading = false;
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
}
