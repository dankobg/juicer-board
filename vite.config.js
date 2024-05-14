import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, 'src/juicer-board/juicer-board.ts'),
			name: 'juicer-board',
			fileName: 'juicer-board',
			formats: ['es', 'umd'],
		},
		rollupOptions: {
			// plugins: [
			// 	dts({
			// 		include: ['src/vite-env.d.ts', 'src/juicer-board/juicer-board.ts'],
			// 		rollupTypes: true,
			// 	}),
			// ],
		},
	},
});
