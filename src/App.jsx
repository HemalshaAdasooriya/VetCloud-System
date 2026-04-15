import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import HomePage from './Pages/homePage'
import LoginPage from './Pages/loginPage'

function App() {
  

  return (
    <BrowserRouter>
      <div className='w-full h-screen bg-primary'>

        <Routes>
          <Route path='/*' element={<HomePage />} />
          <Route path='/login' element={<LoginPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
