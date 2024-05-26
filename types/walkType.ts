export interface Location {
  latitude: number;
  longitude: number;
  recorded_at: Date;
}

export interface PetWalkForm {
  start_at: Date;
  end_at: Date;
  locations: Location[];
  distance: number;
  pet_id: number;
}

export interface PetSitterWalkForm {
  start_at: Date;
  end_at: Date;
  locations: Location[];
  distance: number;
  pet_id: number;
  post_id: number;
}

export enum WalkRole {
  PetOwner = "PetOwner",
  PetSitterWalker = "PetSitterWalker",
}
