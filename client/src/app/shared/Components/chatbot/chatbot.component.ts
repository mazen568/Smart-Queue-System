import {
  Component,
  signal,
  inject,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChatbotService, ChatMessage } from '../../../core/services/chatbot.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css',
})
export class ChatbotComponent implements AfterViewChecked {
  private chatbotService = inject(ChatbotService);

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;

  isOpen = signal(false);
  isLoading = signal(false);
  userInput = signal('');
  messages = signal<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! 👋 I'm SmartBot. I can help you check your queue position, find clinics, or cancel your ticket. How can I help you today?",
    },
  ]);

  // Conversation history to send to the backend (OpenAI format)
  private conversationHistory: ChatMessage[] = [];

  toggleChat() {
    this.isOpen.update((v) => !v);
  }

  setInput(value: string) {
    this.userInput.set(value);
  }

  sendMessage() {
    const text = this.userInput().trim();
    if (!text || this.isLoading()) return;

    // Add user message to display
    this.messages.update((msgs) => [...msgs, { role: 'user', content: text }]);
    this.userInput.set('');
    this.isLoading.set(true);

    this.chatbotService.sendMessage(text, this.conversationHistory).subscribe({
      next: (res) => {
        const reply = res.data.reply;
        // Update conversation history from server response (includes all turns)
        this.conversationHistory = res.data.history;
        // Add assistant reply to display
        this.messages.update((msgs) => [
          ...msgs,
          { role: 'assistant', content: reply },
        ]);
        this.isLoading.set(false);
      },
      error: (err) => {
        const is429 = err?.status === 429;
        this.messages.update((msgs) => [
          ...msgs,
          {
            role: 'assistant',
            content: is429
              ? '⏳ You\'re sending messages too fast. Please wait a moment and try again.'
              : '⚠️ Sorry, something went wrong. Please try again in a moment.',
          },
        ]);
        this.isLoading.set(false);
      },
    });
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom() {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
