import { Suspense } from 'react';
import { SignupForm } from '@/components/AuthForms';

export const metadata = { title: 'Registrati', robots: { index: false } };
export default function Page() {
  return <div className="wrap"><div className="authbox"><h1 className="H">Crea il tuo account</h1><Suspense><SignupForm /></Suspense></div></div>;
}
