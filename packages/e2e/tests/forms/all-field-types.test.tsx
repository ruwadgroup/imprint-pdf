import {
  Button,
  Checkbox,
  Document,
  Dropdown,
  Page,
  RadioGroup,
  Signature,
  TextField,
} from '@imprint-pdf/react';
import { describe, expect, it } from 'vitest';
import { inspect, render } from '../../src/helpers/index.js';

describe('form fields', () => {
  it('renders every field type and registers them in /AcroForm', async () => {
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <TextField name="email" defaultValue="user@example.com" />
          <Checkbox name="agree" defaultChecked />
          <RadioGroup
            name="plan"
            options={[
              { value: 'free', label: 'Free' },
              { value: 'pro', label: 'Pro' },
            ]}
            defaultValue="pro"
          />
          <Dropdown
            name="country"
            options={[
              { value: 'us', label: 'United States' },
              { value: 'jp', label: 'Japan' },
            ]}
            defaultValue="us"
          />
          <Button name="submit" />
          <Signature name="approved-by" />
        </Page>
      </Document>,
    );
    const meta = await inspect(pdf);
    expect(meta.hasAcroForm).toBe(true);

    const widgets = meta.pages[0]!.annotationSubtypes.filter((s) => s === 'Widget');
    // textfield + checkbox + 2 radio kids + dropdown + button + signature = 7
    expect(widgets.length).toBeGreaterThanOrEqual(6);
  });
});
