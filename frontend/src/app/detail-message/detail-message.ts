import { AfterViewChecked, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Message } from '../services/message';
import { SocketService } from '../services/socket-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-detail-message',
  imports: [CommonModule, FormsModule],
  templateUrl: './detail-message.html',
  styleUrl: './detail-message.scss',
})
export class DetailMessage implements OnInit, AfterViewChecked {
  id: string = '';
  messages: any[] = [];
  newMessageText: string = '';
  currentUserId: string = '';

  private receiveSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private messageService: Message,
    private router: Router,
    private socketService: SocketService
  ) {
    // Get current user ID from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.currentUserId = user._id || '';

    window.addEventListener('beforeunload', () => {
      this.socketService.leaveConversation(this.id);
      this.receiveSub?.unsubscribe();
      console.log('Left conversation and unsubscribed from messages');
    });
  }

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') || '';

    this.socketService.joinConversation(this.id!);

    this.messageService.getConversationById(this.id!).subscribe({
      next: (data) => {
        this.messages = data.data;
      },
      error: (error) => {
        console.error('Error fetching conversation:', error);
      },
    });

    // Lắng nghe tin nhắn từ server
    this.receiveSub = this.socketService
      .listen<any>('receive_message')
      .subscribe(async (data) => {
        this.messages.push(data.message);
        this.scrollToBottom();
      });
  }

  ngAfterViewChecked(): void {
    console.log('call from ngAfterViewChecked');
    this.scrollToBottom();
  }

  scrollToBottom() {
    const bottomMessages = document.querySelector('#bottom');
    bottomMessages?.scrollIntoView({ behavior: 'smooth' });
  }

  goBack(): void {
    this.router.navigate(['/messages']);
  }

  isOwnMessage(message: any): boolean {
    return message.sender._id === this.currentUserId;
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  openImageModal(imageUrl: string): void {
    window.open(imageUrl, '_blank');
  }

  sendMessage(): void {
    if (!this.newMessageText.trim()) return;

    const messageData = {
      conversationId: this.id,
      content: this.newMessageText,
    };

    this.socketService.sendMessage(messageData);
    this.newMessageText = '';
  }

  ngOnDestroy() {
    this.socketService.leaveConversation(this.id);
    this.receiveSub?.unsubscribe();
    console.log('Left conversation and unsubscribed from messages');
  }
}
