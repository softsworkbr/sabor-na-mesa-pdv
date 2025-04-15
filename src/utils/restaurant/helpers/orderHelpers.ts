
import { ProductExtra } from '../types/orderTypes';

/**
 * Helper function to convert database extras (JSON) to typed ProductExtra array
 */
export const parseExtras = (extrasJson: any): ProductExtra[] | null => {
  if (!extrasJson) return null;
  
  console.log("Parsing extras:", extrasJson, "Type:", typeof extrasJson);
  
  try {
    // If already an array, return directly
    if (Array.isArray(extrasJson)) {
      console.log("Extras is already an array");
      return extrasJson as ProductExtra[];
    }
    
    // If JSON string, try to parse
    if (typeof extrasJson === 'string') {
      console.log("Extras is a string, trying to parse");
      try {
        const parsed = JSON.parse(extrasJson);
        if (Array.isArray(parsed)) {
          console.log("Successfully parsed extras string to array");
          return parsed as ProductExtra[];
        }
      } catch (e) {
        console.error("Failed to parse extras JSON string:", e);
      }
    }
    
    // If object with expected Supabase structure
    if (typeof extrasJson === 'object' && extrasJson !== null) {
      console.log("Extras is an object, trying to convert");
      return [extrasJson] as ProductExtra[];
    }
    
    console.log("Could not parse extras, returning null");
    return null;
  } catch (error) {
    console.error("Error parsing extras:", error);
    return null;
  }
};

/**
 * Helper function to convert database item to OrderItem with proper types
 */
export const convertToOrderItem = (item: any) => {
  return {
    ...item,
    extras: parseExtras(item.extras)
  };
};
