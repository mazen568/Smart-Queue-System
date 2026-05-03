import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-credit-package-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './credit-package-card.component.html',
  styleUrls: ['./credit-package-card.component.css']
})
export class CreditPackageCardComponent {
  @Input() credits: 50 | 100 | 200 = 50;
  @Input() price: number = 0;
  @Input() isSelected = false;
  @Output() selected = new EventEmitter<number>();

  get pricePerCredit(): number {
    return this.price / this.credits;
  }

  onSelect() {
    this.selected.emit(this.credits);
  }
}
