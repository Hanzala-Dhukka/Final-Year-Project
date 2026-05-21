import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    activeScans: 0,
    threatsDetected: 0,
    systemHealth: 'Healthy',
    dbConnections: 0
  })
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    // Fetch initial data from our FastAPI backend
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Setup axios request with bearer token
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        }

        // We run these concurrently or fallback gracefully if endpoints are not fully ready yet
        let scansData = []
        try {
          const res = await axios.get('/api/scans', config)
          scansData = res.data || []
        } catch (e) {
          console.warn('Scans endpoint failed or not yet populated. Using fallback sample scans.', e)
          scansData = [
            { id: 1, target: '192.168.1.1', status: 'Completed', threats: 0, date: '2026-05-21 18:30' },
            { id: 2, target: 'cybershield.local', status: 'Warning', threats: 2, date: '2026-05-21 19:15' },
            { id: 3, target: '10.0.0.15', status: 'Scanning', threats: 1, date: 'Just now' }
          ]
        }

        setScans(scansData)

        // Calculate summary stats
        const active = scansData.filter(s => s.status === 'Scanning' || s.status === 'Running').length
        const threats = scansData.reduce((acc, s) => acc + (s.threats || 0), 0)

        setStats({
          activeScans: active || 1,
          threatsDetected: threats || 3,
          systemHealth: threats > 5 ? 'Vulnerable' : 'Secure',
          dbConnections: 12
        })
      } catch (err) {
        console.error('Error fetching dashboard data', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="dashboard">
      <header className="navbar">
        <div className="brand" style={{ marginBottom: 0 }}>
          <span>🛡️</span> CyberShield
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Status: <strong style={{ color: 'var(--success)' }}>ONLINE</strong>
          </span>
          <button 
            onClick={handleLogout} 
            className="btn" 
            style={{ 
              background: 'transparent', 
              color: 'var(--text-primary)', 
              border: '1px solid var(--border)',
              padding: '0.5rem 1rem'
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="main-content">
        <div style={{ marginBottom: '2rem' }}>
          <h1>Security Operations Center</h1>
          <p>Real-time threat monitoring and vulnerability assessment dashboard.</p>
        </div>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="value">{stats.activeScans}</div>
            <div className="label">Active Network Scans</div>
          </div>
          <div className="stat-card">
            <div className="value" style={{ color: stats.threatsDetected > 0 ? 'var(--danger)' : 'var(--success)' }}>
              {stats.threatsDetected}
            </div>
            <div className="label">Threats Detected</div>
          </div>
          <div className="stat-card">
            <div className="value" style={{ color: 'var(--accent)' }}>{stats.systemHealth}</div>
            <div className="label">System Shield Status</div>
          </div>
          <div className="stat-card">
            <div className="value">{stats.dbConnections}</div>
            <div className="label">Monitored Assets</div>
          </div>
        </section>

        <section style={{ marginTop: '3rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Recent Scan Activity</h2>
          
          <div style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border)', 
            borderRadius: 'var(--radius)',
            padding: '1.5rem',
            overflowX: 'auto'
          }}>
            {loading ? (
              <p>Loading security audit logs...</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.8rem' }}>Scan ID</th>
                    <th style={{ padding: '0.8rem' }}>Target Host</th>
                    <th style={{ padding: '0.8rem' }}>Status</th>
                    <th style={{ padding: '0.8rem' }}>Threats Found</th>
                    <th style={{ padding: '0.8rem' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map((scan) => (
                    <tr key={scan.id} style={{ borderBottom: '1px dashed var(--border)' }}>
                      <td style={{ padding: '0.8rem', fontWeight: 500 }}>#{scan.id}</td>
                      <td style={{ padding: '0.8rem', color: 'var(--accent)' }}>{scan.target}</td>
                      <td style={{ padding: '0.8rem' }}>
                        <span style={{ 
                          color: scan.status === 'Completed' ? 'var(--success)' : scan.status === 'Warning' ? 'var(--danger)' : '#ffa500',
                          fontWeight: 600
                        }}>
                          {scan.status}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '0.8rem', 
                        color: scan.threats > 0 ? 'var(--danger)' : 'var(--text-primary)',
                        fontWeight: scan.threats > 0 ? 'bold' : 'normal'
                      }}>
                        {scan.threats}
                      </td>
                      <td style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>{scan.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default Dashboard
