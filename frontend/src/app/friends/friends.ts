import { Component, OnInit } from '@angular/core';
import { FriendService } from '../services/friends';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Message } from '../services/message';
import { Router, RouterModule } from '@angular/router';
import { ClickOutside } from '../directives/click-outside';

@Component({
  selector: 'app-friends',
  imports: [CommonModule, ReactiveFormsModule, ClickOutside, RouterModule],
  templateUrl: './friends.html',
  styleUrl: './friends.scss',
})
export class Friends implements OnInit {
  listFriends: any[] | null = null;
  formFilterAndSearch = new FormGroup({
    searchTerms: new FormControl(''),
  });
  typeOfList: string = 'all'; // 'all', 'requests', 'recommendations'
  isUserShowOptions: string | null = null;

  constructor(
    private friendService: FriendService,
    private messageService: Message,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getAll();

    this.formFilterAndSearch
      .get('searchTerms')!
      .valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.search();
      });
  }

  showOptions(userId: string) {
    this.isUserShowOptions = this.isUserShowOptions === userId ? null : userId;
    console.log(`isUserShowOptions: ${this.isUserShowOptions}`);
  }

  closeOptions() {
    console.log('called');
    this.isUserShowOptions = null;
  }

  search(): void {
    const term =
      this.formFilterAndSearch.get('searchTerms')?.value?.trim() || '';
    if (term == '') {
      this.friendService.getFriends().subscribe((data: any) => {
        this.listFriends = data.friends;
        this.typeOfList = 'all';
      });
    } else {
      this.listFriends =
        this.listFriends?.filter((friend) =>
          friend.username.toLowerCase().includes(term.toLowerCase())
        ) || [];
      this.typeOfList = 'search'; // Reset type of list to 'all' when searching
    }
  }

  getAll(): void {
    this.friendService.getFriends().subscribe((data: any) => {
      this.listFriends = data.friends;
      this.typeOfList = 'all';
      this.isUserShowOptions = null;
    });
  }

  getFriendRequests(): void {
    this.friendService.getFriendRequests().subscribe((data: any) => {
      this.listFriends = data.friendRequests;
      this.typeOfList = 'requests';
      this.isUserShowOptions = null; // Hide options when switching lists
    });
  }

  getFriendRecommendations(): void {
    this.listFriends = [];
    this.typeOfList = 'recommendations';
    this.isUserShowOptions = null;
  }

  getOrCreateConversation(friendId: string): void {
    this.messageService.getOrCreateConversation(friendId).subscribe({
      next: (response: any) => {
        this.router.navigate(['/messages', response.data.conversation._id]);
      },
      error: (error: any) => {
        alert('chat failed');
        console.error('Error getting or creating conversation:', error);
      },
    });
  }

  acceptRequest(friendId: string): void {
    this.friendService.acceptFriendRequest(friendId).subscribe({
      next: (response: any) => {
        alert('Friend request accepted');
        this.getFriendRequests(); // Refresh the list after accepting the request
      },
      error: (error: any) => {
        alert('Failed to accept friend request');
        console.error('Error accepting friend request:', error);
      },
    });
  }

  unFriend(friendId: string): void {
    this.friendService.unFriend(friendId).subscribe({
      next: (response: any) => {
        alert('Unfriended successfully');
        this.getAll(); // Refresh the list after unfriending
      },
      error: (error: any) => {
        alert('Failed to unfriend');
        console.error('Error unfriending:', error);
      },
    });
  }
}
