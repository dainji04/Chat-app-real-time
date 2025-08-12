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
  listFriendsBackup: any[] | null = null; // save the old list friend before searching (filter)
  listFriends: any[] | null = null;
  formFilterAndSearch = new FormGroup({
    searchTerms: new FormControl(''),
  });
  typeOfList: string = 'all'; // 'all', 'requests', 'recommendations'
  isUserShowOptions: string | null = null;
  isSearching: boolean = false;

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
      this.listFriends = this.listFriendsBackup; // restore the old list
      this.isSearching = false; // turn off searching: not found,...
    } else {
      this.listFriendsBackup = this.listFriends; // save the old list before searching
      this.listFriends =
        this.listFriends?.filter((friend) =>
          friend.username.toLowerCase().includes(term.toLowerCase())
        ) || [];
      this.isSearching = true; // Reset type of list to 'all' when searching
    }
  }

  resetListFriend() {
    this.listFriendsBackup = null; // Reset backup list when fetching all friends
    this.listFriends = null; // Reset current list
    this.isUserShowOptions = null; // turn off show option in get all friends

  }

  getAll(): void {
    this.resetListFriend();
    this.friendService.getFriends().subscribe((data: any) => {
      this.listFriends = data.friends;
      this.typeOfList = 'all';
    });
  }

  getFriendRequests(): void {
    this.resetListFriend();
    this.friendService.getFriendRequests().subscribe((data: any) => {
      this.listFriends = data.friendRequests;
      this.typeOfList = 'requests';
    });
  }

  getFriendRecommendations(): void {
    this.resetListFriend();
    this.typeOfList = 'recommendations';
    this.listFriends = []
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
