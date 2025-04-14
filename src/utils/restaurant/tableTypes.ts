export type TableStatus = "free" | "occupied" | "active" | "reserved" | "blocked";

export interface TableItem {
  id: string;
  number: number;
  status: TableStatus;
  restaurant_id: string;
  occupants?: number | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTableProps {
  number: number;
  status?: TableStatus;
  restaurant_id: string;
  occupants?: number | null;
  description?: string | null;
}

export interface UpdateTableProps {
  number?: number;
  status?: TableStatus;
  occupants?: number | null;
  description?: string | null;
}

// This interface is used specifically for the TableOrderDrawer component
export interface TableOrderTable {
  id: string;  // Changed from number to string to make it compatible with UUID
  number: number;
  status: TableStatus;
  capacity: number;  // Changed from optional to required to match Table interface
}
