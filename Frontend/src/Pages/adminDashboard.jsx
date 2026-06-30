import { Routes, Route } from 'react-router-dom';
import Overview from './admin/Overview';
import Users from './admin/Users';
import Doctors from './admin/Doctors';
import Payments from './admin/Payments';
import Diseases from './admin/Diseases';
import Feedback from './admin/Feedback';
import Reports from './admin/Reports';
import Settings from './admin/Settings';

export default function AdminDashboard() {
    return (
        <div className="w-full h-full min-h-screen pb-12">
            <Routes>
                <Route path="/" element={<Overview />} />
                <Route path="/users" element={<Users />} />
                <Route path="/doctors" element={<Doctors />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/diseases" element={<Diseases />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
        </div>
    );
}