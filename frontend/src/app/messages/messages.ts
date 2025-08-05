import { Component, OnInit } from '@angular/core';
import { Message } from '../services/message';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-messages',
  imports: [CommonModule],
  templateUrl: './messages.html',
  styleUrl: './messages.scss',
})
export class Messages implements OnInit {
  messages: any[] = [];

  constructor(private messageService: Message) {}

  ngOnInit(): void {
    this.fetchMessages();
  }

  fetchMessages() {
    this.messageService.getAllConversations().subscribe((data: any) => {
      this.messages = data.data;
      console.log(this.messages);
    });
  }
}
