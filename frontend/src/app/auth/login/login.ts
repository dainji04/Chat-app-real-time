import { Component } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '../../services/auth';
import { PrimaryButton } from '../../components/primary-button/primary-button';
import { AuthIntroComponent } from '../../components/auth-intro/auth-intro';

@Component({
    selector: 'app-login',
    imports: [
        PrimaryButton,
        AuthIntroComponent,
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
    ],
    templateUrl: './login.html',
    styleUrls: ['../auth.scss'],
})
export class Login {
    title: string = 'Login';
    description: string =
        'Log in to your account to start chatting with your friends.';
    errorMessage: string = '';
    formData!: FormGroup;

    constructor(
        private fb: FormBuilder,
        // public themeService: ThemeService,
        private authService: Auth,
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
        if (this.formData.valid) {
            console.log('Form Data:', this.formData.value);
            const { username, password } = this.formData.value;
            this.authService.login(username, password).subscribe({
                next: (response: any) => {
                    console.log('Login successful', response);
                    this.router.navigate(['/']);
                },
                error: (error: any) => {
                    console.error('Signup failed', error.error.message);
                    this.errorMessage =
                        error.error.message ||
                        'Signup failed. Please try again.';
                },
            });
        } else {
            console.error('Form is invalid');
            // Mark all fields as touched to show validation messages
            this.formData.markAllAsTouched();
        }
    }
}
