import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
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

    @ViewChild('inputText') inputText!: ElementRef;
    @ViewChild('avatar') avatar!: ElementRef;
    @ViewChild('messagesList') messagesList!: ElementRef;

    messages: any[] = [];
    currentPage: number = 1;
    limit: number = 20;
    loadOldMessage: boolean = false; // infinities loading message

    newMessageText: string = '';
    currentUserId: string = '';

    isShowOptionMedia: boolean = false; // show options media to upload
    selectedFile: boolean = false;
    file: File | null = null;

    formMedia: formMedia | null = null; // save media from response when uploaded
    isUploading: boolean = false;

    isShowSideBar: boolean = false;

    private receiveSub!: Subscription; // listen receive new messages

    replyToMessage: string = '';
    replyToMessageId: string = '';

    isShowMember: boolean | null= null;
    isShowMedia: boolean | null = null;
    listMedia: any[] = [];

    userIdShowOption: string | null = null; // id to show option: remove, moderator, regular user

    isUploadAvatarGroup: boolean = false;
    fileAvatarGroup: File | null = null;
    currentObjectURL: string | null = null; // preview avatar group


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
        this.socketService.joinConversation(this.id!);

        this.loadMessages();

        // Lắng nghe tin nhắn từ server
        this.receiveSub = this.socketService
            .listen<any>('receive_message')
            .subscribe(async (data) => {
                this.messages.push(data.message);
                setTimeout(() => {
                    this.scrollToBottom();
                }, 500);
            });
    }

    // load messages if id changes
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['id']) {
            this.messages = [];
            this.id = changes['id'].currentValue;
            this.loadMessages();
            this.isShowMember = null;
            this.isShowMedia = null;
            this.listMedia = [];
            this.currentPage = 1; // reset current page when id changes
        }
    }

    loadMessages() {
        if (this.id != '') {
            this.loadOldMessage = true;
            this.messageService.getConversationById(this.id!).subscribe({
                next: (data) => {
                    this.messages = data.data;
                    this.inputText.nativeElement.focus();
                    setTimeout(() => {
                        this.scrollToBottom();
                    }, 100);
                },
                error: (error) => {
                    console.error('Error fetching conversation:', error);
                },
            });
        }
    }

    // onscroll top
    onScroll() {
        const messagesList = this.messagesList.nativeElement;
        if (!messagesList || this.loadOldMessage) return;
        const scrollTop = messagesList.scrollTop;
        const threshold = 100; // Load more messages when scrolled to the top 100px

        // Load more messages if scrolled to the top
        if (scrollTop < threshold) {
            this.loadMoreMessages();
        }
    }

    loadMoreMessages() {
        this.loadOldMessage = true;
        this.currentPage++;
        this.messageService.loadMoreMessages(this.id, this.currentPage, this.limit).subscribe({
            next: (data) => {
                this.messages = [...data.data, ...this.messages];
                this.loadOldMessage = false;
            },
            error: (error) => {
                console.error('Error loading more messages:', error);
                this.loadOldMessage = false;
            },
        });
    }

    getMediaInConversation() {
        if(!this.isShowMedia) {
            this.messageService.getMediaInConversation(this.id).subscribe({
                next: (data) => {
                    this.listMedia = data.data;
                    this.isShowMedia = true;
                },
                error: (error) => {
                    console.error('Error fetching media:', error);
                    this.isShowMedia = true;
                },
            });
        } else {
            this.isShowMedia = false;
            this.listMedia = [];
        }
    }

    scrollToBottom() {
        const bottomMessages = document.querySelector('#bottom');
        bottomMessages?.scrollIntoView({ behavior: 'smooth' });

        setTimeout(() => {
            this.loadOldMessage = false;
        }, 100);
    }

    // back to conversation pages in mobile
    goBack(): void {
        this.closeDetail.emit();
    }

    // check is own to render UI
    isOwnMessage(message: any): boolean {
        return message.sender._id === this.currentUserId;
    }

    // open media modal
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

        if (this.replyToMessage != '' && this.replyToMessageId != '') {
            messageData.replyTo = this.replyToMessageId;
        }

        this.socketService.sendMessage(messageData);
        this.newMessageText = '';
        this.formMedia = null;
        this.file = null;
        this.replyToMessage = '';
        this.replyToMessageId = '';
    }

    // reply to message
    setReplyToMessage(message: any) {
        this.replyToMessage = message.content.text;
        this.replyToMessageId = message._id;
        this.inputText.nativeElement.focus();
    }

    toggleUploadAvatarGroup($event: any): void {
        $event.stopPropagation();
        this.isUploadAvatarGroup = !this.isUploadAvatarGroup;
    }

    // upload avatar group
    onFileGroupSelected($event: any): void {
        const files = $event.target.files;
    
        // Check if files exist
        if (!files || files.length === 0) {
            return;
        }
        
        const file = files[0];
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Vui lòng chọn file ảnh hợp lệ (JPEG, PNG, WebP)');
            return;
        }
        
        // Validate file size (ví dụ: max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert('File quá lớn. Vui lòng chọn file nhỏ hơn 5MB');
            return;
        }
        
        // Revoke previous object URL to prevent memory leak
        if (this.currentObjectURL) {
            URL.revokeObjectURL(this.currentObjectURL);
        }
        
        // Create new object URL
        this.fileAvatarGroup = file;
        this.currentObjectURL = URL.createObjectURL(file);
        
        if (this.avatar?.nativeElement) {
            this.avatar.nativeElement.src = this.currentObjectURL;
        }
    }

    uploadAvatarGroup() {
        this.groupService.uploadAvatarGroup(this.fileAvatarGroup!, this.id).subscribe({
            next: (res) => {
                alert('Upload avatar group successfully');
                this.loadGroupEvent.emit();
                this.isUploadAvatarGroup = false;
            },
            error: (err) => {
                alert(err.error.message);
                console.log('err: ', err);
            },
        });
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

    // member in group: options
    checkPermissionToShowOption(): boolean {
        if (this.currentUserId === this.conversation.admin) {
            return true;
        } 
        if (this.conversation.moderators.includes(this.currentUserId)) {
            return true;
        }

        return false;
    }

    setUserIdShowOption(userId: string | null) {
        if(this.userIdShowOption) {
            this.userIdShowOption = null;
        } else {
            this.userIdShowOption = userId;
        }
    }

    // upgrade user to moderator
    upgradeUserToModerator(userId: string) {
        this.groupService.upgradeUserToModerator(userId, this.id).subscribe({
            next: (res) => {
                alert('success');
                this.loadGroupEvent.emit();
                this.userIdShowOption = null;
                this.conversation.moderators.push(userId);
            },
            error: (err) => {
                alert(err.error.message);
                console.log('err: ', err);
            },
        });
    }

    // downgrade moderator to regular user
    downgradeModeratorToRegularUser(userId: string) {
        this.groupService.downgradeModeratorToRegularUser(userId, this.id).subscribe({
            next: (res) => {
                alert('success');
                this.loadGroupEvent.emit();
                this.userIdShowOption = null;
                this.conversation.moderators = this.conversation.moderators.filter(
                    (m: any) => m !== userId
                );
            },
            error: (err) => {
                alert(err.error.message);
                console.log('err: ', err);
            },
        });
    }

    removeUser(userId: string) {
        this.groupService.removeUser(userId, this.id).subscribe({
            next: (res) => {
                alert('success');
                this.loadGroupEvent.emit();
                this.userIdShowOption = null;
                this.conversation.participants = this.conversation.participants.filter((p: any) => p._id !== userId);
            },
            error: (err) => {
                alert(err.error.message);
                console.log('err: ', err);
            },
        });
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
        this.isShowMember = false;
        this.isShowMedia = false;
        this.listMedia = [];

        // revoke old object URL
        if (this.currentObjectURL) {
            URL.revokeObjectURL(this.currentObjectURL);
        }

        this.currentPage = 1;
    }
}
