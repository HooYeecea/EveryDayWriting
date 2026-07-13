import { Navigate, useLocation } from 'react-router-dom'

import { Layout } from './components/layout/Layout'

import { AuthRouteTransition, isAuthPath } from './components/auth/AuthRouteTransition'

import { ChangePassword } from './components/views/ChangePassword'

import { useAuth } from './context/AuthContext'

import { APP_ROUTES, DEFAULT_PATH, isAppPath } from './config/routes'

import { getToken } from './storage/tokenStorage'



function AppLoading() {

  return (

    <div className="flex min-h-screen items-center justify-center bg-[#fafafa] text-sm text-neutral-400">

      加载中…

    </div>

  )

}



function App() {

  const location = useLocation()

  const { mustChangePassword, isLoading } = useAuth()



  if (isLoading) {

    return <AppLoading />

  }



  if (mustChangePassword && getToken()) {

    if (location.pathname === '/change-password') {

      return <ChangePassword />

    }

    return <Navigate to="/change-password" replace />

  }



  if (location.pathname === '/change-password') {

    return <Navigate to={DEFAULT_PATH} replace />

  }



  if (location.pathname === '/') {

    return <Navigate to={DEFAULT_PATH} replace />

  }



  if (isAuthPath(location.pathname)) {

    return <AuthRouteTransition />

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

