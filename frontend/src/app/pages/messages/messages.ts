import { Component, OnInit, ViewChild, OnDestroy, ElementRef, AfterViewInit } from '@angular/core';
import { Message } from '../../services/messages/message';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { DetailMessage } from '../detail-message/detail-message';
import { ClickOutside } from '../../directives/clickOutSide/click-outside';
import { FriendService } from '../../services/friends/friends';
import { Groups } from '../../services/groups/groups';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { User } from '../../services/user/user';
import { ToastService } from '../../services/toast/toast';
import { SocketService } from '../../services/socket/socket-service';
import { SearchUser } from "../../components/search-user/search-user";
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { conversation } from '../../model/conversation';
import { lastMessage } from '../../model/lastMessage';

// primeng
import { Skeleton } from 'primeng/skeleton';
import { ContextMenu } from 'primeng/contextmenu'
import { MenuItem } from 'primeng/api';
import { ProgressBar } from 'primeng/progressbar';
import { SpeedDial } from 'primeng/speeddial';
import { Button } from 'primeng/button';
import { Theme } from '../../services/theme/theme';

interface group {
  name: string;
  description: string;
  participantIds: string[];
  avatar?: string;
}

interface receiveMessageData {
  conversationId: string;
  message: lastMessage;
}

@Component({
  selector: 'app-messages',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DetailMessage,
    ClickOutside,
    ReactiveFormsModule,
    SearchUser,
    Skeleton,
    ContextMenu,
    ProgressBar,
    SpeedDial,
    Button
],
  templateUrl: './messages.html',
  styleUrl: './messages.scss',
})
export class Messages implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('detail') detailElement: any;
  @ViewChild('message') messageElement: any;
  @ViewChild('messagesList') messagesList!: ElementRef;
  private receiveSub!: Subscription; // listen receive new messages

  isLoadingConversations: boolean = false;
  
  messages: conversation[] = [];
  selectedMessageId: string = '';
  isDetailOpen: boolean = false;
  detailConversation: any = {};

  // create group chat
  isShowCreateOptions: boolean = false;
  isShowCreateGroupBox: boolean = false;
  listFriends: any[] = [];
  formGroupChat: group = {
    name: '',
    description: 'default desc',
    participantIds: [],
  };
  file!: File;
  isCreatingGroup: boolean = false;
  // search user
  isSearching: boolean = false;
  searchForm: FormGroup = new FormGroup({
    email: new FormControl(''),
  });

  items: MenuItem[] | undefined;
  groupItems!: MenuItem[] | null;
  @ViewChild('cm') cm!: ContextMenu;
  selectedConversation!: conversation | null;

  private beforeUnloadListener?: () => void;

  constructor(
    private messageService: Message,
    private friendServices: FriendService,
    private groupServices: Groups,
    private userServices: User,
    private toastService: ToastService,
    private socketService: SocketService,
    private themeService: Theme,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Scroll to top immediately when component initializes
    this.scrollToTop();
    
    this.fetchMessages();

    // Listen for route navigation events
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (event.url === '/messages') {
        // Scroll to top when navigating to messages route
        setTimeout(() => this.scrollToTop(), 50);
      }
    });

    this.beforeUnloadListener = () => {
      this.cleanup();
    };

    window.addEventListener('beforeunload', this.beforeUnloadListener);

    this.receiveSub = this.socketService
            .listen<any>('receive_message')
            .subscribe(async (data) => {
              this.updateConversationsWhenReceiveMessage(data);
            });

    // context menu primeng
    this.items = [
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => {
          this.deleteConversationById();
        }
      },
      {
        label: 'Hide',
        icon: 'pi pi-user-plus',
        command: () => {
          this.toastService.showInfo(`Hided conversation ${this.selectedConversation?.name}`);
        }
      }
    ];

    this.groupItems = [
      {
        label: 'Create Group',
        icon: 'pi pi-users',
        command: () => {
          this.showCreateGroupBox();
        }
      },
      {
        label: 'Toggle Theme',
        icon: 'pi pi-palette',
        command: () => {
          this.themeService.toggleTheme();
          this.toastService.showSuccess('Theme Changed', 'Theme has been toggled successfully.');
        }
      },
    ];
  }

  ngAfterViewInit(): void {
    // Scroll to top after view is initialized
    this.scrollToTop();
  }

  scrollToTop(): void {
    // Use setTimeout to ensure the DOM is fully rendered
    setTimeout(() => {
      // Scroll the messages list container to top
      if (this.messagesList && this.messagesList.nativeElement) {
        this.messagesList.nativeElement.scrollTop = 0;
        this.messagesList.nativeElement.scrollTo({ top: 0, behavior: 'auto' });
      }
      
      // Scroll the main layout container
      const mainLayout = document.querySelector('.main-layout');
      if (mainLayout) {
        mainLayout.scrollTop = 0;
        mainLayout.scrollTo({ top: 0, behavior: 'auto' });
      }
      
      // Scroll all possible containers
      const containers = document.querySelectorAll('.container, .messages, .messages__list');
      containers.forEach(container => {
        (container as HTMLElement).scrollTop = 0;
        (container as HTMLElement).scrollTo({ top: 0, behavior: 'auto' });
      });
      
      // Scroll the main window to top as fallback
      window.scrollTo({ top: 0, behavior: 'auto' });
      
      // Scroll the document body to top for additional coverage
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 150);
  }

  updateConversationsWhenReceiveMessage(data: receiveMessageData) {
    const convUpdate = this.messages.find((conv) => conv._id === data.conversationId);
    convUpdate!.lastMessage = {
      content: data.message.content,
      createdAt: data.message.createdAt,
      sender: data.message.sender,
      _id: data.message._id
    };

    // Đưa convUpdate lên đầu mảng
    this.messages = [
      convUpdate!,
      ...this.messages.filter((conv) => conv._id !== data.conversationId),
    ];
  }

  setChat(event: { id: string, name: string, avatar: string }) {
    this.selectedMessageId = event.id;
    this.messageService.getConversationById(event.id).subscribe({
      next: (response) => {
        this.detailConversation = response.conversation;
        this.detailConversation.name = event.name;
        this.detailConversation.avatar = event.avatar;
        this.isDetailOpen = true;
        this.enterGroup();
      },
      error: (error) => {
        console.error('Error fetching conversation:', error);
      }
    });
  }

  private cleanup() {
    // Gộp tất cả cleanup logic vào 1 hàm
    document.body.classList.remove('detail-message-open');
    this.leaveGroup();
  }

  fetchMessages() {
    this.isLoadingConversations = true;
    this.messageService.getAllConversations().subscribe({
      next: (res: any) => {
        this.messages = res.data;
        this.isLoadingConversations = false;
        // Scroll to top after messages are loaded
        this.scrollToTop();
      },
      error: () => {
        this.isLoadingConversations = false;
      }
    });
  }

  showCreateOptions() {
    this.isShowCreateOptions = !this.isShowCreateOptions;
  }

  showCreateGroupBox() {
    this.isShowCreateGroupBox = !this.isShowCreateGroupBox;
    if (this.listFriends.length === 0) {
      this.friendServices.getFriends().subscribe({
        next: (res: any) => {
          this.listFriends = res.friends;
        },
      });
    }
  }

  selectMessage(message: any, event: MouseEvent) {
    console.log(event)
    if(event.button !== 0) {
      return;
    }

    if(this.selectedMessageId !== message._id && this.selectedMessageId !== '') {
      this.socketService.leaveConversation(this.selectedMessageId);
    }

    // Navigate to the detail message component with the selected message ID
    this.selectedMessageId = message._id;
    this.detailConversation = message;
    this.isDetailOpen = true;

    this.enterGroup();

    // Add class to prevent body scroll
    document.body.classList.add('detail-message-open');

    // Show detail with animation
    this.detailElement.nativeElement.classList.add('show');
    setTimeout(() => {
      this.messageElement.nativeElement.classList.add('hide');
    }, 100);
  }

  closeDetail() {
    this.isDetailOpen = false;

    // Remove class to restore body scroll
    document.body.classList.remove('detail-message-open');

    // Hide detail with animation
    this.messageElement.nativeElement.classList.remove('hide');
    this.detailElement.nativeElement.classList.remove('show');

    // Clear selected message after animation
    setTimeout(() => {
      this.selectedMessageId = '';
      this.detailConversation = {};
      this.leaveGroup();
    }, 300);
  }

  enterGroup() {
    this.userServices.enterGroup().subscribe({
      next: (res) => {
        console.log('User entered group:', res);
      },
      error: (err) => {
        console.error('Error entering group:', err);
      },
    });
  }

  leaveGroup() {
    this.userServices.leaveGroup().subscribe({
      next: (res) => {
        console.log('User left group:', res);
      },
      error: (err) => {
        console.error('Error leaving group:', err);
      },
    });
  }

  toggleMember(id: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;

    let mem = this.formGroupChat.participantIds;

    if (checked) {
      // Thêm vào nếu chưa có
      if (!mem.includes(id)) {
        mem.push(id);
      }
    } else {
      // Xoá ra
      this.formGroupChat.participantIds = mem.filter(
        (memberId) => memberId !== id
      );
    }
  }

  createGroup() {
    this.isCreatingGroup = true;
    this.groupServices.createGroup(this.formGroupChat).subscribe({
      next: async (res: any) => {
        if (this.file) {
          await this.onUpload(res.data.group._id);
        }
        this.isCreatingGroup = false;
        this.isShowCreateGroupBox = false;
        this.fetchMessages();
        this.toastService.showSuccess('Create Group', 'Group has been created successfully.');
      },
      error: (err: HttpErrorResponse) => {
        this.toastService.showError('Create Group', err.error.message);
        this.isCreatingGroup = false;
      },
    });
  }

  onFileSelected($event: any): void {
    this.file = $event.target.files[0];
  }

  onUpload(groupId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.groupServices.uploadGroupAvatar(groupId, this.file).subscribe({
        next: (res) => {
          this.toastService.showSuccess('Upload Avatar Group', 'Avatar group has been uploaded successfully.');
          resolve();
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }

  // primeng: context menu
  onContextMenu(event: Event, conversation: any) {
    this.selectedConversation = conversation;
    this.cm.show(event);
  }

  onHide() {
    this.selectedConversation = null;
  }

  deleteConversationById() {
    if(this.selectedConversation?._id) {
      this.messageService.softDeleteConversation(this.selectedConversation?._id).subscribe({
        next: (res) => {
          this.messages = this.messages.filter(conv => {
            return conv._id !== this.selectedConversation?._id;
          });
          this.selectedMessageId = '';
          this.toastService.showSuccess('delete conversation successfully');
        },
        error: () => {
          this.toastService.showError('deleted is failed');
        }
      })
    }
  }

  ngOnDestroy() {
    // Clean up body class when component is destroyed
    this.cleanup();

    // Remove event listener để tránh memory leak
    if (this.beforeUnloadListener) {
      window.removeEventListener('beforeunload', this.beforeUnloadListener);
    }
  }
}
