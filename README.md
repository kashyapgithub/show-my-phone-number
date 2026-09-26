# Show My Number

Show My Number is a privacy-first, high-contrast utility designed to protect personal contact information at retail checkout counters and point-of-sale (POS) terminals. It enables shoppers to display, manage, and segment phone numbers visually, eliminating verbal dictation in public queues and preventing primary phone numbers from being harvested by commercial retail tracking systems.

---

## Rationale: Privacy and Data Protection

### The Retail Data Collection Problem
At retail checkout counters, supermarkets, apparel chains, and pharmacies, modern point-of-sale (POS) billing systems routinely mandate entering a customer phone number before completing transactions, issuing digital receipts, or applying loyalty discounts. This practice presents critical privacy risks:

1. **Transaction Profiling and Spam Exploitation**: Retail CRM and billing software links your phone number directly to an itemized audit trail of everything you purchase—including transaction times, basket contents, brand preferences, and spending frequency. This personal purchasing profile is frequently fed into aggressive telemarketing engines, automated SMS marketing pipelines, and third-party data aggregators.
2. **Eavesdropping in Public Queues**: Reciting a phone number out loud in noisy or crowded stores exposes sensitive personal contact information to nearby bystanders, cashier staff, and surveillance equipment.

### The Solution: Identity Segmentation and Visual Handshake
Show My Number restores consumer autonomy by decoupling retail loyalty identification from personal communication channels:

- **Phone Numbers as Disposable Store Identifiers**: Not everyone wants to surrender their personal phone number to retail chains. Show My Number allows users to store and organize multiple numbers (e.g., secondary SIMs, dedicated loyalty numbers, or brand-specific burner lines). In this model, the number serves strictly as an anonymous account ID for that store brand rather than a private contact channel.
- **Silent Visual Exchange**: Replaces verbal disclosure with a bold, legible visual display that cashiers can read or scan directly across retail counters.
- **Anti-Shoulder Surfing Controls**: Phone digits remain masked by default (`••••• •••••`) to prevent line observers from reading the screen, exposing digits only upon an intentional press-and-hold gesture.
- **Zero Cloud Footprint**: Operates 100% locally on-device. All records persist exclusively in client-side `localStorage`. No cloud accounts, external databases, analytics trackers, or network telemetry.

---

## Features

### Legibility and Presentation
- **Dynamic Large-Scale Typography**: Automatically calculates the maximum viewport font size to guarantee legibility at arm's length across retail counters without text wrapping.
- **High-Contrast Interface**: Pure black (`#000000`) on pure white (`#ffffff`) by default for brightly lit store environments, with a single-tap OLED dark mode inversion.
- **Counter-Facing Inversion (180° Flip)**: Flips the display upside-down relative to the device holder, allowing attendants and cashiers across plexiglass partitions to read digits naturally without passing or tilting the device.
- **Landscape Fill Mode**: Rotates the display horizontally to maximize digit scale on wider screens and tablets.
- **Screen Keep-Awake**: Integrates the Web Screen Wake Lock API to prevent screen timeout while presenting numbers at checkout.

### Privacy and Protection
- **Default Masking**: Digits remain obfuscated (`••••• •••••`) upon opening to eliminate line-of-sight exposure.
- **Press-and-Hold Reveal**: Digits are visible only while actively touching and holding the screen.
- **One-Tap Instant Conceal**: Immediately re-masks numbers the moment the cashier finishes entering the digits.
- **Strictly Offline Storage**: Zero network dependencies for stored data; numbers never leave the local device storage.

### Store Cards and Identity Slots
- **Brand Cards & Phone Slots**: Supports up to 20 saved entries across phone numbers and brand customer IDs, with store brand tagging, instant category filtering (All, Phones, Cards), and primary default pinning.
- **Smart Chunking & Formatting**: Supports multiple digit chunking styles (Smart Contextual, 5-5 for UPI/Asian markets, 3-3-4 for US/Intl, and unformatted continuous).

### AI-Powered Receipt and Bill Scanner
- **Merchant Brand Extraction**: Uses Google Gemini 2.5 Flash Vision (`@google/genai`) to automatically read receipt and invoice headers, identifying store and merchant brand names (e.g., Costco, Decathlon, Starbucks, Target, Walmart).
- **Customer and Membership ID Detection**: Automatically parses and extracts member numbers, loyalty account IDs, and phone numbers printed on physical store bills or paper slips.
- **Client-Side Image Optimization**: Preprocesses and compresses camera photos and receipt images directly on-device using HTML5 Canvas prior to inference, minimizing bandwidth and latency.
- **Flexible Key and Demo Modes**: Supports personal Google Gemini API keys stored strictly on the local device, as well as offline sample bill presets for testing and demonstration.

---

## Technology Stack

- **Frontend Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, JetBrains Mono, Plus Jakarta Sans
- **Mobile Runtime**: Capacitor (Native Android runtime)
- **AI & Vision Analysis**: Google Gemini 2.5 Flash (`@google/genai`)
- **Icons**: Lucide React
- **Browser APIs**: Screen Wake Lock API

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
