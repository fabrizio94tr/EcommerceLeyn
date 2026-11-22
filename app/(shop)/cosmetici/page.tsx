import { MacroPage, macroMetadata } from '../catalog';
import type { SP } from '@/components/Listing';

type Props = { searchParams: Promise<SP> };
export async function generateMetadata({ searchParams }: Props) { return macroMetadata('cosmetici', await searchParams); }
export default async function Page({ searchParams }: Props) { return <MacroPage macro="cosmetici" sp={await searchParams} />; }
