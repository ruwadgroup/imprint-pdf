import { Module } from '@nestjs/common';
import { InvoiceController } from './invoice.controller.js';

@Module({
  controllers: [InvoiceController],
})
export class AppModule {}
