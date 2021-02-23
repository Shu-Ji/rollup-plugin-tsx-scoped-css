import reactRefresh from '@vitejs/plugin-react-refresh';
import {resolve} from 'path';

import scopedCss from 'rollup-plugin-tsx-scoped-css';
import {defineConfig} from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            '@': resolve('./src'),
        },
    },
    plugins: [scopedCss(), reactRefresh()],
});
