import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../../shared/Components/header/header';

@Component({
  selector: 'app-reception',
  imports: [RouterOutlet, Header],
  templateUrl: './reception.html',
  styles: ``,
})
export class Reception {}
