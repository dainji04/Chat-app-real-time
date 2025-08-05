import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Message } from '../services/message';

@Component({
  selector: 'app-detail-message',
  imports: [CommonModule, FormsModule],
  templateUrl: './detail-message.html',
  styleUrl: './detail-message.scss',
})
export class DetailMessage implements OnInit {
  id: string | null = null;
  messages: any[] = [];
  newMessageText: string = '';
  currentUserId: string = '';

  constructor(
    private route: ActivatedRoute,
    private messageService: Message,
    private router: Router
  ) {
    // Get current user ID from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.currentUserId = user._id || '';
  }

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');

    this.messageService.getConversationById(this.id!).subscribe({
      next: (data) => {
        this.messages = data.data;
        console.log('Conversation messages:', this.messages);
      },
      error: (error) => {
        console.error('Error fetching conversation:', error);
      },
    });
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
    // Open image in a modal or new tab
    window.open(imageUrl, '_blank');
  }

  sendMessage(): void {
    if (!this.newMessageText.trim()) return;

    const messageData = {
      conversationId: this.id,
      content: this.newMessageText,
    };

    this.messageService.sendMessage(messageData).subscribe({
      next: (response: any) => {
        console.log('Message sent:', response);
        // Add the new message to the messages array
        this.messages.push(response.data);
        this.newMessageText = '';
      },
      error: (error: any) => {
        console.error('Error sending message:', error);
      },
    });
  }
}
