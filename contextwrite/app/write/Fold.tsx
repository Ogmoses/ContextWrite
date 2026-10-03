export default function Fold({ title, cls, open = false, children }: { title: string; cls: string; open?: boolean; children: React.ReactNode }) {
  return <details className={`sec ${cls}`} open={open}><summary>{title}</summary>{children}</details>;
}
