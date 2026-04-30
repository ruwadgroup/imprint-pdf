#!/usr/bin/env node
import { cac } from 'cac';
import { version } from '../package.json';

const cli = cac('imprint');

cli
  .command('init', 'Initialize Imprint in the current project')
  .option('--ts', 'Use TypeScript config (default: true)', { default: true })
  .action(async (options: { ts: boolean }) => {
    const { runInit } = await import('./commands/init.js');
    await runInit(options);
  });

cli
  .command('render <file>', 'Render a PDF template to a file')
  .option('-o, --out <path>', 'Output path', { default: 'out' })
  .option('-w, --watch', 'Watch for changes and re-render')
  .option('--props <json>', 'Props as JSON string')
  .action(async (file: string, options: { out: string; watch: boolean; props?: string }) => {
    const { runRender } = await import('./commands/render.js');
    await runRender(file, options);
  });

cli
  .command('dev <file>', 'Start live preview server')
  .option('-p, --port <port>', 'Port number', { default: 4000 })
  .action(async (file: string, options: { port: number }) => {
    const { runDev } = await import('./commands/dev.js');
    await runDev(file, options);
  });

cli
  .command('validate <file>', 'Validate a PDF file')
  .option('--profile <profile>', 'Validation profile (pdf-ua-1, pdf-a-2b, pdf-x-4)')
  .action(async (file: string, options: { profile?: string }) => {
    const { runValidate } = await import('./commands/validate.js');
    await runValidate(file, options);
  });

cli.help();
cli.version(version);
cli.parse();
