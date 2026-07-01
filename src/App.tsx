import { Navigate, useLocation } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Login } from './components/views/Login'
import { Register } from './components/views/Register'
import { APP_ROUTES, DEFAULT_PATH, isAppPath } from './config/routes'

function App() {
  const location = useLocation()

  if (location.pathname === '/') {
    return <Navigate to={DEFAULT_PATH} replace />
  }

  if (location.pathname === '/login') {
    return <Login />
  }

  if (location.pathname === '/register') {
    return <Register />
  }

  if (!isAppPath(location.pathname)) {
    return <Navigate to={DEFAULT_PATH} replace />
  }

  return (
    <Layout>
      {APP_ROUTES.map(({ path, key, element }) => (
        <div
          key={key}
          className={`flex min-h-0 flex-1 flex-col overflow-hidden ${
            location.pathname !== path ? 'hidden' : ''
          }`}
        >
          {element}
        </div>
      ))}
    </Layout>
  )
}

export default App
