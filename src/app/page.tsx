import { redirect } from 'next/navigation';

export default function Home() {
  // For this example, we will redirect straight to the dashboard.
  // In a real application, you would check for authentication status
  // and redirect to '/login' if the user is not authenticated.
  redirect('/dashboard');
}
