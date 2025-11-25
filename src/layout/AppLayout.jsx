import { Outlet } from 'react-router-dom'
import AppNavbar from '../components/AppNavbar'

function AppLayout() {
  return (
    <div className="min-vh-100 bg-body-secondary">
      <a
        href="#main-content"
        className="visually-hidden-focusable position-absolute top-0 start-0 m-2 px-3 py-2 bg-white border rounded shadow-sm"
      >
        Skip to main content
      </a>
      <AppNavbar />
      <main id="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
