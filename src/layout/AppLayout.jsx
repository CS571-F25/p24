import { Outlet } from 'react-router-dom'
import AppNavbar from '../components/AppNavbar'

function AppLayout() {
  return (
    <div className="min-vh-100 bg-body-secondary">
      <AppNavbar />
      <Outlet />
    </div>
  )
}

export default AppLayout
