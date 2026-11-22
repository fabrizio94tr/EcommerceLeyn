import { Suspense } from 'react';
import { LoginForm } from '@/components/AuthForms';

export const metadata = { title: 'Accedi', robots: { index: false } };
export default function Page() {
  return <div className="wrap"><div className="authbox"><h1 className="H">Bentornata</h1><Suspense><LoginForm /></Suspense></div></div>;
}
