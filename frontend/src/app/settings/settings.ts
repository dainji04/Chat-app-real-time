import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { User } from '../services/user';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, CommonModule, DatePipe],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements OnInit {
  user: any = {};
  formData!: FormGroup;

  isUpdating: boolean = false;

  error!: string;

  formattedDateOfBirth: string = '';

  constructor(private userService: User, private fb: FormBuilder) {}

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
        new Date(this.user.dateOfBirth).toISOString().split('T')[0] || '',
        [Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)],
      ],
    });
  }

  onSubmit(): void {
    if (this.formData.invalid) {
      alert('Please fill in all required fields correctly');
      this.isUpdating = false;
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
      this.isUpdating = false;
      return;
    }

    // call api update
    this.userService.updateProfile(updateUser).subscribe({
      next: (res) => {
        alert('Profile updated successfully');
        this.user = { ...this.user, ...updateUser };
        localStorage.setItem('user', JSON.stringify(this.user));
        this.isUpdating = false;
      },
      error: (err) => {
        console.error('An error occurred while updating profile', err);
        this.error =
          err.error.message || 'An error occurred while updating profile';
        this.isUpdating = false;
      },
    });
  }
  // Add methods to handle settings functionality
  saveSettings(): void {
    // Logic to save user settings
  }

  resetSettings(): void {
    // Logic to reset user settings to default
  }
}
