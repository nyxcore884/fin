"use client"

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, FileUp, Loader, X, File as FileIcon, UploadCloud } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type FileInputProps = {
  id: string;
  title: string;
  description: string;
  required: boolean;
};

type FileState = 'empty' | 'selected' | 'loading' | 'success';

export function FileInput({ id, title, description, required }: FileInputProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileState, setFileState] = useState<FileState>('empty');
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileState('selected');
    }
  };
  
  const handleRemoveFile = () => {
    setFile(null);
    setFileState('empty');
    setProgress(0);
    if(inputRef.current) {
        inputRef.current.value = "";
    }
  }

  const handleUpload = async () => {
    if (!file) return;

    setFileState('loading');
    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    clearInterval(interval);
    setProgress(100);
    setFileState('success');
    toast({
        title: "File Processed",
        description: `"${file.name}" has been successfully processed.`,
    })
  };

  const triggerFileSelect = () => {
    inputRef.current?.click();
  }

  return (
    <Card className="flex h-full flex-col justify-between bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
            {fileState === 'success' ? <CheckCircle className="text-green-400" /> : <FileUp />}
            {title}
            {required && <span className="text-xs text-destructive">*</span>}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {fileState === 'empty' && (
           <div
            onClick={triggerFileSelect}
            className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-center transition-colors hover:border-primary hover:bg-muted/50"
            >
                <UploadCloud className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click or drag file to upload</p>
                <input type="file" ref={inputRef} onChange={handleFileChange} className="hidden" accept=".csv,.xlsx" />
           </div>
        )}
        {file && (fileState === 'selected' || fileState === 'loading' || fileState === 'success') && (
            <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
                    <FileIcon className="h-6 w-6 shrink-0 text-muted-foreground" />
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                    {fileState !== 'loading' && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRemoveFile}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                {fileState === 'loading' && (
                    <div className="flex items-center gap-3">
                       <Loader className="h-4 w-4 animate-spin text-accent" />
                       <Progress value={progress} className="h-2 w-full bg-accent/20" />
                    </div>
                )}
                {fileState === 'success' && (
                    <div className="flex items-center gap-2 text-sm text-green-400">
                        <CheckCircle className="h-4 w-4"/>
                        <span>Processing Complete</span>
                    </div>
                )}
                {fileState === 'selected' && (
                    <Button onClick={handleUpload} className="w-full" size="sm">
                        Process File
                    </Button>
                )}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
