export default function Loading() {
  return (
    <div className="wrap" aria-busy="true" aria-label="Loading" style={{ paddingTop: 'clamp(40px,6vw,88px)', paddingBottom: 'clamp(48px,7vw,104px)' }}>
      <div className="skel skel--warm" style={{ height: 32, width: 200, marginBottom: 24, borderRadius: 999 }} />
      <div className="skel skel--warm" style={{ height: 'clamp(48px,6vw,88px)', width: 'min(680px,92%)', marginBottom: 24 }} />
      <div className="skel skel--warm" style={{ height: 18, width: 'min(520px,80%)', marginBottom: 12, borderRadius: 999 }} />
      <div className="skel skel--warm" style={{ height: 18, width: 'min(420px,70%)', marginBottom: 40, borderRadius: 999 }} />
      <div className="skel skel--warm" style={{ height: 'clamp(220px,30vw,360px)', width: '100%', borderRadius: 32 }} />
    </div>
  );
}
