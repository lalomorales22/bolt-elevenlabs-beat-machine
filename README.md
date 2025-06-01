# BOLTxELEVENLABS Beat Machine

An innovative digital audio workstation that combines the classic MPC-style interface with ElevenLabs' AI sound generation capabilities. Create unique beats, generate custom sounds, and produce music in a modern web interface.

<img width="483" alt="Screenshot 2025-06-01 at 10 31 49 AM" src="https://github.com/user-attachments/assets/d8ae25b4-c1b8-4116-a504-800ad73a46d7" />


## Features

### AI Sound Generation
- Generate unique sounds using ElevenLabs' AI technology
- Custom text-to-sound prompts
- Adjustable duration and parameters
- Real-time sound preview with waveform visualization

### MPC-Style Interface
- 16 assignable drum pads
- Keyboard mapping for quick access (1-4, Q-R, A-F, Z-V)
- Sound library management
- Real-time effects and controls

### Audio Controls
- Master Volume
- Tone Control
- Pitch Adjustment
- Filter Control
- Reverb Effect

### Recording & Playback
- Multi-track recording
- Overdub functionality
- Loop recording
- Playback controls
- Sound layering

### Sound Management
- Sound library organization
- Custom categories
- Pad assignments
- Download and delete options

## Getting Started

### Prerequisites
- Node.js 18 or higher
- ElevenLabs API key ([Get one here](https://elevenlabs.io))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lalomorales22/bolt-elevenlabs-beat-machine.git
cd bolt-elevenlabs-beat-machine
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

### Configuration

1. Navigate to the Sound Studio page
2. Enter your ElevenLabs API key in the configuration section
3. Start generating and managing sounds

## Usage

### Generating Sounds
1. Click the '+' on any pad or use the Sound Studio
2. Enter a name and description for your sound
3. Adjust duration (0.5-22 seconds)
4. Click "Generate Sound"

### Playing Sounds
- Click pads or use keyboard shortcuts
- Adjust effects using the control knobs
- Use transport controls for recording and playback

### Recording
1. Press REC to start recording
2. Play sounds using pads or keyboard
3. Press STOP when finished
4. Use OVERDUB for layering

### Sound Management
- Assign sounds to pads
- Organize sounds by category
- Preview and edit sounds in Sound Studio
- Download or delete sounds as needed

## Technical Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Web Audio API
- IndexedDB for storage
- ElevenLabs API
- WaveSurfer.js

## Project Structure

```
src/
├── components/         # React components
├── contexts/          # React context providers
├── services/          # API services
└── styles/            # CSS and styling
```

## Key Components

- `MpcInterface`: Main drum machine interface
- `SoundStudio`: Sound management and generation
- `AudioContext`: Audio processing and effects
- `SoundLibrary`: Sound storage and management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- ElevenLabs for the AI sound generation API
- The React and Web Audio API communities
- Classic MPC series for interface inspiration
