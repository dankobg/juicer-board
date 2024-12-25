import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, 'src/juicer-board.ts'),
			name: 'juicer-board',
			fileName: 'juicer-board',
			formats: ['es'],
		},
	},
	plugins: [dts({ rollupTypes: true })],
});
