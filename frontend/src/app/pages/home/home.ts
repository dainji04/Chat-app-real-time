import { Component } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule],
  template: `
    <img loading="lazy" src="assets/images/chat_home.gif" alt="poster home">
    <!-- <img loading="lazy" src="chat_home.gif" alt="poster home"> -->
  `,
  styles: `
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
    }

    img {
      width: 100%;
      height: auto;
      display: block;
    }
  `,
})
export class Home {}
