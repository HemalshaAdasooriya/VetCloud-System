import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import HomePage from './Pages/homePage'
import LoginPage from './Pages/loginPage'
import { Toaster } from 'react-hot-toast'
import RegisterPage from './Pages/registerPage'
import ConsultationPage from './Pages/consultationPage'
import ClinicsPage from './Pages/clinicsPage'
import DiseasesPage from './Pages/diseasesPage'

function App() {
  

  return (
    <BrowserRouter>
      <Toaster position='top-right'/>
        <div className='w-full h-screen bg-primary'>
          <Routes>
            <Route path='/*' element={<HomePage />} />
            <Route path='/login' element={<LoginPage />} /> 
            <Route path='/register' element={<RegisterPage />}/>
            <Route path= '/consultation' element={<ConsultationPage />}/>
            <Route path= '/diseases' element={<DiseasesPage />}/>
            <Route path= '/clinics' element={<ClinicsPage />}/>
          </Routes>
        </div>
    </BrowserRouter>
  )
}

export default App
