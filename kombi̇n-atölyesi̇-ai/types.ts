export enum Category {
  TOP = 'Üst Giyim',
  BOTTOM = 'Alt Giyim',
  ONE_PIECE = 'Tek Parça',
  SHOES = 'Ayakkabı',
  ACCESSORIES = 'Aksesuar'
}

export interface ClothingItem {
  id: string;
  category: Category;
  imageUrl: string; // Base64 or URL
  name?: string;
}

export interface WardrobeItem extends ClothingItem {
  dateAdded: number;
}

export interface GenerationConfig {
  modelImage: string | null;
  selectedItems: ClothingItem[];
  userDescription?: string; // For auto-generation based on age/gender etc.
}

export type LoadingState = 'idle' | 'uploading' | 'generating' | 'success' | 'error';