# PNG Image Editor (Next.js)

An in-browser PNG image editor built with Next.js, React, Konva (via react-konva), and styled using Bootstrap 5. Upload a PNG, add text layers, position and style them, and export your final image on the client or via an optional server render endpoint.

## Features
- Upload PNG images for editing
- Add multiple text layers
- Drag to reposition text layers on the canvas
- Edit text content, font family, weight, size, color, opacity, alignment, rotation, and scale
- Dynamic Google Fonts loading and custom font upload (TTF/OTF/WOFF/WOFF2)
- Export the result as a PNG on the client
- Optional server-side export by posting the original image and layer data to a render API
- Responsive, Bootstrap-styled UI with a sticky layers panel

## Tech Stack
- Next.js + React (TypeScript)
- Konva + react-konva (canvas rendering)
- Bootstrap 5 (UI styling)
- Axios (HTTP)
- Tailwind CSS present in the repo (legacy styles), not required for current UI

## Getting Started

Prerequisites:
- Node.js 18+ recommended
- npm 8+ (or use pnpm/yarn if you prefer and adapt commands)

Install dependencies:
- npm install

Run development server:
- npm run dev

Build for production:
- npm run build

Start production server:
- npm run start

Then open http://localhost:3000 in your browser.

## Usage
1) Upload a PNG image using the input at the top of the editor.
2) Click "Add text" to create a new text layer.
3) Click and drag text on the canvas to reposition it. Use the Layers panel to:
   - Edit text content
   - Set font family (Google fonts load dynamically when selected)
   - Adjust size, weight, color, opacity
   - Change alignment (left/center/right)
   - Rotate in 15° increments or reset
   - Scale using the slider
4) Export:
   - Export PNG (client): downloads the current canvas as a PNG.

## Fonts
- Google Fonts: The app can dynamically load Google font families when selected in the Layers panel. For best practices, set your own API key (see Configuration). The code attempts to load the selected font using a Google Fonts stylesheet link and waits for the font to be available before rendering.
- Custom Fonts: Upload your own TTF/OTF/WOFF/WOFF2 file. The app registers it at runtime using the FontFace API, making it available in the Font family select list for future layers.

## Configuration
Environment variables (use a .env.local in the project root during development):
- NEXT_PUBLIC_GOOGLE_FONTS_API_KEY: Optional Google Web Fonts API key to fetch popular font families list. If not provided, the app currently includes a placeholder key in code for demonstration, which you should replace with your own or remove for production.

Example .env.local:
- NEXT_PUBLIC_GOOGLE_FONTS_API_KEY=your_api_key_here

Security note:
- Do NOT commit real API keys to source control. Use .env.local for local development and environment-specific config for deployments.

## UI Styling
- Bootstrap 5 is imported in pages/_app.tsx and used throughout the Editor for layout, buttons, and form controls.
- Tailwind CSS exists in the repo (styles/globals.css and tailwind.config.js) but is no longer necessary for the current UI. You may remove Tailwind if you prefer Bootstrap-only, or keep it if you want to mix utilities. If you remove Tailwind, also update PostCSS/Tailwind config accordingly.

## Project Structure (partial)
- components/Editor.tsx — Main editor UI and logic
- pages/_app.tsx — Global app wrapper, imports Bootstrap CSS and globals
- styles/globals.css — Legacy Tailwind utilities and global styles
- public/ — Static assets

## Optional Server Render
- The client exposes an "Export PNG (server)" option that posts the original PNG and a JSON array of text layers to NEXT_PUBLIC_RENDER_URL for server-side composition.
- The server is not included in this repo. You can implement it in any language (e.g., Python with Pillow) to render the final image using the submitted layers. Return a PNG in the response body.

## Troubleshooting
- Fonts not applying: ensure the selected Google font family successfully loaded (network tab) or the custom font file is a supported format.
- File input not accepting: the editor currently restricts uploads to image/png.

## Roadmap Ideas
- Multi-select and keyboard shortcuts (e.g., arrow nudge, delete)
- Image transforms (crop, resize) and additional layers (shapes, images)
- Snap lines and alignment aids
- History/undo-redo
- Layer lock/visibility toggles

## License
- Specify your license here (e.g., MIT).