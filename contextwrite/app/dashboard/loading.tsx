export default function Loading() {
  return <div aria-busy="true" aria-label="Loading your dashboard">
    <div className="hello"><span className="av sk" /><div style={{ flex: 1 }}><div className="sk" style={{ height: 18, width: "60%", marginBottom: 8 }} /><div className="sk" style={{ height: 14, width: "40%" }} /></div></div>
    <div className="sk" style={{ height: 130, margin: "14px 0" }} />
    <div className="sk" style={{ height: 52, margin: "10px 0" }} />
    <div className="tiles"><div className="sk" style={{ height: 96 }} /><div className="sk" style={{ height: 96 }} /></div>
    <div className="sk" style={{ height: 150, margin: "14px 0" }} />
  </div>;
}
