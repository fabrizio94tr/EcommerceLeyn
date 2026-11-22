import { MacroPage, macroMetadata } from '../catalog';
import type { SP } from '@/components/Listing';

type Props = { searchParams: Promise<SP> };
export async function generateMetadata({ searchParams }: Props) { return macroMetadata('abbigliamento', await searchParams); }
export default async function Page({ searchParams }: Props) { return <MacroPage macro="abbigliamento" sp={await searchParams} />; }
