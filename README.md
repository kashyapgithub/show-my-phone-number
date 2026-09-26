# Show My Number 📱

> An ultra-high-contrast, giant-typography web app that displays your phone number so cashiers and counter attendants can read it off your screen instead of having you recite it out loud.

Built for retail checkout counters, UPI-linked phone lookups, loyalty club signups, delivery verification, and noisy store environments.

---

## 🌟 Key Features

- **Giant, No-Wrap Typography**: Dynamically calculates the maximum possible font size (up to 120px) to guarantee arm's-length legibility across store counters without line-wrapping.
- **High-Contrast Store Legibility**: Pure `#000000` text on pure `#ffffff` background by default for bright indoor/fluorescent store lighting, plus one-tap contrast inversion for dark/OLED environments.
- **Privacy & Anti-Shoulder Surfing**:
  - Masked by default (`••••• •••••`) to keep bystanders in line from reading your number.
  - **Press & hold anywhere** to reveal the actual digits.
  - **Instant "Hide Now" button** to re-mask immediately once the cashier has noted it down.
- **Cashier Orientation & Flip**:
  - **180° Flip for Cashier**: Inverts the text upside down relative to the user so it faces the cashier across the glass counter.
  - **90° Landscape Fill**: Automatically fills wide screens as a digital billboard.
- **Screen Keep-Awake**: Uses the Web Screen Wake Lock API to prevent screen timeout while showing numbers.
- **Optical QR Code Mode**: Generates an optical QR code for handheld scanner guns and automated POS systems.
- **Slow Audio Readout**: Built-in speech synthesis enunciating digits one by one with pauses for loud stores or visually impaired attendants.
- **Multi-Number Management**: Save up to 10 numbers (Personal, Shop, Family, UPI/Loyalty) with custom labels and primary number pinning.
- **100% Offline & Local**: All data is persisted directly in browser `localStorage`. No accounts, no backend, no analytics, no external tracking.

---

## 🚀 Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + JetBrains Mono & Plus Jakarta Sans
- **Icons**: Lucide React
- **QR Generation**: QRCode
- **Screen Wake**: Screen Wake Lock API

---

## 🛠️ Development & Setup

### Prerequisites
- Node.js (v18+)
- npm or bun

### Installation
```bash
# Clone the repository
git clone https://github.com/kashyapgithub/show-my-phone-number.git

# Navigate to project directory
cd show-my-phone-number

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production
```bash
npm run build
```

---

## 📄 License
Apache-2.0
