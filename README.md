# Today

[Today](https://wes383.github.io/Today/) is designed to help you manage your daily schedule, track your focus time, and boost your productivity. It combines schedule management, various timing tools, and an AI assistant to provide a comprehensive productivity solution.

## Features

- **Schedule Management:**
  - Easily add and delete your daily tasks and events.
  - Mark tasks as complete to track your progress.
- **AI Assistant:**
  - Chat with an AI to quickly add, query, or manage your schedule using natural language.
- **Focus Tools:**
  - **Focus Timer**
  - **Stopwatch**
- **Statistics:**
  - Visualize your focus history to understand how you spend your time.
- **Daily Check-in:**
  - A simple feature to log your daily reflections or achievements.


## Tech Stack

- **Frontend:**
  - [React](https://reactjs.org/)
  - [TypeScript](https://www.typescriptlang.org/)
  - [Vite](https://vitejs.dev/)
  - [Tailwind CSS](https://tailwindcss.com/)
- **Desktop App Framework:**
  - [Tauri](https://tauri.app/) (with Rust)
- **AI Integration:**
  - [Google Gemini](https://ai.google.dev/)

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js and npm](https://nodejs.org/)
- [Rust and Cargo](https://rust-lang.org/)
- [Tauri development environment](https://tauri.app/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/wes383/today.git
   cd today
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

### Configuration

To use the AI Assistant feature, you need a Google Gemini API key.

Visit [Google AI Studio](https://aistudio.google.com/app/api-keys) to create your API key.

### Running in Development

To start the application for development, run:
```bash
npm run tauri dev
```

### Building the Application

To build the executable application for your platform, run:
```bash
npm run tauri build
```
After the build is complete, you can find the application files in the `src-tauri/target/release/` directory.

All icons are from [Material Symbols icons](https://fonts.google.com/icons). Sound effects are from [mixkit](https://mixkit.co/free-sound-effects/clock/).
