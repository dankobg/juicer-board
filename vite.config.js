import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, 'src/juicer-board/juicer-board.ts'),
			name: 'juicer-board',
			fileName: 'juicer-board',
			formats: ['es', 'umd'],
		},
		rollupOptions: {
			external: [],
			output: {},
		},
	},
});
