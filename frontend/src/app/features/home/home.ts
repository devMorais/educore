import { Component } from '@angular/core';
import { Hero } from './sections/hero/hero';
import { HowItWorks } from './sections/how-it-works/how-it-works';

@Component({
  selector: 'app-home',
  imports: [Hero, HowItWorks],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}