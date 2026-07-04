export type OverpassResponse = {
  elements: OverpassElement[];
};

export type OverpassElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
};


export interface Place {
  id: string;                      // Normalised unique ID (e.g., 'node-439201948')
  name: string;                    // Fallback to 'Unnamed Place' if missing
  type?: 'restaurant' | 'cafe' | 'attraction' | 'unknown'; // Simplified category
  lat?: number;                     // Unified latitude
  lon?: number;                     // Unified longitude
  cuisine?: string;                // Specific to food options
  website?: string;
  openingHours?: string;
  address?: string | undefined;                // Concatenated full address
  rawTags: Record<string, string>; // Custom properties
};