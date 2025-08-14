import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Message } from '../services/messages/message';
import { SocketService } from '../services/socket/socket-service';
import { Subscription } from 'rxjs';
import { ClickOutside } from '../directives/clickOutSide/click-outside';
import { Home } from '../home/home';
import { Groups } from '../services/groups/groups';

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
    @Input() conversation: any = {};
    @Output() closeDetail = new EventEmitter<void>();
    @Output() loadGroupEvent = new EventEmitter<void>(); // load when delete or leave

    // id: string = '';
    messages: any[] = [];
    newMessageText: string = '';
    currentUserId: string = '';

    isShowOptionMedia: boolean = false;
    selectedFile: boolean = false;
    file: File | null = null;

    formMedia: formMedia | null = null;
    isUploading: boolean = false;

    isShowSideBar: boolean = false;

    private receiveSub!: Subscription;

    constructor(
        private route: ActivatedRoute,
        private messageService: Message,
        private socketService: SocketService,
        private groupService: Groups
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
                setTimeout(() => {
                    this.scrollToBottom();
                }, 1000);
            });
    }

    // load messages if id changes
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['id']) {
            this.messages = [];
            this.id = changes['id'].currentValue;
            this.loadMessages();
        }
    }

    loadMessages() {
        if (this.id != '') {
            this.messageService.getConversationById(this.id!).subscribe({
                next: (data) => {
                    this.messages = data.data;
                    console.log(data.data);
                    setTimeout(() => {
                        this.scrollToBottom();
                    }, 1000);
                },
                error: (error) => {
                    console.error('Error fetching conversation:', error);
                },
            });
        }
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

    // Message
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
        }

        this.socketService.sendMessage(messageData);
        this.newMessageText = '';
        this.formMedia = null;
        this.file = null;
    }

    onFileSelected($event: any, type: string): void {
        this.selectedFile = true;
        this.file = $event.target.files[0];
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

        const formData = new FormData();
        formData.append('file', this.file);

        if (this.formMedia) {
            this.deleteOldImage(); // delete old image and file = null
        }

        this.messageService.uploadMedia(formData).subscribe({
            next: (res: any) => {
                this.formMedia = res.data.media;
                this.isUploading = false;
            },
            error: (err: any) => {
                if (err.status == 500) alert('file is large');
                else alert(err.error.message);
                console.log('err messages: ', err);
                this.isUploading = false;
                this.file = null;
            },
        });
    }

    deleteOldImage() {
        if (this.formMedia) {
            this.messageService.deleteMedia(this.formMedia.publicId).subscribe({
                next: (res) => {
                    this.formMedia = null;
                    this.file = null;
                },
                error: (err) => {
                    alert('delete old images is failed');
                    console.log('err: ', err);
                },
            });
        }
    }

    // Group
    deleteGroup() {
        this.groupService.deleteGroup(this.id).subscribe({
            next: (res) => {
                console.log('delete group successfully');
                this.loadGroupEvent.emit();
                this.goBack();
            },
        });
    }

    leaveGroup() {
        this.groupService.leaveGroup(this.id).subscribe({
            next: (res) => {
                console.log('leave group successfully');
                this.loadGroupEvent.emit();
                this.goBack();
            },
            error: (err) => {
                alert(err.error.message);
                console.log('err: ', err);
            },
        });
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
