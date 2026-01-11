import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChromeIcon } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo className="h-16 w-16" />
          </div>
          <CardTitle className="font-headline text-3xl">Budget Insights</CardTitle>
          <CardDescription>AI-Powered Financial Intelligence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button asChild size="lg" className="w-full transition-all hover:shadow-glow-primary">
              <Link href="/dashboard">
                <ChromeIcon className="mr-2 h-5 w-5" />
                Sign in with Google
              </Link>
            </Button>
            <p className="px-8 text-center text-xs text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy. This is a demo app; authentication is simulated.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
