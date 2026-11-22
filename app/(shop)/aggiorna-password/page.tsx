import { Suspense } from 'react';
import { NewPasswordForm } from '@/components/AuthForms';

export const metadata = { title: 'Nuova password', robots: { index: false } };
export default function Page() {
  return <div className="wrap"><div className="authbox"><h1 className="H">Scegli una nuova password</h1><Suspense><NewPasswordForm /></Suspense></div></div>;
}
