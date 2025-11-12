import { useState } from 'react'
import { Button, Container, Nav, Navbar } from 'react-bootstrap'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { path: '/', label: 'Planner' },
  { path: '/records', label: 'Records' },
  { path: '/contact', label: 'Contact' },
  { path: '/about', label: 'About' },
]

function AppNavbar() {
  const { user, signOut, firebaseReady } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Failed to sign out', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <Navbar bg="light" expand="lg" className="shadow-sm">
      <Container>
        <Navbar.Brand as={NavLink} to="/">
          SafeCommute
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            {navLinks.map((link) => (
              <Nav.Link
                key={link.path}
                as={NavLink}
                to={link.path}
                end={link.path === '/'}
                className="text-capitalize"
              >
                {link.label}
              </Nav.Link>
            ))}
          </Nav>

          <div className="d-flex align-items-center gap-3">
            {!firebaseReady ? (
              <span className="text-muted small">
                Configure Firebase to enable login
              </span>
            ) : user ? (
              <>
                <span className="text-muted small">
                  {user.email ?? 'Signed in'}
                </span>
                <Button
                  size="sm"
                  variant="outline-danger"
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                >
                  {isSigningOut ? 'Signing out…' : 'Sign out'}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                as={NavLink}
                variant="primary"
                to="/login"
              >
                Log in
              </Button>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

export default AppNavbar
