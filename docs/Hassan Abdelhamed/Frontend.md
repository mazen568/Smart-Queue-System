# Smart Queue System - Frontend Architecture & Implementation
**Author/Lead Developer:** Hassan Abdelhamed
**Framework:** Angular 17+ (Standalone Components, Signals, RxJS)
**Architecture:** Real-Time WebSocket Architecture

---

## 1. System Overview
The Smart Queue System frontend is designed to handle high-concurrency, real-time ticket management for medical clinics and hospitals. It features a completely reactive architecture, leveraging Angular Signals for synchronous state updates and Socket.io for live bi-directional synchronization. 

The application is split into highly specialized modules, with the two most prominent being the **Reception Control Dashboard** and the **Public TV Display**.

---

## 2. Reception Control Dashboard (`/reception`)

The reception dashboard is the mission control for clinic staff. It is designed for maximum efficiency, low cognitive load, and high-speed interactions.

### Key Features
- **Live Queue Grid:** Displays real-time status of all doctors in the clinic, showing who is currently serving and how many patients are waiting.
- **Queue Control Panel:** A detailed view for managing a specific doctor's queue.
  - **Actions:** Call Next, Skip, Recall, Complete.
  - **Keyboard Shortcuts:** Built-in hotkeys for rapid staff operation without needing a mouse.
- **Custom Audio Engine:** 
  - Utilizes the native browser **Web Audio API** (Oscillator Nodes + Gain Envelopes).
  - Synthesizes professional clinical chimes entirely in code (e.g., a multi-tone "Ding Dong" for calling tickets and a high-pitched bell for new arrivals).


---

## 3. Public TV Display (`/reception/display`)

A specialized, read-only interface designed explicitly to be displayed on large 4K TVs in clinic waiting areas. It is optimized for 10-meter readability and zero user interaction.

### UI/UX Design (Large-Scale Optimized)
- **Massive Viewport Scaling:** Abandons fixed pixel sizes in favor of CSS `clamp()` and Viewport Width (`vw`) units. Typography and layout stretch infinitely and proportionally to perfectly fit any screen size.
- **Premium Tech Aesthetic:** Features a deep navy (`#040A18`) background with bright cyan text (`#bae6fd`), ensuring extreme contrast.
- **Cognitive Grouping:** Doctors currently serving patients are highlighted, while inactive queues are automatically dimmed and desaturated to instantly guide patient attention.

### Real-Time Capabilities & Resilience
- **Socket Synchronization:** Maintains a perfectly synced grid of active tickets via `queueUpdated` events.
- **Offline Resilience:** Actively listens to the Socket.io connection state. If the TV loses internet, a massive red **"🔴 LIVE SYNC PAUSED - RECONNECTING..."** banner gracefully drops down to prevent patients from relying on frozen data.
- **Boot-Up Skeletons:** Implements custom CSS shimmering skeleton loaders to mask network latency during the initial TV boot sequence.

### Text-to-Speech (TTS) Integration
- **Web Speech API:** Leverages `window.speechSynthesis` to automatically announce called tickets (e.g., *"Ticket A-014, please proceed to Dr. Smith"*).
- **Autoplay Policy Bypass:** Browsers heavily restrict audio without user interaction. The display includes an elegant "Click to Enable Audio" glass overlay that forces an initial interaction, triggering a silent (`volume: 0`) utterance to permanently unlock the audio engine for the session.
- **Visual Sync:** When the TTS announces a ticket, the corresponding doctor's card pulses with a bright blue glow (`.flash`) for 4 seconds, perfectly synchronizing the audio queue with visual feedback.

---

## 4. Frontend Best Practices Implemented

- **Angular Signals:** Replaced traditional RxJS `BehaviorSubjects` in components with Signals for highly optimized, granular DOM updates.
- **Change Detection Optimization:** The Public Display is structured to allow for `OnPush` change detection, ensuring that the low-power smart TVs running the display do not suffer from CPU throttling or memory leaks over 24/7 uptimes.
- **Standalone Components:** All new features utilize Angular's Standalone architecture, eliminating `NgModules` for a lighter bundle size and faster lazy-loading.
- **Native Browser APIs:** Preferred native APIs (SpeechSynthesis, Web Audio, CSS Grid/Clamp) over heavy third-party libraries to maintain maximum performance and minimal bundle footprint.
