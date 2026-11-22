import Link from 'next/link';
export default function NotFound() {
  return <div className="wrap"><div className="empty"><h1 className="H">Pagina non trovata</h1><p className="muted">Il prodotto o la pagina che cerchi non esiste più.</p><Link href="/" className="btn">Torna alla home</Link></div></div>;
}
