// import { z } from "zod";

// export const createProjectSchema = z.object({
//   projectName: z.string().min(1, "Project name is required"),
//   roomType: z.enum([
//     "living",
//     "bedroom",
//     "kitchen",
//     "bathroom",
//     "office",
//     "dining",
//     "studio",
//     "other",
//   ]),
//   length: z.coerce.number().positive("Length must be greater than 0"),
//   width: z.coerce.number().positive("Width must be greater than 0"),
//   height: z.coerce.number().positive("Height must be greater than 0"),
//   prompt: z.string().optional(),
// });

// type CreateProjectFormValues = z.infer<typeof createProjectSchema>;
