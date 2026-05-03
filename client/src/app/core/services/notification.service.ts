import {HttpClient} from '@angular/common/http';
import {inject,Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private serviceWorkerReady = false;

  async requestPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.warn('Notifications not supported in this browser');
        return false;
      }

      if (Notification.permission === 'granted') {
        return true;
      }

      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }

      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async subscribeToNotifications(ticketId: string, clinicId: string): Promise<void> {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications not supported');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'BHHFyBL1lEINvZkXMSKgqBPXdmWm9OGp5uWNMQqGKjYL4qKCvO8tR8LnKSfx9L9z7hqJKlVPJVYl7xC8Xf8KqnI'
        ) as any,
      });

      // Send subscription to backend
      this.http.post(`${this.apiUrl}/patient/notifications/subscribe`, {
        subscription: subscription.toJSON(),
        ticketId,
        clinicId,
      }).subscribe({
        error: (err) => console.error('Error saving subscription:', err),
      });
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}
