import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react';

// In a real no-bundler page these two imports would resolve from a CDN, e.g.
//   import { pdf } from 'https://esm.sh/@imprint-pdf/react';
//   import { byId } from 'https://esm.sh/@imprint-pdf/fixtures';
// Here they point at the workspace packages so `tsc` can typecheck the glue.

document.querySelector('#download')!.addEventListener('click', async () => {
  const bytes = await pdf(byId('invoice')!.render(), { as: 'bytes' });
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'invoice.pdf';
  a.click();
  URL.revokeObjectURL(url);
});
