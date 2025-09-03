import { Component, OnInit } from '@angular/core';
import {
  FormsModule,
  FormControl,
  ReactiveFormsModule,
  FormGroup,
} from '@angular/forms';
import { Auth } from '../../services/auth/auth';
import { Router, RouterModule } from '@angular/router';
import { ClickOutside } from '../../directives/clickOutSide/click-outside';
import { debounceTime } from 'rxjs';
import { User } from '../../services/user/user';
import { SocketService } from '../../services/socket/socket-service';
import { FriendService } from '../../services/friends/friends';
import { Message } from '../../services/messages/message';
import { ToastService } from '../../services/toast/toast';
import { SearchUser } from "../search-user/search-user";

@Component({
  selector: 'app-header',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    ClickOutside,
    SearchUser
],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  isProfile: boolean = false;
  isProfileDesktop: boolean = false; // var save status profile desktop

  user: any = null;

  toggleProfile() {
    this.isProfile = !this.isProfile;
  }

  constructor(
    private authService: Auth,
    private socketService: SocketService,
    private router: Router,
    private toastService: ToastService
  ) {}
  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  logout() {
    // Force disconnect và clear socket hoàn toàn
    this.socketService.forceDisconnect();
    this.authService.logout().subscribe({
      next: () => {
        this.toastService.showSuccess('Logout successful', 'You have been logged out.');
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Logout failed:', error);
      },
    });
  }
}
