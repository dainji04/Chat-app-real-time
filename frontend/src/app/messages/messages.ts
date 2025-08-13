import {Component, OnInit, ViewChild, OnDestroy} from '@angular/core';
import { Message } from '../services/messages/message';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DetailMessage } from '../detail-message/detail-message';
import { ClickOutside } from '../directives/clickOutSide/click-outside';
import { FriendService } from '../services/friends/friends';
import { Groups } from '../services/groups/groups';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

interface group {
    name: string;
    description: string;
    participantIds: string[];
    avatar?: string;
}

@Component({
    selector: 'app-messages',
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        DetailMessage,
        ClickOutside,
    ],
    templateUrl: './messages.html',
    styleUrl: './messages.scss',
})
export class Messages implements OnInit, OnDestroy {
    @ViewChild('detail') detailElement: any;
    @ViewChild('message') messageElement: any;
    messages: any[] = [];
    selectedMessageId: string = '';
    isDetailOpen: boolean = false;

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


    constructor(
        private messageService: Message,
        private friendServices: FriendService,
        private groupServices: Groups
    ) {}

    ngOnInit(): void {
        this.fetchMessages();
    }

    fetchMessages() {
        this.messageService.getAllConversations().subscribe((data: any) => {
            this.messages = data.data;
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

    selectMessage(messageId: string) {
        // Navigate to the detail message component with the selected message ID
        this.selectedMessageId = messageId;
        this.isDetailOpen = true;

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
        }, 300);
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
            },
            error: (err: HttpErrorResponse) => {
                alert(err.error.message);
                this.isCreatingGroup = false;
            }
        });
    }

    onFileSelected($event: any): void {
        this.file = $event.target.files[0];
    }

    onUpload(groupId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.groupServices.uploadGroupAvatar(groupId, this.file).subscribe({
                next: (res) => {
                    alert('upload avatar group successfully');
                    resolve();
                },
                error: (err) => {
                    reject(err);
                }
            });
        });
    }

    ngOnDestroy() {
        // Clean up body class when component is destroyed
        document.body.classList.remove('detail-message-open');
    }
}
