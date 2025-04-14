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

// Export product types
export type {
  Product,
  ProductCategory,
  ProductExtra
} from './productTypes';

// Export order types
export type {
  Order,
  OrderItem,
  OrderStatus,
  CreateOrderProps,
  UpdateOrderProps,
  CreateOrderItemProps,
  UpdateOrderItemProps,
  ProductExtra as OrderProductExtra,
  PaymentMethod,
  OrderPayment,
  CreateOrderPaymentProps
} from './orderTypes';

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

// Export order management functions
export {
  createOrder,
  updateOrder,
  getOrderById,
  getOrderByTableId,
  getOrders,
  addOrderItem,
  updateOrderItem,
  removeOrderItem,
  completeOrder,
  cancelOrder,
  calculateOrderTotal,
  addOrderPayment,
  getPaymentMethods,
  completeOrderPayment
} from './orderManagement';

// Export printer management functions
export {
  getPrinterConfigsByRestaurant,
  createPrinterConfig,
  updatePrinterConfig,
  deletePrinterConfig
} from './printerManagement';

// Export printer config types
export type {
  PrinterConfig,
  CreatePrinterConfigProps
} from './types';
