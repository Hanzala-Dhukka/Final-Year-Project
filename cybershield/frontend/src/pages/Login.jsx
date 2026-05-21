import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // In a real setup, this will hit our FastAPI backend endpoint: /api/auth/login
      const response = await axios.post('/api/auth/login', {
        username: email, // FastAPI OAuth2 password flow expects 'username' field
        password: password
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      if (response.data && response.data.access_token) {
        localStorage.setItem('token', response.data.access_token)
        navigate('/dashboard')
      } else {
        setError('Authentication failed. No token received.')
      }
    } catch (err) {
      console.error(err)
      setError(
        err.response?.data?.detail || 
        'Invalid credentials or server is unreachable. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-center">
      <div className="card">
        <div className="brand">
          <span>🛡️</span> CyberShield
        </div>
        
        <h2>Sign In</h2>
        <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Enter your credentials to access the secure dashboard.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email or Username</label>
            <input
              type="text"
              id="email"
              placeholder="admin@cybershield.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Secure Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
