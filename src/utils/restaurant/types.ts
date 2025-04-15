export interface PrinterConfig {
  id: string;
  restaurant_id: string;
  windows_printer_name: string;
  display_name: string;
  endpoint?: string | null;
  ip_address?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePrinterConfigProps {
  restaurant_id: string;
  windows_printer_name: string;
  display_name: string;
  endpoint?: string | null;
  ip_address?: string | null;
}

// Restaurant types
export interface CreateRestaurantProps {
  name: string;
  address?: string;
  phone?: string;
  logo_url?: string;
}

// User types
export interface Profile {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
}

export interface UserWithRole {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  email: string;
  role: 'owner' | 'manager' | 'staff';
}

export interface RestaurantUserInsert {
  restaurant_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'staff';
}

export interface UserRoleUpdate {
  role: 'manager' | 'staff';
}

// Restaurant invite type
export interface RestaurantInvite {
  id: string;
  restaurant_id: string;
  email: string;
  role: 'owner' | 'manager' | 'staff';
  status: string;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}
