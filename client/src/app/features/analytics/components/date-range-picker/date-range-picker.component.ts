import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [
    CommonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './date-range-picker.component.html',
  styleUrls: ['./date-range-picker.component.css'],
})
export class DateRangePickerComponent implements OnInit {
  @Output() dateRangeChange = new EventEmitter<{ from: Date; to: Date }>();

  fromDate = new Date();
  toDate = new Date();

  ngOnInit() {
    // Set default: last 7 days
    this.toDate = new Date();
    this.fromDate = new Date();
    this.fromDate.setDate(this.toDate.getDate() - 7);
    // Emit default range on init
    setTimeout(() => this.onApply(), 100);
  }

  onDateChange() {
    // Auto-apply on each date change
    this.onApply();
  }

  onApply() {
    if (this.fromDate && this.toDate && this.fromDate <= this.toDate) {
      this.dateRangeChange.emit({
        from: this.fromDate,
        to: this.toDate,
      });
    }
  }
}
