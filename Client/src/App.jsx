import React, { useContext } from 'react'
import HomePage from './pages/HomePage'
import {Routes, Route, Navigate} from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import {Toaster} from "react-hot-toast"
import { AuthConext } from './Context/AuthContext'

const App = () => {
  const {authUser} = useContext(AuthConext);
  return (
    <div className='bg-[url(./assets/chat-app-assets/bgImage.svg)] bg-cover bg-center min-h-screen w-full'>
      <Toaster/>
      <Routes>
        <Route path='/' element={authUser ? <HomePage/> : <Navigate to="/login" />} /> 
        <Route path='/login' element={!authUser?<LoginPage/> : <Navigate to="/" />} />
        <Route path='/profile' element={authUser?<ProfilePage/> : <Navigate to="/login" />} />
      </Routes>
    </div>
  )
}

export default App
