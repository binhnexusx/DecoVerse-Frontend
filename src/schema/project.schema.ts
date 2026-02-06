import { z } from "zod";
import { ROOM_TYPES } from "@/types/room";

export const createProjectSchema = z.object({
  projectName: z.string().nonempty("Project name is required"),

  roomType: z.enum(ROOM_TYPES.map((room) => room.key)),

  length: z.number().positive("Length must be greater than 0"),

  width: z.number().positive("Width must be greater than 0"),

  height: z.number().positive("Height must be greater than 0"),

  prompt: z.string().optional(),
});
