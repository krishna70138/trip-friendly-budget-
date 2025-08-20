import z from "zod";

// Member schema and type
export const MemberSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  weight: z.number().min(0.1).optional().default(1),
});

export type Member = z.infer<typeof MemberSchema>;

// Expense schema and type
export const ExpenseSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  payerId: z.string(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  category: z.enum(['Travel', 'Stay', 'Food', 'Shopping', 'Activity', 'Other']),
  description: z.string().optional(),
  dateISO: z.string(),
  splitType: z.enum(['equal', 'weights']).optional().default('equal'),
  beneficiaries: z.array(z.string()).optional(),
});

export type Expense = z.infer<typeof ExpenseSchema>;

// Trip schema and type
export const TripSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Trip name is required"),
  startDateISO: z.string(),
  endDateISO: z.string(),
  members: z.array(MemberSchema).min(1, "At least one member is required"),
  currency: z.string().default('USD'),
  createdAtISO: z.string(),
});

export type Trip = z.infer<typeof TripSchema>;

// Settlement type
export type Settlement = {
  fromId: string;
  toId: string;
  amount: number;
};

// Balance type for display
export type MemberBalance = {
  memberId: string;
  name: string;
  paid: number;
  owes: number;
  net: number; // negative means they should receive money
};
