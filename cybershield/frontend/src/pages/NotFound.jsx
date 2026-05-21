import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="page-center">
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="brand" style={{ justifyContent: 'center' }}>
          <span>🛡️</span> CyberShield
        </div>
        <h1 style={{ fontSize: '3rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>404</h1>
        <h2>Access Denied</h2>
        <p style={{ margin: '1rem 0 2rem 0' }}>
          The requested system log, console path, or sector resource could not be found or you lack sufficient clearance.
        </p>
        <Link to="/" className="btn btn-primary">
          Return to Hub
        </Link>
      </div>
    </div>
  )
}

export default NotFound
