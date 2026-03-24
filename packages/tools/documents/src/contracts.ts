import { z } from 'zod';

export const documentOperationSchema = z.enum([
  'ingest',
  'extract',
  'summarize',
  'classify',
  'generate-letter',
]);

export const documentReferenceSchema = z.object({
  documentId: z.string().min(1),
  sourceType: z.enum(['upload', 'fax', 'ehr', 'payer-portal', 'generated']),
  mimeType: z.string().min(1),
  description: z.string().min(1),
});

export const documentToolRequestSchema = z.object({
  operation: documentOperationSchema,
  references: z.array(documentReferenceSchema).min(1),
  includeCitations: z.boolean().default(true),
  outputFormat: z.enum(['plain-text', 'json', 'markdown']).default('markdown'),
});

export type DocumentOperation = z.infer<typeof documentOperationSchema>;
export type DocumentReference = z.infer<typeof documentReferenceSchema>;
export type DocumentToolRequest = z.infer<typeof documentToolRequestSchema>;
