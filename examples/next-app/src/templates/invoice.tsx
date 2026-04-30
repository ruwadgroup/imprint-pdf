import { Document, Page, Text, View } from '@imprint/react';

interface InvoiceData {
  id: string;
  customer: string;
  total: number;
  date: string;
}

interface InvoiceProps {
  invoice: InvoiceData;
}

export function Invoice({ invoice }: InvoiceProps) {
  return (
    <Document title={`Invoice ${invoice.id}`} author="Imprint Example">
      <Page size="A4" className="p-12 font-sans bg-white text-gray-900">
        {/* Header */}
        <View className="flex justify-between items-start mb-8">
          <Text className="text-3xl font-bold tracking-tight">Invoice</Text>
          <Text className="text-sm text-gray-500">#{invoice.id}</Text>
        </View>

        {/* Bill-to */}
        <View className="mb-8">
          <Text className="text-sm text-gray-500 font-medium">Bill to</Text>
          <Text className="text-base mt-1">{invoice.customer}</Text>
        </View>

        {/* Spacer */}
        <View className="flex-1" />

        {/* Totals */}
        <View className="mt-12 pt-4 border-t border-gray-200 flex justify-between">
          <Text className="text-sm font-medium">Due date</Text>
          <Text className="text-sm text-gray-600">{invoice.date}</Text>
        </View>
        <View className="mt-2 flex justify-between">
          <Text className="text-base font-semibold">Total</Text>
          <Text className="text-xl font-bold">${invoice.total.toLocaleString()}</Text>
        </View>
      </Page>
    </Document>
  );
}
