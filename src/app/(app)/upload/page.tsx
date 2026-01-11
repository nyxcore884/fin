import { UploadArea } from "@/components/upload/upload-area";

export default function UploadPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl">Upload Data</h1>
        <p className="text-muted-foreground">
          Upload your financial files to begin processing and generate a new report.
        </p>
      </div>
      <UploadArea />
    </div>
  );
}
