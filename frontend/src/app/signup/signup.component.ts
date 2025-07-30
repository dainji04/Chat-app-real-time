import { Component } from '@angular/core';
import { AuthIntroComponent } from '../components/auth-intro/auth-intro.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [AuthIntroComponent],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  title: string = 'Sign Up';
  description: string =
    'Create a new account to start chatting with your friends.';
}
