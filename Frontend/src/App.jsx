import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import HomePage from './Pages/homePage'
import LoginPage from './Pages/loginPage'
import { Toaster } from 'react-hot-toast'
import RegisterPage from './Pages/registerPage'
import ConsultationPage from './Pages/consultationPage'
import ClinicsPage from './Pages/clinicsPage'
import { DashboardLayout } from './layouts/DashboardLayout'
import DoctorDashboard from './Pages/doctorDashboard'
import FarmerDashboard from './Pages/farmerDashboard'
import AdminDashboard from './Pages/adminDashboard'
import ConsultationRequest from './Pages/ConsultationRequests' //Navindu 2026/05/28 ... consultation
import VetConsultationRequests from './Pages/VetConsultationRequests' //Navindu 2026/06/19 ... vet consultation requests
import Scheduling from './Pages/Scheduling' //Navindu 2026/06/04 ... scheduling
import VetSchedule from './Pages/VetSchedule' //Navindu 2026/06/26 ... vet schedule
import DoctorSchedule from './Pages/doctorSchedule'
import DoctorSettings from './Pages/doctorSettings'
import DoctorConsultations from './Pages/doctorConsultations'
import ForgotPassword from './Pages/ForgotPassword'
import UserAnimals from './Pages/userClinics'
import UserAppoinment from './Pages/userAppoinment'
import UserConsultations from './Pages/userConsultations'
import UserSettings from './Pages/userSettings'

import DiseasesPage from './Pages/diseasesPage'
import MyAnimalsPage from './Pages/myAnimalsPage'
import UserClinics from './Pages/userClinics'
import UserDiseases from './Pages/userDiseases'

function App() {
  

  return (
    <BrowserRouter>
      <Toaster position='top-right'/>
        <div className='w-full h-screen bg-primary'>
          <Routes>
            <Route path='/*' element={<HomePage />} />
            <Route path='/login' element={<LoginPage />} /> 
            <Route path='/register' element={<RegisterPage />}/>
            <Route path='/forgot-password' element={<ForgotPassword />}/>
            <Route path= '/consultation' element={<ConsultationRequest />}/>
            <Route path= '/diseases' element={<DiseasesPage />}/>
            <Route path= '/clinics' element={<ClinicsPage />}/>

            <Route path='/dashboard/*' element={<DashboardLayout />}>
              <Route path='user/*' element={<FarmerDashboard />} />
              <Route path='doctor/*' element={<DoctorDashboard />} />
              <Route path='admin/*' element={<AdminDashboard />} />
            </Route>

            <Route path='/dashboard/doctor/*' element={<DashboardLayout />}>
              <Route path='requests' element={<VetConsultationRequests />} />
              <Route path='consultations' element={<DoctorConsultations />} />
              <Route path='schedule' element={<VetSchedule />} />
              <Route path='settings' element={<DoctorSettings />} />
            </Route>

            <Route path='/dashboard/user/*' element={<DashboardLayout />}>
              <Route path='animals' element={<MyAnimalsPage />} />
              <Route path='appoinment' element={<Scheduling />} />
              <Route path='consultations' element={<UserConsultations />} />
              <Route path='clinics' element={<UserClinics />} />
              <Route path='diseases' element={<UserDiseases />} />
              <Route path='settings' element={<UserSettings />} />
            </Route>
          </Routes>
        </div>
    </BrowserRouter>
  )
}

export default App
