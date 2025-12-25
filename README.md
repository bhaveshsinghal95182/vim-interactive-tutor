# VimInteractive

A web-based interactive Vim tutorial that brings the classic `vimtutor` experience to your browser. Learn Vim through hands-on practice with real-time visual feedback, wrapped in a clean Gruvbox dark theme.

![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-19-61dafb)

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Installation](#installation)
- [Usage](#usage)
- [Curriculum](#curriculum)
- [Vim Commands Supported](#vim-commands-supported)
- [Tech Stack](#tech-stack)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Features

**Comprehensive Curriculum**  
24 interactive lessons organized across 7 levels, progressing from basic cursor movement to advanced Vim features. Each lesson includes clear instructions, a specific task, a visual target showing the expected result, hints, and automatic completion detection.

**Full Vim Emulation**  
Supports Normal, Insert, Visual, Visual-Line, Command, and Replace modes with authentic Vim behavior.

**Progress Tracking**  
Your progress saves automatically to localStorage. Pick up where you left off, see visual checkmarks for completed lessons, and unlock lessons progressively as you advance.

**Virtual Shell Commands**  
Practice with simulated shell commands like `:w`, `:!ls`, `:!pwd`, `:!date`, `:set`, and `:help`.

## Demo

Try it out at: [https://vim-interactive-tutor.vercel.app](https://vim-interactive-tutor.vercel.app)

### Preview

```html
<video controls width="720" src="https://vim-interactive-tutor.vercel.app/vim-interactive-tutor-1766591938715.mp4"></video>
```

## Installation

Make sure you have [Node.js](https://nodejs.org/) (v18 or higher) installed.

```bash
# Clone the repository
git clone https://github.com/bhaveshsinghal95182/vim-interactive-tutor.git

# Navigate to the project directory
cd vim-interactive-tutor

# Install dependencies
pnpm install
# or
npm install

# Start the development server
pnpm dev
# or
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

## Usage

1. Start with Level 1, Lesson 1
2. Read the instructions in the right panel
3. Complete the task in the editor using Vim commands
4. The lesson auto-completes when you match the target
5. Progress to the next lesson

The keyboard hint panel (toggle with `?`) shows common commands if you get stuck.

## Curriculum

| Level | Focus Area |
|-------|------------|
| Level 1 | Basics - Navigation, modes, quitting |
| Level 2 | Editing - Insert, delete, undo |
| Level 3 | Motions - Word movements, line jumps |
| Level 4 | Operators - Delete, change, yank combos |
| Level 5 | Search - Find, replace, patterns |
| Level 6 | Visual Mode - Selection and operations |
| Level 7 | Advanced - Macros, settings, customization |

## Vim Commands Supported

| Category | Commands |
|----------|----------|
| Modes | Normal, Insert, Visual, Visual-Line, Command, Replace |
| Cursor Movement | `h`, `j`, `k`, `l`, `w`, `b`, `e`, `0`, `$`, `gg`, `G` |
| Operators | `d` (delete), `y` (yank), `c` (change), `r` (replace) |
| Put/Paste | `p` (put after), `P` (put before) |
| Undo/Redo | `u` (undo), `Ctrl-r` (redo) |
| Search | `/pattern`, `?pattern`, `n`, `N` |
| Counts | Number prefixes (e.g., `3w`, `5j`, `2dd`) |

## Tech Stack

- **React 19** with TypeScript
- **Vite** for development and builds
- **Tailwind CSS v3** with custom Gruvbox theme
- **shadcn/ui** component library
- **Radix UI** primitives

No backend required. Everything runs client-side.

## Roadmap

- [ ] Welcome screen for first-time users
- [ ] Visual highlighting for selected text
- [ ] Progress dashboard with statistics
- [ ] Completion certificate generation

## Contributing

Contributions are welcome. Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please make sure your code follows the existing style and includes appropriate tests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Built by [Bhavesh Singhal](https://github.com/bhaveshsinghal95182)
