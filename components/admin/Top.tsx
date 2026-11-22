export function Top({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return <div className="top"><div><h1>{title}</h1>{sub && <div className="sub">{sub}</div>}</div>{children && <div className="tr">{children}</div>}</div>;
}
