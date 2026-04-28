# 🏥 Smart Queue System (SQS)
> A high-performance, real-time healthcare queue management platform designed to eliminate waiting room congestion and provide patients with a seamless booking experience.

[![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)

---

## 🌟 Overview
Smart Queue System is a full-stack solution for modern clinics. It replaces traditional paper tickets with a digital-first approach: **Live QR Tracking**, **Atomic Wait-Time Calculation**, and **Real-Time Push Updates**.

---

## 🎭 User Roles

### 👤 Patient (Public)
*   **Zero-Install Access**: Browse clinics and doctors via a mobile-friendly web interface.
*   **Virtual Ticketing**: Take a ticket digitally without touching a kiosk.
*   **Live Tracker**: Monitor "People Ahead" and "Estimated Wait Time" in real-time.
*   **Smart Departure**: Option to leave the queue with automatic position recalculation for others.

### 💼 Reception / Staff
*   **Dashboard**: View all active queues and waiting counts.
*   **Patient Flow**: Call the next patient, skip, or mark sessions as complete.
*   **Status Sync**: Every action updates the patient's phone instantly via WebSockets.

### 👑 Clinic Admin (Project Admin)
*   **Management**: Create and configure multiple doctors/queues.
*   **Performance**: Update average service times to keep ETA accuracy high.
*   **Facility Setup**: Manage clinic branding, address, and availability status.

---

## 🚀 Key Features

*   **⚡ Zero-Downtime Migration**: Backend optimized for atomic state transitions to prevent race conditions.
*   **💎 Premium UI/UX**: Professional Angular interface featuring shimmering skeletons, glassmorphism, and responsive design.
*   **📱 QR Integration**: Automatically generates unique tracking links and QR codes for every booking.
*   **📡 WebSocket Engine**: Powered by Socket.io for sub-second synchronization between staff actions and patient notifications.
*   **🔏 Secure Architecture**: Zod-validated API endpoints and MongoDB transactions for data integrity.

---

## 🛠️ Technical Stack

### **Frontend**
*   **Framework**: Angular 18 (Standalone Components)
*   **Styling**: Modern CSS (Variables, Flex/Grid, Keyframe Animations)
*   **State**: Reactive RxJS streams with ChangeDetectorRef optimization.

### **Backend**
*   **Runtime**: Node.js & Express.js (ES Modules)
*   **Database**: MongoDB Atlas with Mongoose ODM
*   **Real-time**: Socket.io for bi-directional communication.
*   **Validation**: Zod (Schema-based request validation)

---

## 📥 Getting Started

### 1. Prerequisites
*   Node.js (v18+)
*   MongoDB Instance (Local or Atlas)
*   Angular CLI (`npm install -g @angular/cli`)

### 2. Backend Setup
```bash
cd server
npm install
# Configure your .env file (MONGODB_URL, PORT)
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
ng serve
```

### 4. Seed Database
To populate the system with professional medical imagery and sample clinics:
```bash
cd server
node scripts/seed.js
```

---

## 🎨 Design Philosophy
The system follows a **"Medical Precision"** design system:
*   **Layout**: Stable grids that prevent Cumulative Layout Shift (CLS) using skeleton loaders.
*   **Feedback**: Standardized Modal and Spinner components for all async operations.
*   **Colors**: A palette of trust-inspiring blues and clinical whites.

---

## 📄 License
This project is for demonstration and production-ready healthcare queueing. All rights reserved.