import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react';
import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';

@Controller()
export class InvoiceController {
  @Get('invoice')
  async invoice(@Res() res: Response): Promise<void> {
    const bytes = await pdf(byId('invoice')!.render(), { as: 'bytes' });
    res.type('application/pdf').send(Buffer.from(bytes));
  }
}
