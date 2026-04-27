import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../../shared/Components/header/header';

@Component({
  selector: 'app-patient',
  imports: [RouterOutlet,Header],
  templateUrl: './patient.html',
  styles: ``,
})
export class Patient {}
