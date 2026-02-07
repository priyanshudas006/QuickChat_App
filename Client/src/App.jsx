import React from 'react'
import HomePage from './pages/HomePage'
import {Routes, Route} from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'

const App = () => {
  return (
    <div className='bg-[url(./assets/chat-app-assets/bgImage.svg)] bg-cover bg-center min-h-screen w-full'>
      <Routes>
        <Route path='/' element={<HomePage/>} /> 
        <Route path='/login' element={<LoginPage/>} />
        <Route path='/profile' element={<ProfilePage/>} />
      </Routes>
    </div>
  )
}

export default App
