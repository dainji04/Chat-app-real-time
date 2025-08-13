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

@Component({
  selector: 'app-header',
  imports: [
    ReactiveFormsModule,
    FormsModule,
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
  isProfileDesktop: boolean = false;

  user: any = null;

  resultUser: any = null;

  // button state
  isChat: boolean = false;

  toggleSearch() {
    this.isSearching = !this.isSearching;
  }

  toggleProfile() {
    this.isProfile = !this.isProfile;
  }

  constructor(
    private authService: Auth,
    private userService: User,
    private socketService: SocketService,
    private router: Router,
    private friendService: FriendService,
    private messageService: Message
  ) {}
  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || 'null');

    this.searchForm
      .get('email')!
      .valueChanges.pipe(debounceTime(500)) // chờ 500ms sau khi ngừng gõ
      .subscribe(() => {
        this.onSearchInput();
      });
  }

  onSearchInput() {
    this.resultUser = null;
    this.userService.searchByEmail(this.searchForm.value.email).subscribe({
      next: (response) => {
        this.resultUser = response.user;
        console.log(this.resultUser);
      },
      error: (error) => {
        console.error('Search failed:', error);
        if (error.status === 404) {
          console.log('User not found');
        }
      },
    });
  }

  isOwnProfile() {
    return (
      this.user && this.resultUser && this.user._id === this.resultUser._id
    );
  }

  isFriend() {
    if (!this.user || !this.resultUser || !this.user.friends) {
      return false;
    }

    let isFriend = false;

    for (let friend of this.user.friends) {
      if (friend._id === this.resultUser._id) {
        isFriend = true;
      }
    }

    return isFriend;
  }

  logout() {
    // Force disconnect và clear socket hoàn toàn
    this.socketService.forceDisconnect();
    this.authService.logout().subscribe({
      next: () => {
        localStorage.removeItem('user');
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Logout failed:', error);
      },
    });
  }

  addFriend() {
    this.friendService.addFriend(this.resultUser._id).subscribe({
      next: (response) => {
        console.log('Friend added successfully:', response);
      },
      error: (error) => {
        console.error('Error adding friend:', error);
      },
    });
  }

  getOrCreateConversation() {
    this.messageService.getOrCreateConversation(this.resultUser._id).subscribe({
      next: (response: any) => {
        this.router.navigate(['/messages', response.data.conversation._id]);
      },
      error: (error: any) => {
        alert('chat failed');
        console.error('Error getting or creating conversation:', error);
      },
    });
  }
}
