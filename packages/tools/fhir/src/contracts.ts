import { z } from 'zod';

export const fhirResourceTypeSchema = z.enum([
  'Patient',
  'Encounter',
  'Observation',
  'Condition',
  'MedicationRequest',
  'DocumentReference',
  'Appointment',
  'Coverage',
]);

export const fhirAccessModeSchema = z.enum(['read', 'write']);

export const fhirToolRequestSchema = z.object({
  operation: z.enum(['search', 'read', 'create', 'update']),
  resourceType: fhirResourceTypeSchema,
  accessMode: fhirAccessModeSchema,
  patientId: z.string().min(1).optional(),
  encounterId: z.string().min(1).optional(),
  query: z.record(z.string(), z.string()).default({}),
});

export type FhirResourceType = z.infer<typeof fhirResourceTypeSchema>;
export type FhirAccessMode = z.infer<typeof fhirAccessModeSchema>;
export type FhirToolRequest = z.infer<typeof fhirToolRequestSchema>;
