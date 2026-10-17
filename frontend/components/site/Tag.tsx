/** Dashed "TO CONFIRM · …" / "DRAFT · …" review tag — rendered only while review flags are on. */
export function Tag({ show, children, inline, small, dark }: { show: boolean; children: React.ReactNode; inline?: boolean; small?: boolean; dark?: boolean }) {
  if (!show) return null;
  const cls = ['tag', inline && 'tag--inline', small && 'tag--sm', dark && 'tag--dark'].filter(Boolean).join(' ');
  return <p className={cls}>{children}</p>;
}
