import { Suspense } from 'react';
import { ResetForm } from '@/components/AuthForms';

export const metadata = { title: 'Recupera password', robots: { index: false } };
export default function Page() {
  return <div className="wrap"><div className="authbox"><h1 className="H">Recupera la password</h1><Suspense><ResetForm /></Suspense></div></div>;
}
