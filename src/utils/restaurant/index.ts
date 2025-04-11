
// Re-export all restaurant utility functions and types from a single entry point

// Export types
export type {
  CreateRestaurantProps,
  Profile,
  UserWithRole,
  RestaurantUserInsert,
  UserRoleUpdate
} from './types';

// Export table types
export type {
  TableItem,
  TableStatus,
  CreateTableProps,
  UpdateTableProps,
  TableOrderTable
} from './tableTypes';

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

// Export table management functions
export {
  getTablesByRestaurant,
  createTable,
  updateTable,
  deleteTable,
  getTableById
} from './tableManagement';
