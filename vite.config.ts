import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// Myou prototype (MyoInsight). HTTPS + host:true so the dev server is reachable
// and camera-permitted from a phone on the same network / via port forwarding.
// GH_PAGES_BASE is set only by the GitHub Pages deploy build, since that site
// is served from a /myou-prototype/ subpath instead of the root.
export default defineConfig({
  base: process.env.GH_PAGES_BASE || "/",
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    port: 5173,
  },
})
