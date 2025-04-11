
// Re-export all restaurant utility functions and types from a single entry point

// Export types
export type {
  CreateRestaurantProps,
  Profile,
  UserWithRole,
  RestaurantUserInsert,
  UserRoleUpdate
} from './types';

// Export restaurant management functions
export {
  createRestaurant,
  updateRestaurant
} from './restaurantManagement';

// Export user management functions
export {
  getUsersForRestaurant,
  addUserToRestaurant,
  removeUserFromRestaurant,
  updateUserRole
} from './userManagement';
