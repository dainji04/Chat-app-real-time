import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../services/user';

@Component({
  selector: 'app-settings',
  imports: [FormsModule, CommonModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements OnInit {
  username!: string;
  bio!: string;
  firstName!: string;
  lastName!: string;
  user: any = {};

  isUpdating: boolean = false;

  constructor(private userService: User) {}

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.username = this.user.username || '';
    this.bio = this.user.bio || '';
    this.firstName = this.user.firstName || '';
    this.lastName = this.user.lastName || '';
  }

  update(): void {
    if (!this.isUpdating) {
      this.isUpdating = true;
    } else {
      if (!this.username || !this.firstName || !this.lastName) {
        alert('Please fill in all fields');
        return;
      }
      const updateUser: any = {};
      if (this.username.trim() != this.user.username) {
        updateUser['username'] = this.username.trim();
      }
      if (this.bio.trim() != this.user.bio) {
        updateUser['bio'] = this.bio.trim();
      }
      if (this.firstName.trim() != this.user.firstName) {
        updateUser['firstName'] = this.firstName.trim();
      }
      if (this.lastName.trim() != this.user.lastName) {
        updateUser['lastName'] = this.lastName.trim();
      }
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
          console.error(err);
          alert('An error occurred while updating profile');
          this.isUpdating = false;
        },
      });
    }
  }

  // Add methods to handle settings functionality
  saveSettings(): void {
    // Logic to save user settings
  }

  resetSettings(): void {
    // Logic to reset user settings to default
  }
}
