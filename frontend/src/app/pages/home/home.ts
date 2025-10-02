import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule],
  template: `
    <img loading="lazy" src="assets/images/welcome.png" alt="poster home">
    <h1 class="title">Hello</h1>
    <p>Welcome to our application!</p>
  `,
  styles: `
    @use 'variables' as *;

    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
    }
    
    .title {
      font-size: 4rem;
      font-weight: bold;
      font-family: 'Arial', sans-serif;
      color: $primary-color;
      font-family: "Dancing Script", cursive;
      margin: 20px 0;
    }

    p {
      font-family: "Dancing Script", cursive;
      font-size: 2rem;
      text-align: center;
      max-width: 600px;
      margin: 0 auto;
    }

    img {
      width: 100%;
      height: auto;
      display: block;
    }
  `,
})
export class Home {}
