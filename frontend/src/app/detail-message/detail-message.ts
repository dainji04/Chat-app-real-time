import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Message } from '../services/message';
import { SocketService } from '../services/socket-service';
import { Subscription } from 'rxjs';
import { ClickOutside } from '../directives/click-outside';
import { Home } from '../home/home';

interface formMedia {
  url: string;
  publicId: string;
  type: string;
  size: number;
}

@Component({
  selector: 'app-detail-message',
  imports: [CommonModule, FormsModule, ClickOutside, Home],
  templateUrl: './detail-message.html',
  styleUrl: './detail-message.scss',
})
export class DetailMessage implements OnInit, OnChanges {
  @Input() id: string = '';
  @Output() closeDetail = new EventEmitter<void>();

  // id: string = '';
  messages: any[] = [];
  newMessageText: string = '';
  currentUserId: string = '';

  isShowOptionMedia: boolean = false;
  selectedFile: boolean = false;
  file: File | null = null;

  formMedia: formMedia | null = null;
  isUploading: boolean = false;

  private receiveSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private messageService: Message,
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

    this.loadMessages();

    // Lắng nghe tin nhắn từ server
    this.receiveSub = this.socketService
      .listen<any>('receive_message')
      .subscribe(async (data) => {
        this.messages.push(data.message);
        this.scrollToBottom();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['id']) {
      this.id = changes['id'].currentValue;
      this.loadMessages();
    }
  }

  loadMessages() {
    this.messageService.getConversationById(this.id!).subscribe({
      next: (data) => {
        this.messages = data.data;
      },
      error: (error) => {
        console.error('Error fetching conversation:', error);
      },
    });
  }

  scrollToBottom() {
    const bottomMessages = document.querySelector('#bottom');
    bottomMessages?.scrollIntoView({ behavior: 'smooth' });
  }

  goBack(): void {
    this.closeDetail.emit();
  }

  isOwnMessage(message: any): boolean {
    return message.sender._id === this.currentUserId;
  }

  openImageModal(imageUrl: string): void {
    window.open(imageUrl, '_blank');
  }

  disableSend(): boolean {
    if (
      (this.file?.type.startsWith('image/') ||
        this.file?.type.startsWith('video/') ||
        this.file?.type.startsWith('audio/')) &&
      this.file
    ) {
      return true;
    }
    return false;
  }

  sendMessage(): void {
    if (this.isUploading) {
      alert('file is uploading, wait a seconds.');
      return;
    }
    if (!this.newMessageText.trim()) return;

    const messageData: any = {
      conversationId: this.id,
      content: this.newMessageText,
    };

    if (this.formMedia) {
      messageData.media = this.formMedia;
      messageData.type = this.formMedia.type;
      console.log(messageData);
    }

    this.socketService.sendMessage(messageData);
    this.newMessageText = '';
    this.formMedia = null;
    this.file = null;
  }

  onFileSelected($event: any, type: string): void {
    this.selectedFile = true;
    this.file = $event.target.files[0];
    console.log(this.file);
    if (this.file) {
      this.upload();
    }
  }

  upload() {
    this.isUploading = true;
    if (!this.file) {
      this.isUploading = false;
      return;
    }

    if (this.formMedia) {
      this.deleteOldImage();
    }

    const formData = new FormData();
    formData.append('file', this.file);
    this.messageService.uploadMedia(formData).subscribe({
      next: (res: any) => {
        this.formMedia = res.data.media;
        console.log('upload successfully');
        this.isUploading = false;
      },
      error: (err: any) => {
        if (err.status == 500) alert('file is large');
        else alert(err.error.message);
        console.log('err messages: ', err);
        this.isUploading = false;
      },
    });
  }

  deleteOldImage() {
    if (this.formMedia) {
      console.log('delete');
      console.log(this.formMedia);
      this.messageService.deleteMedia(this.formMedia.publicId).subscribe({
        next: (res) => {
          console.log('delete successfully');
          this.formMedia = null;
        },
        error: (err) => {
          alert('delete old images is failed');
          console.log('err: ', err);
        },
      });
    }
  }

  ngOnDestroy() {
    this.socketService.leaveConversation(this.id);
    this.receiveSub?.unsubscribe();
    this.deleteOldImage();
    this.formMedia = null;
    this.file = null;
    console.log('clean all from detail messages');
  }
}
