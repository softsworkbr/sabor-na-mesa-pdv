
// Define types for table management
export type TableStatus = "free" | "occupied" | "active" | "reserved";

export interface TableItem {
  id: string;
  number: number;
  status: TableStatus;
  occupants?: number;
  restaurant_id: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTableProps {
  number: number;
  status: TableStatus;
  restaurant_id: string;
  occupants?: number | null;
  description?: string | null;
}

export interface UpdateTableProps {
  status?: TableStatus;
  occupants?: number | null;
  description?: string | null;
  number?: number;
}
