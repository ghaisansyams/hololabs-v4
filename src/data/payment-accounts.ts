/**
 * Transfer destinations shown on the payment page. Dummy accounts — no real
 * payment gateway is wired yet (see the note at the top of db/schema.sql).
 * A guest transfers manually and taps "Saya Sudah Transfer"; an admin
 * checks the account and confirms the booking from /admin/bookings.
 */
export interface PaymentAccount {
  bank: string;
  accountNumber: string;
  accountName: string;
}

export const paymentAccounts: PaymentAccount[] = [
  { bank: "BCA", accountNumber: "1234567890", accountName: "Aji" },
  { bank: "Mandiri", accountNumber: "9876543210", accountName: "Aji" },
];
