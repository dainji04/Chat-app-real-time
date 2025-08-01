import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { Router, RouterModule } from '@angular/router';
import { ClickOutside } from '../../click-outside';

@Component({
  selector: 'app-header',
  imports: [FormsModule, CommonModule, RouterModule, ClickOutside],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  search: string = '';
  isSearching: boolean = false;

  isProfile: boolean = false;

  user: any = null;

  toggleSearch() {
    this.isSearching = !this.isSearching;
  }

  toggleProfile() {
    this.isProfile = !this.isProfile;
  }

  constructor(private authService: Auth, private router: Router) {}

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Logout failed:', error);
      },
    });
  }

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    console.log('User data:', this.user.avatar);
  }
}
