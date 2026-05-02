/**
 * Pipeline suite — cumulative cost of Imprint post-process hooks:
 *   core → core + printIntent → core + taggedPdf → core + signWithByteRange
 *
 * The self-signed test certificate is generated once at module init time
 * (not inside the measured loop) using node-forge.
 */

import { printIntent } from '@imprint/print';
import { renderToBuffer } from '@imprint/react';
import { signWithByteRange } from '@imprint/sign';
import { taggedPdf } from '@imprint/ua';
import forge from 'node-forge';
import React from 'react';
import { InvoiceDoc } from '../fixtures/invoice.js';
import { type BenchResult, bench } from '../runner.js';

interface TestCert {
  certPem: string;
  keyPem: string;
}

function generateSelfSignedCert(): TestCert {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();

  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [
    { name: 'commonName', value: 'Imprint Bench Test' },
    { name: 'organizationName', value: 'Imprint Benchmark Suite' },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.setExtensions([
    { name: 'basicConstraints', cA: true },
    { name: 'keyUsage', keyCertSign: true, digitalSignature: true, nonRepudiation: true },
  ]);

  cert.sign(keys.privateKey, forge.md.sha256.create());

  return {
    certPem: forge.pki.certificateToPem(cert),
    keyPem: forge.pki.privateKeyToPem(keys.privateKey),
  };
}

const TEST_CERT: TestCert = generateSelfSignedCert();

const invoiceElement = React.createElement(InvoiceDoc);

export async function runPipeline(runs: number, warmup: number): Promise<BenchResult[]> {
  const results: BenchResult[] = [];

  results.push(await bench('core', () => renderToBuffer(invoiceElement), runs, warmup));

  results.push(
    await bench(
      '+ print',
      () =>
        renderToBuffer(invoiceElement, {
          postProcess: [printIntent({ intent: 'PDF/X-4' })],
        }),
      runs,
      warmup,
    ),
  );

  results.push(
    await bench(
      '+ ua',
      () =>
        renderToBuffer(invoiceElement, {
          postProcess: [taggedPdf()],
        }),
      runs,
      warmup,
    ),
  );

  results.push(
    await bench(
      '+ sign',
      async () => {
        const pdf = await renderToBuffer(invoiceElement);
        return signWithByteRange(pdf, {
          certificate: TEST_CERT.certPem,
          privateKey: TEST_CERT.keyPem,
          reason: 'Benchmark signature',
        });
      },
      runs,
      warmup,
    ),
  );

  return results;
}
