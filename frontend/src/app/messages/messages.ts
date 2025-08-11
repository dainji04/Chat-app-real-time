import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Message } from '../services/message';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DetailMessage } from '../detail-message/detail-message';

@Component({
  selector: 'app-messages',
  imports: [CommonModule, RouterModule, DetailMessage],
  templateUrl: './messages.html',
  styleUrl: './messages.scss',
})
export class Messages implements OnInit, OnDestroy {
  @ViewChild('detail') detailElement: any;
  messages: any[] = [];
  selectedMessageId: string = '';
  isDetailOpen: boolean = false;

  constructor(private messageService: Message) {}

  ngOnInit(): void {
    this.fetchMessages();
  }

  fetchMessages() {
    this.messageService.getAllConversations().subscribe((data: any) => {
      this.messages = data.data;
    });
  }

  selectMessage(messageId: string) {
    // Navigate to the detail message component with the selected message ID
    this.selectedMessageId = messageId;
    this.isDetailOpen = true;

    // Add class to prevent body scroll
    document.body.classList.add('detail-message-open');

    // Show detail with animation
    this.detailElement.nativeElement.classList.add('show');
  }

  closeDetail() {
    this.isDetailOpen = false;

    // Remove class to restore body scroll
    document.body.classList.remove('detail-message-open');

    // Hide detail with animation
    this.detailElement.nativeElement.classList.remove('show');

    // Clear selected message after animation
    setTimeout(() => {
      this.selectedMessageId = '';
    }, 300);
  }

  ngOnDestroy() {
    // Clean up body class when component is destroyed
    document.body.classList.remove('detail-message-open');
  }
}
