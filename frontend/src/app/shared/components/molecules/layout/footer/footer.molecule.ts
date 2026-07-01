import { Component } from '@angular/core';
import { Logo } from '../../../atoms/logo/logo.atom';

@Component({
  selector: 'app-footer',
  imports: [Logo],
  templateUrl: './footer.molecule.html',
  styleUrl: './footer.molecule.scss',
})
export class Footer {

}
