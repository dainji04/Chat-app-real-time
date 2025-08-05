import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../../components/header/header';

@Component({
  selector: 'app-chat-layout',
  imports: [RouterOutlet, Header],
  templateUrl: './chat-layout.html',
  styleUrl: './chat-layout.scss',
})
export class ChatLayout {}
