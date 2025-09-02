import { z } from "zod";

export const serviceSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Service name is required"),
  hours: z.number().min(0.1, "Hours must be greater than 0"),
  rate: z.number().min(0.01, "Rate must be greater than 0"),
});

export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Valid email is required"),
  services: z.array(serviceSchema).min(1, "At least one service is required"),
  taxRate: z.number().min(0).max(1).default(0.085), // 8.5% default
});

export type Service = z.infer<typeof serviceSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
