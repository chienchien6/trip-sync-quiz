import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import fs from 'node:fs/promises';
import path from 'node:path';

const contentAdminPlugin = () => ({
  name: 'trip-sync-content-admin',
  configureServer(server: any) {
    const guidesPath = path.resolve(process.cwd(), 'src/data/guides.json');
    const publicPath = path.resolve(process.cwd(), 'public');

    const sendJson = (res: any, status: number, payload: unknown) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(payload));
    };

    const readBody = (req: any) => new Promise<string>((resolve, reject) => {
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      req.on('end', () => resolve(body));
      req.on('error', reject);
    });

    const safeAssetName = (name: string) => name
      .toLowerCase()
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || `asset-${Date.now()}`;

    server.middlewares.use('/api/admin/guides', async (req: any, res: any) => {
      try {
        if (req.method === 'GET') {
          const raw = await fs.readFile(guidesPath, 'utf8');
          sendJson(res, 200, JSON.parse(raw));
          return;
        }

        if (req.method === 'PUT') {
          const guides = JSON.parse(await readBody(req));
          await fs.writeFile(guidesPath, `${JSON.stringify(guides, null, 2)}\n`);
          sendJson(res, 200, { ok: true });
          return;
        }

        sendJson(res, 405, { ok: false, message: 'Method not allowed' });
      } catch (error) {
        sendJson(res, 500, { ok: false, message: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    server.middlewares.use('/api/admin/assets', async (req: any, res: any) => {
      try {
        if (req.method !== 'POST') {
          sendJson(res, 405, { ok: false, message: 'Method not allowed' });
          return;
        }

        const { dataUrl, folder, fileName } = JSON.parse(await readBody(req));
        const targetFolder = folder === 'guide-covers' ? 'guide-covers' : 'guide-images';
        const match = String(dataUrl).match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,(.+)$/);
        if (!match) {
          sendJson(res, 400, { ok: false, message: 'Only PNG, JPG, WEBP, and GIF images are supported.' });
          return;
        }

        const extByMime: Record<string, string> = {
          'image/png': 'png',
          'image/jpeg': 'jpg',
          'image/jpg': 'jpg',
          'image/webp': 'webp',
          'image/gif': 'gif',
        };
        const extension = extByMime[match[1]] ?? 'jpg';
        const basename = safeAssetName(String(fileName));
        const outputName = `${basename}-${Date.now()}.${extension}`;
        const outputDir = path.join(publicPath, targetFolder);
        const outputPath = path.join(outputDir, outputName);

        await fs.mkdir(outputDir, { recursive: true });
        await fs.writeFile(outputPath, Buffer.from(match[2], 'base64'));
        sendJson(res, 200, { ok: true, src: `${targetFolder}/${outputName}` });
      } catch (error) {
        sendJson(res, 500, { ok: false, message: error instanceof Error ? error.message : 'Unknown error' });
      }
    });
  },
});

export default defineConfig({
  base: '/trip-sync-quiz/',
  plugins: [vue, contentAdminPlugin()],
  resolve: {
    alias: {
      vue: 'vue/dist/vue.esm-bundler.js',
    },
  },
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
});
