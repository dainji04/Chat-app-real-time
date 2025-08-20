import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FirebaseMessagingService } from './services/firebase/firebase-messaging';
import { ToastComponent } from "./components/toast/toast";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  
  constructor(private firebaseMessaging: FirebaseMessagingService) {}

  ngOnInit() {
    this.initializeFirebaseMessaging();
    console.log('App initialized');
  }

  async initializeFirebaseMessaging() {
    console.log('Initializing Firebase Messaging...');
    
    // Request permission and get token
    const token = await this.firebaseMessaging.requestPermissionAndGetToken();
    
    if (token) {
      console.log('FCM Token received:', token);
      // You can send this token to your backend server
      // to associate it with the current user for sending notifications
    }
    
    // Start listening for foreground messages
    this.firebaseMessaging.listenForMessages();
  }
}
