'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { ActionState } from '@/app/actions';

export function Submit({ children, className = 'btn', pending: label = 'Attendi…' }: { children: React.ReactNode; className?: string; pending?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={className} disabled={pending}>{pending ? label : children}</button>;
}

export function Msg({ state }: { state: ActionState }) {
  if (!state) return null;
  if (state.error) return <p className="err" role="alert">{state.error}</p>;
  if (state.message) return <p className="okmsg" role="status">{state.message}</p>;
  return null;
}

export function useForm(action: (s: ActionState, fd: FormData) => Promise<ActionState>) {
  return useActionState(action, null);
}
