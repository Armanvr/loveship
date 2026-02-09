import tailwindcss from '@tailwindcss/vite'
import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [preact(), tailwindcss()],
})

