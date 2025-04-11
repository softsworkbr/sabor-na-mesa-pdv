
// Common type definitions for restaurant operations

export interface CreateRestaurantProps {
  name: string;
  address?: string;
  phone?: string;
  logo_url?: string;
}

// Define the profile interface to match expected structure
export interface Profile {
  id?: string;
  email?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
}

export interface UserWithRole {
  id: string;
  email?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  role: 'owner' | 'manager' | 'staff';
}

// Define specific type for restaurant user insert
export type RestaurantUserInsert = {
  restaurant_id: string;
  user_id: string;
  role: 'manager' | 'staff';
}

export type UserRoleUpdate = {
  role: 'manager' | 'staff';
}
