import { z } from "zod";

export const serviceSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Service name is required"),
  type: z.enum(["hourly", "fixed"]).default("hourly"),
  hours: z.number().min(0).optional(),
  rate: z.number().min(0).optional(),
  total: z.number().min(0).optional(),
}).refine(
  (data) => {
    if (data.type === "hourly") {
      return data.hours !== undefined && data.hours > 0 && data.rate !== undefined && data.rate > 0;
    } else {
      return data.total !== undefined && data.total > 0;
    }
  },
  {
    message: "For hourly services, hours and rate are required. For fixed services, total is required.",
  }
);

export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Valid email is required"),
  clientPersonnumber: z.string().nonempty("Client personnumber is required"),
  clientAddress: z.string().nonempty("Client address is required"),
  services: z.array(serviceSchema).min(1, "At least one service is required"),
  taxRate: z.number().min(0).max(1).default(0.25), // 25% default
});

export type Service = z.infer<typeof serviceSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
