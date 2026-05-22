import { Component } from '@angular/core';
import { Hero } from './sections/hero/hero';
import { HowItWorks } from './sections/how-it-works/how-it-works';
import { Navbar } from '../../shared/components/navbar/navbar';
import { Footer } from '../../shared/components/footer/footer';

@Component({
  selector: 'app-home',
  imports: [Hero, HowItWorks, Navbar, Footer],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
