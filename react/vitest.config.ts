import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'reveal.js': resolve(dirname(fileURLToPath(import.meta.url)), '../js/index.ts'),
		},
	},
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/__tests__/setup.ts'],
	},
});
