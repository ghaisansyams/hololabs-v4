/**
 * Domain model for the Hololabs booking engine.
 *
 * Mirrors supabase/schema.sql table-for-table. A "session" is one bookable
 * one-hour slot (max 13 seats); a "package" is an F&B bundle priced per
 * seat; a "booking" ties a customer to one session + package + seat count.
 */

export interface Package {
  id: string;
  name: string;
  description: string;
  includes: string[];
  /** Rupiah, per seat. */
  price: number;
  sortOrder: number;
}

/** One bookable one-hour slot, with live seat counts computed in the DB. */
export interface SessionAvailability {
  id: string;
  /** ISO date, e.g. "2026-10-15". */
  sessionDate: string;
  slotIndex: number;
  /** "18:00" */
  startTime: string;
  /** "19:00" */
  endTime: string;
  capacity: number;
  seatsTaken: number;
  seatsLeft: number;
}

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";
export type CheckinStatus = "NOT_CHECKED_IN" | "CHECKED_IN";

export interface BookingView {
  bookingId: string;
  bookingNumber: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  checkinStatus: CheckinStatus;
  seats: number;
  amount: number;
  /**
   * True when the guest's requested slot was full and the booking engine
   * moved them to the next available one — surfaced on the payment/e-ticket
   * page so nobody is confused about why their time differs from what they
   * picked (the auto-routing rule from the Spero x Hololabs meeting notes).
   */
  autoRouted: boolean;
  sessionDate: string;
  startTime: string;
  endTime: string;
  packageId: string;
  packageName: string;
  customerFullName: string;
  customerWhatsapp: string;
  paymentId: string | null;
  paymentStatusLive: PaymentStatus | null;
  paymentExpiresAt: string | null;
}
