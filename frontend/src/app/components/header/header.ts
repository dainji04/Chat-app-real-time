import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import {
  FormsModule,
  FormControl,
  ReactiveFormsModule,
  FormGroup,
} from '@angular/forms';
import { Auth } from '../../services/auth';
import { Router, RouterModule } from '@angular/router';
import { ClickOutside } from '../../directives/click-outside';
import { debounceTime } from 'rxjs';
import { User } from '../../services/user';

@Component({
  selector: 'app-header',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    RouterModule,
    ClickOutside,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  searchForm: FormGroup = new FormGroup({
    email: new FormControl(''),
  });
  isSearching: boolean = false;

  isProfile: boolean = false;

  user: any = null;

  resultUser: any = {};

  toggleSearch() {
    this.isSearching = !this.isSearching;
  }

  toggleProfile() {
    this.isProfile = !this.isProfile;
  }

  constructor(
    private authService: Auth,
    private userService: User,
    private router: Router
  ) {}

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

    this.searchForm
      .get('email')!
      .valueChanges.pipe(debounceTime(1000)) // chờ 1s sau khi ngừng gõ
      .subscribe(() => {
        this.onSearchInput();
      });
  }

  onSearchInput() {
    this.userService.searchByEmail(this.searchForm.value.email).subscribe({
      next: (response) => {
        this.resultUser = response.user;
        console.log(this.resultUser);
      },
      error: (error) => {
        console.error('Search failed:', error);
      },
    });
  }
}
