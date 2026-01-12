'use client';

import { useState } from 'react';
import UploadHistory from "@/components/upload/upload-history";
import { ConfigurationUpload } from '@/components/upload/configuration-upload';
import { OperationalUpload } from '@/components/upload/operational-upload';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

type UploadMode = 'operational' | 'configuration';

export default function UploadPage() {
    const [mode, setMode] = useState<UploadMode>('operational');
    const [uploadCompleted, setUploadCompleted] = useState<string | null>(null);

    const handleUploadComplete = (sessionId: string) => {
        setUploadCompleted(sessionId);
    };

    const handleNewUpload = () => {
        setUploadCompleted(null);
    }

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="font-headline text-3xl md:text-4xl">
                    {mode === 'operational' ? 'Analyze Financial Data' : 'Manage Configurations'}
                </h1>
                <p className="text-muted-foreground">
                    {mode === 'operational'
                        ? 'Upload your complete financial data file and request a specific analysis.'
                        : 'Upload individual mapping files to create or update a processing configuration.'
                    }
                </p>
            </div>

             {/* Mode Toggle */}
            <div className="flex justify-center">
                <div className="bg-muted p-1 rounded-lg">
                <Button
                    variant={mode === 'operational' ? 'default' : 'ghost'}
                    onClick={() => setMode('operational')}
                    className={cn("transition-all", mode === 'operational' && 'shadow-sm')}
                >
                    Operational Analysis
                </Button>
                <Button
                    variant={mode === 'configuration' ? 'default' : 'ghost'}
                    onClick={() => setMode('configuration')}
                     className={cn("transition-all", mode === 'configuration' && 'shadow-sm')}
                >
                    Mapping Configuration
                </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                     {uploadCompleted ? (
                        <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed border-green-500 bg-green-500/10 p-8 text-center">
                            <CheckCircle className="h-16 w-16 text-green-500 mb-4"/>
                            <h3 className="text-xl font-semibold mb-2">Upload Successful!</h3>
                            <p className="text-muted-foreground mb-6">
                                Your files for session <span className="font-mono">{uploadCompleted.slice(0, 8)}...</span> are now being processed.
                                <br/>
                                You can track the status in the Upload History.
                            </p>
                            <Button onClick={handleNewUpload}>
                                Start a New Upload
                            </Button>
                        </div>
                    ) : (
                        mode === 'operational' ? (
                            <OperationalUpload onUploadComplete={handleUploadComplete} />
                        ) : (
                            <ConfigurationUpload onUploadComplete={handleUploadComplete} />
                        )
                    )}
                </div>
                <div className="lg:col-span-1">
                     <UploadHistory newSessionId={uploadCompleted} />
                </div>
            </div>
        </div>
    );
}
