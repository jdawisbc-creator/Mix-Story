import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function backupServerPlugin(): Plugin {
  return {
    name: 'backup-server-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/backup')) {
          return next();
        }

        const backupsDir = path.resolve(process.cwd(), 'data', 'backups');
        if (!fs.existsSync(backupsDir)) {
          fs.mkdirSync(backupsDir, { recursive: true });
        }

        // Salvar snapshot no disco do servidor
        if (req.method === 'POST' && req.url === '/api/backup/salvar') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const now = new Date();
              const dateStr = now.toISOString().slice(0, 19).replace(/[:T]/g, '-');
              const filename = `backup_mix_${dateStr}.json`;
              const filePath = path.join(backupsDir, filename);
              fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                sucesso: true,
                nomeArquivo: filename,
                mensagem: 'Backup persistido com sucesso no servidor.',
                tamanhoBytes: Buffer.byteLength(body),
              }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ sucesso: false, erro: err.message }));
            }
          });
          return;
        }

        // Listar backups gravados no disco do servidor
        if (req.method === 'GET' && req.url === '/api/backup/listar') {
          try {
            const files = fs.readdirSync(backupsDir).filter((f) => f.endsWith('.json'));
            const list = files.map((file) => {
              const filePath = path.join(backupsDir, file);
              const stats = fs.statSync(filePath);
              let totalRegistros = 0;
              let geradoPor = 'Sistema';
              try {
                const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                geradoPor = content.geradoPor || 'Administrador Mix';
                if (content.totais) {
                  totalRegistros = Object.values(content.totais).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number;
                }
              } catch {}
              return {
                id: file,
                nomeArquivo: file,
                dataCriacao: stats.birthtime ? stats.birthtime.toISOString() : stats.mtime.toISOString(),
                tamanhoBytes: stats.size,
                totalRegistros,
                geradoPor,
              };
            });
            list.sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ sucesso: true, backups: list }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ sucesso: false, erro: err.message }));
          }
          return;
        }

        // Baixar arquivo de backup do servidor
        if (req.method === 'GET' && req.url?.startsWith('/api/backup/download/')) {
          const filename = path.basename(decodeURIComponent(req.url.replace('/api/backup/download/', '')));
          const filePath = path.join(backupsDir, filename);
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.end(content);
          } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ sucesso: false, erro: 'Arquivo não encontrado' }));
          }
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), backupServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
