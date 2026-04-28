import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import QRCode from 'qrcode';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  imports: [CommonModule],
  template: `<canvas #canvas class="qr"></canvas>`,
  styles: [
    `
      .qr {
        width: 160px;
        height: 160px;
      }
    `,
  ],
})
export class QrCodeComponent implements OnChanges {
  @Input() value = '';

  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (!this.canvas?.nativeElement) return;
    if (!this.value) {
      const ctx = this.canvas.nativeElement.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
      return;
    }

    await QRCode.toCanvas(this.canvas.nativeElement, this.value, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 160,
      color: { dark: '#111827', light: '#ffffff' },
    });
  }
}

