import { MOCK_UPLOAD_FILES } from "@/lib/data";
import { FileInput } from "./file-input";
import { Button } from "../ui/button";
import { Sparkles, Wand } from "lucide-react";

export function UploadArea() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_UPLOAD_FILES.map((file) => (
          <FileInput key={file.id} {...file} />
        ))}
      </div>
      <div className="flex justify-end">
        <Button size="lg" className="group relative overflow-hidden transition-all duration-300 hover:shadow-glow-accent">
          <Wand className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
          Process Files
          <Sparkles className="absolute right-2 h-5 w-5 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
        </Button>
      </div>
    </div>
  );
}
