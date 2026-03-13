import {
  Sofa,
  Bed,
  CookingPot,
  Bath,
  Briefcase,
  Utensils,
  Palette,
  House,
} from "lucide-react";

export const ROOM_TYPES = [
  { key: "living", label: "Living Room", icon: Sofa },
  { key: "bedroom", label: "Bedroom", icon: Bed },
  { key: "kitchen", label: "Kitchen", icon: CookingPot },
  { key: "bathroom", label: "Bathroom", icon: Bath },
  { key: "office", label: "Office", icon: Briefcase },
  { key: "dining", label: "Dining Room", icon: Utensils },
  { key: "studio", label: "Studio", icon: Palette },
  { key: "other", label: "Other", icon: House },
] as const;

export type RoomType = (typeof ROOM_TYPES)[number]["key"];

export interface CreateProjectPayload {
  projectName: string;
  roomType: RoomType;
  length: number;
  width: number;
  height: number;
  prompt?: string;
}
