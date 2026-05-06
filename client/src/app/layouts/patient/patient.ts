import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../../shared/Components/header/header';
import { ChatbotComponent } from '../../shared/Components/chatbot/chatbot.component';

@Component({
  selector: 'app-patient',
  imports: [RouterOutlet, Header, ChatbotComponent],
  templateUrl: './patient.html',
  styleUrls: ['./patient.css'],
})
export class Patient {}
