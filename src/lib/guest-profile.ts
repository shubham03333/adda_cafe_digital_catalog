export type GuestProfile = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  emailVerified: boolean;
  dateOfBirth?: string | null;
};

export const GUEST_STORAGE_KEY = "adda-guest-customer";
