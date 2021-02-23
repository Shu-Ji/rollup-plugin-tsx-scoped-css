import reactRefresh from '@vitejs/plugin-react-refresh';
import {resolve} from 'path';
import {defineConfig} from 'vite';

// import scopedCss from 'rollup-plugin-tsx-scoped-css';
// import scopedCss from '../src/index';
import scopedCss from '../dist/index';

// https://vitejs.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            '@': resolve('./src'),
        },
    },
    plugins: [scopedCss(), reactRefresh()],
});
