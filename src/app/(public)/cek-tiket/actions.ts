"use server";

import { checkInBooking } from "@/lib/services/booking";
import { hasErrors, validateCheckIn, type CheckInFormValues, type FieldErrors } from "@/lib/utils/validation";

export interface CheckInFormState {
  error?: string;
  fieldErrors?: FieldErrors<CheckInFormValues>;
  success?: {
    customerFullName: string;
    sessionDate: string;
    startTime: string;
    alreadyCheckedIn: boolean;
  };
}

export async function submitCheckIn(_prev: CheckInFormState, formData: FormData): Promise<CheckInFormState> {
  const values: CheckInFormValues = {
    bookingNumber: String(formData.get("bookingNumber") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
  };

  const fieldErrors = validateCheckIn(values);
  if (hasErrors(fieldErrors)) {
    return { fieldErrors };
  }

  const result = await checkInBooking(values.bookingNumber, values.whatsapp);
  if (!result.ok) {
    return { error: result.error };
  }

  return {
    success: {
      customerFullName: result.customerFullName!,
      sessionDate: result.sessionDate!,
      startTime: result.startTime!,
      alreadyCheckedIn: Boolean(result.alreadyCheckedIn),
    },
  };
}
