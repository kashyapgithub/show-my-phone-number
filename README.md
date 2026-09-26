# Show My Number

Show My Number is a high-contrast, large-typography application engineered for retail counters, point-of-sale (POS) checkouts, and customer verification environments. It provides a clear visual interface for displaying phone numbers across retail counters, removing the need to recite sensitive contact information aloud in public or noisy settings.

---

## Features

### Legibility and Display
- **Dynamic Large Typography**: Automatically calculates the maximum viewport font size to guarantee legibility at arm's length across retail counters without text wrapping.
- **High-Contrast Interface**: Pure black (`#000000`) on pure white (`#ffffff`) by default for fluorescent store environments, with a single-tap inverted OLED dark mode.
- **Counter-Facing Flip (180°)**: Inverts the display orientation so counter attendants and cashiers can read the number directly without tilting or passing the device.
- **Landscape Mode**: Reorients the viewport horizontally to maximize display width on larger screens.
- **Screen Keep-Awake**: Integrates the Web Screen Wake Lock API to prevent display sleep during counter interactions.

### Privacy and Security
- **Default Masking**: Masks phone digits by default (`••••• •••••`) to mitigate shoulder surfing in public queues.
- **Press-and-Hold Reveal**: Displays digits only while actively holding the screen.
- **Immediate Masking**: Provides a dedicated one-tap control to conceal digits immediately after verification.
- **Local Persistence**: Stores configuration and numbers strictly in client-side `localStorage`. No user accounts, cloud databases, external analytics, or remote logging.

### Accessibility and POS Integration
- **Optical QR Code Generation**: Converts contact numbers into standard optical QR codes compatible with handheld 2D barcode and POS scanners.
- **Digit-by-Digit Speech Synthesis**: Built-in speech synthesis enunciates each digit sequentially with pacing for high-noise environments or visually impaired operators.
- **Multi-Profile Management**: Supports saving multiple labelled numbers (such as Personal, Business, UPI, and Loyalty) with primary selection.

---

## Technology Stack

- **Frontend Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, JetBrains Mono, Plus Jakarta Sans
- **Mobile Runtime**: Capacitor (Android native shell)
- **Icons**: Lucide React
- **QR Generation**: QRCode
- **Browser APIs**: Screen Wake Lock API, Web Speech API

---

## Project Structure

```
├── android/                 # Native Android platform project (Capacitor)
├── src/
│   ├── components/          # UI components (modal, actions, controls)
│   ├── hooks/               # Custom React hooks (storage, wake lock, audio)
│   ├── utils/               # Formatting and speech utility helpers
│   ├── App.tsx              # Main application view
│   └── main.tsx             # Application entry point
├── .github/workflows/       # GitHub Actions automated build pipelines
├── capacitor.config.json    # Capacitor configuration
└── vite.config.ts           # Vite build configuration
```

---

## Getting Started

### Prerequisites
- Node.js 20 or higher
- npm (or compatible package manager)
- Java JDK 21 (required for Android APK builds)
- Android SDK Platform 36 and Build-Tools (for native compilation)

### Web Development

1. Clone the repository:
   ```bash
   git clone https://github.com/kashyapgithub/show-my-phone-number.git
   cd show-my-phone-number
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Build production web assets:
   ```bash
   npm run build
   ```

---

## Android Build

### Local Compilation

1. Build web distribution assets and synchronize with the native Android project:
   ```bash
   npm run build
   npx cap sync android
   ```

2. Compile the debug APK using Gradle:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

The compiled APK will be located at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Continuous Integration (CI)

This repository includes an automated GitHub Actions pipeline (`.github/workflows/android-build.yml`). Every push or pull request to the `main` branch automatically:
1. Validates and builds the React web application.
2. Synchronizes assets with the Capacitor Android project.
3. Compiles the Android APK using Gradle on Java 21.
4. Generates and uploads a downloadable debug APK artifact (`show-my-number-debug-apk`).

---

## License

This project is licensed under the Apache License 2.0. See the `LICENSE` file for details.
