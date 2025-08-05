import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { User } from '../services/user';
import { Auth } from '../services/auth';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements OnInit {
  user: any = {};
  formData!: FormGroup;
  errorInfo!: string;
  errorAvatar!: string;
  errorConfirmPassword!: boolean;
  isSendingEmail: boolean = false;

  selectedFile: boolean = false;
  uploading: boolean = false;
  file!: File;

  formChangePassword!: FormGroup;

  constructor(
    private userService: User,
    private authService: Auth,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');

    this.formData = this.fb.group({
      username: [
        this.user.username || '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(10),
        ],
      ],
      firstName: [
        this.user.firstName || '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(20),
        ],
      ],
      lastName: [
        this.user.lastName || '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(20),
        ],
      ],
      bio: [this.user.bio || '', [Validators.maxLength(200)]],
      phone: [
        this.user.phone || '',
        [Validators.required, Validators.pattern(/^\d{9,11}$/)],
      ],
      dateOfBirth: [
        this.user.dateOfBirth
          ? new Date(this.user.dateOfBirth).toISOString().split('T')[0]
          : '',
        [Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)],
      ],
    });

    this.formChangePassword = this.fb.group({
      oldPassword: ['', [Validators.required, Validators.minLength(8)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.formChangePassword
      .get('confirmPassword')!
      .valueChanges.pipe(debounceTime(1000)) // chờ 1s sau khi ngừng gõ
      .subscribe(() => {
        this.checkPasswordMatch();
      });
  }

  onFileSelected($event: any): void {
    this.selectedFile = true;
    this.file = $event.target.files[0];
    if (this.file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.user.avatar = e.target.result;
      };
      reader.readAsDataURL(this.file);
    }
  }

  onUpload(): void {
    this.uploading = true;
    this.userService.uploadAvatar(this.file).subscribe({
      next: (res) => {
        alert('Profile updated successfully');
        this.user.avatar = res.avatarUrl;
        localStorage.setItem('user', JSON.stringify(this.user));
        this.selectedFile = false;
        this.uploading = false;
      },
      error: (err) => {
        console.error('An error occurred while updating profile', err);
        this.errorAvatar =
          err.error.message || 'An error occurred while updating profile';
        this.selectedFile = false;
        this.uploading = false;
      },
    });
  }

  onSubmit(): void {
    if (this.formData.invalid) {
      alert('Please fill in all required fields correctly');
      return;
    }

    const updateUser: any = {};
    const formValues = this.formData.value;

    if (formValues.username !== this.user.username) {
      updateUser['username'] = formValues.username;
    }
    if (formValues.firstName !== this.user.firstName) {
      updateUser['firstName'] = formValues.firstName;
    }
    if (formValues.lastName !== this.user.lastName) {
      updateUser['lastName'] = formValues.lastName;
    }
    if (formValues.bio !== this.user.bio) {
      updateUser['bio'] = formValues.bio;
    }
    if (formValues.phone !== this.user.phone) {
      updateUser['phone'] = formValues.phone;
    }
    if (formValues.dateOfBirth !== this.user.dateOfBirth) {
      updateUser['dateOfBirth'] = formValues.dateOfBirth;
    }
    console.log('Update User Data:', updateUser);
    if (Object.keys(updateUser).length === 0) {
      alert('No changes made');
      return;
    }

    // call api update
    this.userService.updateProfile(updateUser).subscribe({
      next: (res) => {
        alert('Profile updated successfully');
        this.user = { ...this.user, ...updateUser };
        localStorage.setItem('user', JSON.stringify(this.user));
      },
      error: (err) => {
        console.error('An error occurred while updating profile', err);
        this.errorInfo =
          err.error.message || 'An error occurred while updating profile';
      },
    });
  }

  onChangePassword(): void {
    if (this.formChangePassword.invalid) {
      alert('Please fill in all required fields correctly');
      return;
    }

    const formValues = this.formChangePassword.value;

    if (formValues.newPassword !== formValues.confirmPassword) {
      alert('New password and confirm password do not match');
      return;
    }

    this.authService
      .changePassword(formValues.oldPassword, formValues.newPassword)
      .subscribe({
        next: (res) => {
          alert('Password changed successfully');
        },
        error: (err) => {
          console.error('An error occurred while changing password', err);
          alert(
            err.error.message || 'An error occurred while changing password'
          );
        },
      });
  }

  checkPasswordMatch(): void {
    const formValues = this.formChangePassword.value;
    this.errorConfirmPassword =
      formValues.newPassword !== formValues.confirmPassword;
  }

  forgotPassword(): void {
    const email = this.user.email;
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

  scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
