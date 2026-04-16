import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import HomePage from './Pages/homePage'
import LoginPage from './Pages/loginPage'
import { Toaster } from 'react-hot-toast'
import RegisterPage from './Pages/Register/registerPage'

function App() {
  

  return (
    <BrowserRouter>
      <Toaster position='top-right'/>
        <div className='w-full h-screen bg-primary'>
          <Routes>
            <Route path='/*' element={<HomePage />} />
            <Route path='/login' element={<LoginPage />} /> 
            <Route path='/register' element={<RegisterPage />}/>
          </Routes>
        </div>
    </BrowserRouter>
  )
}

export default App
