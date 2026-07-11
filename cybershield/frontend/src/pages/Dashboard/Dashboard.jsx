export default function Dashboard() {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: '#2563EB' }}>CyberShield Dashboard</h1>
      <p style={{ fontSize: '18px', marginTop: '10px' }}>Welcome to Security Operations Center</p>
      <div style={{ marginTop: '20px', padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#1e40af' }}>System Status: Online</h2>
        <p>All services are operational.</p>
      </div>
    </div>
  )
}
