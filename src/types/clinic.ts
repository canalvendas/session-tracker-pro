export type PaymentType = 'session' | 'shift';

export interface Clinic {
  id: string;
  user_id: string;
  name: string;
  session_value: number;
  shift_value: number;
  payment_type: PaymentType;
  color: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClinicFormData {
  name: string;
  session_value: number;
  shift_value: number;
  payment_type: PaymentType;
  color: string;
  is_default: boolean;
}
