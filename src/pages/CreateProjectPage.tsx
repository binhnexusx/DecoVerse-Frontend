import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Home, Sparkles, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Header } from "@/components/common/Header";
import { ROOM_TYPES } from "@/types/room";

const createProjectSchema = z.object({
  projectName: z.string().nonempty("Project name is required"),
  roomType: z.enum([
    "living",
    "bedroom",
    "kitchen",
    "bathroom",
    "office",
    "dining",
    "studio",
    "other",
  ]),
  length: z.number().positive("Length must be a positive number"),
  width: z.number().positive("Width must be a positive number"),
  height: z.number().positive("Height must be a positive number"),
  prompt: z.string().optional(),
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

export default function CreateProject() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      roomType: "living",
    },
  });

  const selectedRoomType = watch("roomType");

  const onSubmit = (data: CreateProjectFormValues) => {
    console.log("FORM DATA 👉", data);
  };

  return (
    <div className="space-y-8">
      <Header
        title="Create New Project"
        subtitle="Set up your project and start designing"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-8">
        <section className="rounded-2xl bg-surface p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2 font-medium">
            <FileText className="h-5 w-5 text-primary" />
            Project Details
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Project Name <span className="text-red-500">*</span>
            </label>
            <Input
              {...register("projectName")}
              placeholder="My New Project"
              className="h-11 rounded-xl border"
            />
            {errors.projectName && (
              <p className="text-xs text-red-500">
                {errors.projectName.message}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-surface p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2 font-medium">
            <Home className="h-5 w-5 text-purple-500" />
            Room Type
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {ROOM_TYPES.map((room) => {
              const Icon = room.icon;
              const selected = selectedRoomType === room.key;

              return (
                <button
                  key={room.key}
                  type="button"
                  onClick={() => setValue("roomType", room.key)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition",
                    selected
                      ? "border-primary bg-accent text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  <Icon className="h-6 w-6" />
                  {room.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl bg-surface p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2 font-medium">
            <Ruler className="h-5 w-5 text-indigo-500" />
            Room Size
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              {...register("length", { valueAsNumber: true })}
              placeholder="Length (m)"
              className="h-11 rounded-xl border"
            />
            <Input
              {...register("width", { valueAsNumber: true })}
              placeholder="Width (m)"
              className="h-11 rounded-xl border"
            />
            <Input
              {...register("height", { valueAsNumber: true })}
              placeholder="Height (m)"
              className="h-11 rounded-xl border"
            />
          </div>

          {(errors.length || errors.width || errors.height) && (
            <p className="text-xs text-red-500">
              Room dimensions must be valid numbers greater than 0
            </p>
          )}
        </section>

        <section className="rounded-2xl bg-surface p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2 font-medium">
            <Sparkles className="h-5 w-5 text-cyan-500" />
            AI Design Prompt
          </div>

          <Textarea
            {...register("prompt")}
            rows={5}
            placeholder="Example: A modern minimalist living room with large windows..."
            className="rounded-xl"
          />
        </section>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" className="rounded-xl">
            Cancel
          </Button>
          <Button type="submit" className="rounded-xl">
            Create Project
          </Button>
        </div>
      </form>
    </div>
  );
}
