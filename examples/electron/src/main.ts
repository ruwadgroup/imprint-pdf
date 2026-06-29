import { writeFile } from 'node:fs/promises';
import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react';
import { app, dialog } from 'electron';

// Electron's main process is Node, so use the node `pdf` entry.
app.whenReady().then(async () => {
  const bytes = await pdf(byId('invoice')!.render(), { as: 'bytes' });

  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: 'invoice.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });

  if (!canceled && filePath) {
    await writeFile(filePath, bytes);
  }

  app.quit();
});
