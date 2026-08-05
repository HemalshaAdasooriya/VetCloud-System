// controllers/adminController.js
import db from "../config/db.js";
import bcrypt from "bcryptjs";
import "../models/Disease.js";

// Safe JSON parser helper for DB columns
const safeJsonParse = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'object') return val;
    try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
        if (typeof val === 'string') {
            return val.split(',').map(s => s.trim()).filter(Boolean);
        }
        return [];
    }
};

// Helper to run database queries with Promises
const queryPromise = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

// 1. Overview stats
export const getOverviewStats = async (req, res) => {
    try {
        const [ownersCount] = await queryPromise("SELECT COUNT(*) AS count FROM pet_owners");
        const [vetsCount] = await queryPromise("SELECT COUNT(*) AS count FROM veterinarians");
        const [appointmentsCount] = await queryPromise("SELECT (SELECT COUNT(*) FROM appointments) + (SELECT COUNT(*) FROM consultations) AS count");
        const [revenueSum] = await queryPromise("SELECT (COALESCE((SELECT SUM(fee) FROM consultations), 0) + COALESCE((SELECT SUM(v.consultation_fee) FROM appointments a JOIN veterinarians v ON a.veterinarian_id = v.id WHERE a.payment_status = 'Paid'), 0)) AS sum");
        const [pendingVetsCount] = await queryPromise("SELECT COUNT(*) AS count FROM veterinarians WHERE is_Active = 0");
        
        // Fetch recent registrations
        const recentVets = await queryPromise("SELECT id, fullName, email, specialization, is_Active, 'doctor' as role FROM veterinarians ORDER BY id DESC LIMIT 5");
        const recentOwners = await queryPromise("SELECT id, fullName, email, contact_No, is_Active, 'farmer' as role FROM pet_owners ORDER BY id DESC LIMIT 5");
        
        res.status(200).json({
            stats: {
                totalOwners: ownersCount.count || 0,
                totalVets: vetsCount.count || 0,
                totalAppointments: appointmentsCount.count || 0,
                totalRevenue: parseFloat(revenueSum.sum || 0),
                pendingVets: pendingVetsCount.count || 0
            },
            recentVets,
            recentOwners
        });
    } catch (error) {
        console.error("Error in getOverviewStats:", error);
        res.status(500).json({ message: "Internal server error fetching statistics" });
    }
};

// 2. User Management
export const getUsers = async (req, res) => {
    try {
        const users = await queryPromise(`
            SELECT p.id, p.email, p.fullName, p.contact_No, p.address, 
                   COALESCE(COUNT(a.id), p.numberOfAnimals, 0) AS numberOfAnimals, 
                   p.is_Active, p.image, p.provider 
            FROM pet_owners p
            LEFT JOIN animals a ON p.id = a.owner_id
            GROUP BY p.id, p.email, p.fullName, p.contact_No, p.address, p.numberOfAnimals, p.is_Active, p.image, p.provider
            ORDER BY p.id DESC
        `);
        res.status(200).json(users);
    } catch (error) {
        console.error("Error in getUsers:", error);
        res.status(500).json({ message: "Failed to fetch users" });
    }
};

export const updateUserStatus = async (req, res) => {
    const { id } = req.params;
    const { is_Active } = req.body;
    try {
        await queryPromise("UPDATE pet_owners SET is_Active = ? WHERE id = ?", [is_Active ? 1 : 0, id]);
        
        // Fetch user email to send update
        const userResults = await queryPromise("SELECT email, fullName FROM pet_owners WHERE id = ?", [id]);
        if (userResults && userResults.length > 0) {
            const user = userResults[0];
            import("../config/email.js").then(({ sendEmail }) => {
                sendEmail({
                    to: user.email,
                    subject: "Account Status Update - VetCloud",
                    html: `<h3>Account Status Updated</h3><p>Dear ${user.fullName},</p><p>Your VetCloud account has been marked as <strong>${is_Active ? "Active" : "Inactive"}</strong> by the administrator.</p>`,
                    text: `Dear ${user.fullName}, your VetCloud account status has been updated to ${is_Active ? "Active" : "Inactive"}.`
                }).catch(console.error);
            });
        }

        res.status(200).json({ message: "User status updated successfully" });
    } catch (error) {
        console.error("Error in updateUserStatus:", error);
        res.status(500).json({ message: "Failed to update user status" });
    }
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        // Clean up child tables to satisfy foreign key constraints
        await queryPromise("DELETE FROM appointment_slots WHERE appointment_id IN (SELECT id FROM appointments WHERE pet_owner_id = ?)", [id]);
        await queryPromise("DELETE FROM appointments WHERE pet_owner_id = ?", [id]);
        await queryPromise("DELETE FROM consultations WHERE owner_id = ?", [id]);
        await queryPromise("DELETE FROM pet_owner_profiles WHERE owner_id = ?", [id]);
        await queryPromise("DELETE FROM feedbacks WHERE pet_owner_id = ?", [id]);
        await queryPromise("DELETE FROM user_sessions WHERE user_id = ? AND user_role IN ('farmer', 'Farmer/PetOwner')", [id]);
        await queryPromise("DELETE FROM notifications WHERE user_id = ? AND user_role IN ('farmer', 'Farmer/PetOwner')", [id]);
        await queryPromise("DELETE FROM animals WHERE owner_id = ?", [id]);
        await queryPromise("DELETE FROM pet_owners WHERE id = ?", [id]);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error in deleteUser:", error);
        res.status(500).json({ message: "Failed to delete user" });
    }
};

// 3. Doctor Management
export const getDoctors = async (req, res) => {
    try {
        const doctors = await queryPromise(`
            SELECT v.id, v.email, v.fullName, v.contact_No, v.license_number, v.specialization, 
                   v.years_of_experience, v.consultation_fee, v.is_Active, v.image,
                   vp.bio, vp.professional_title,
                   COALESCE(vpm.bank_name, vbd.bank_name) AS bank_name,
                   COALESCE(vpm.account_number, vbd.account_number) AS account_number,
                   COALESCE(vpm.account_name, vbd.account_name) AS account_name
            FROM veterinarians v 
            LEFT JOIN veterinarian_profiles vp ON v.id = vp.vet_id
            LEFT JOIN veterinarian_payment_methods vpm ON v.id = vpm.vet_id
            LEFT JOIN veterinarian_bank_details vbd ON v.id = vbd.vet_id
            GROUP BY v.id, v.email, v.fullName, v.contact_No, v.license_number, v.specialization, 
                     v.years_of_experience, v.consultation_fee, v.is_Active, v.image,
                     vp.bio, vp.professional_title, vpm.bank_name, vbd.bank_name, vpm.account_number, vbd.account_number, vpm.account_name, vbd.account_name
            ORDER BY v.id DESC
        `);
        res.status(200).json(doctors);
    } catch (error) {
        console.error("Error in getDoctors:", error);
        res.status(500).json({ message: "Failed to fetch doctors" });
    }
};

export const updateDoctorStatus = async (req, res) => {
    const { id } = req.params;
    const { is_Active } = req.body;
    try {
        await queryPromise("UPDATE veterinarians SET is_Active = ? WHERE id = ?", [is_Active ? 1 : 0, id]);
        
        // Fetch doctor email to send update
        const doctorResults = await queryPromise("SELECT email, fullName FROM veterinarians WHERE id = ?", [id]);
        if (doctorResults && doctorResults.length > 0) {
            const vet = doctorResults[0];
            import("../config/email.js").then(({ sendEmail }) => {
                sendEmail({
                    to: vet.email,
                    subject: "Account Approval Status Update - VetCloud",
                    html: `<h3>Account Approval Status Updated</h3><p>Dear Dr. ${vet.fullName},</p><p>Your veterinarian account status has been updated to <strong>${is_Active ? "Active / Approved" : "Inactive / Under Review"}</strong> by the administrator.</p>`,
                    text: `Dear Dr. ${vet.fullName}, your veterinarian account approval status has been updated to ${is_Active ? "Active" : "Inactive"}.`
                }).catch(console.error);
            });
        }

        res.status(200).json({ message: "Doctor status updated successfully" });
    } catch (error) {
        console.error("Error in updateDoctorStatus:", error);
        res.status(500).json({ message: "Failed to update doctor status" });
    }
};

export const deleteDoctor = async (req, res) => {
    const { id } = req.params;
    try {
        // Clean up child tables to satisfy foreign key constraints
        await queryPromise("DELETE FROM veterinarian_profiles WHERE vet_id = ?", [id]);
        await queryPromise("DELETE FROM clinics WHERE veterinarian_id = ?", [id]);
        await queryPromise("DELETE FROM veterinarian_bank_details WHERE vet_id = ?", [id]);
        await queryPromise("DELETE FROM veterinarian_payment_methods WHERE vet_id = ?", [id]);
        await queryPromise("DELETE FROM vet_schedule WHERE veterinarian_id = ?", [id]);
        await queryPromise("DELETE FROM payouts WHERE veterinarian_id = ?", [id]);
        await queryPromise("DELETE FROM feedbacks WHERE veterinarian_id = ?", [id]);
        await queryPromise("DELETE FROM appointment_slots WHERE appointment_id IN (SELECT id FROM appointments WHERE veterinarian_id = ?)", [id]);
        await queryPromise("DELETE FROM appointments WHERE veterinarian_id = ?", [id]);
        await queryPromise("DELETE FROM consultations WHERE doctor_id = ?", [id]);
        await queryPromise("DELETE FROM user_sessions WHERE user_id = ? AND user_role IN ('doctor', 'Veterinary Doctor')", [id]);
        await queryPromise("DELETE FROM notifications WHERE user_id = ? AND user_role IN ('doctor', 'Veterinary Doctor')", [id]);
        await queryPromise("DELETE FROM veterinarians WHERE id = ?", [id]);
        res.status(200).json({ message: "Doctor deleted successfully" });
    } catch (error) {
        console.error("Error in deleteDoctor:", error);
        res.status(500).json({ message: "Failed to delete doctor" });
    }
};

// 4. Payments & Payouts
export const getPayments = async (req, res) => {
    try {
        const transactions = await queryPromise(`
            SELECT c.id, c.appointment_date, c.appointment_time, c.consultation_type, c.fee, c.status, 
                   COALESCE(p.fullName, 'Unknown Owner') AS ownerName, 
                   COALESCE(v.fullName, 'Unknown Vet') AS vetName 
            FROM consultations c 
            LEFT JOIN pet_owners p ON c.owner_id = p.id 
            LEFT JOIN veterinarians v ON c.doctor_id = v.id 
            ORDER BY c.id DESC
        `);

        const payouts = await queryPromise(`
            SELECT p.id, p.amount, p.status, p.payout_date, p.bank_name, p.account_number, p.created_at, 
                   COALESCE(v.fullName, 'Unknown Vet') AS vetName, 
                   COALESCE(v.email, 'N/A') AS vetEmail 
            FROM payouts p 
            LEFT JOIN veterinarians v ON p.veterinarian_id = v.id 
            ORDER BY p.id DESC
        `);

        const stats = await queryPromise(`
            SELECT 
                (SELECT SUM(fee) FROM consultations) AS totalFees,
                (SELECT SUM(amount) FROM payouts WHERE status = 'Paid') AS totalPaidPayouts,
                (SELECT SUM(amount) FROM payouts WHERE status = 'Pending') AS totalPendingPayouts
        `);

        res.status(200).json({
            transactions,
            payouts,
            summary: {
                totalFees: parseFloat(stats[0].totalFees || 0),
                totalPaidPayouts: parseFloat(stats[0].totalPaidPayouts || 0),
                totalPendingPayouts: parseFloat(stats[0].totalPendingPayouts || 0)
            }
        });
    } catch (error) {
        console.error("Error in getPayments:", error);
        res.status(500).json({ message: "Failed to fetch payments data" });
    }
};

export const deleteTransaction = async (req, res) => {
    const { id } = req.params;
    try {
        await queryPromise("DELETE FROM consultations WHERE id = ?", [id]);
        res.status(200).json({ message: "Consultation transaction record deleted successfully" });
    } catch (error) {
        console.error("Error in deleteTransaction:", error);
        res.status(500).json({ message: "Failed to delete transaction record" });
    }
};

export const createPayout = async (req, res) => {
    const { veterinarian_id, amount, bank_name, account_number } = req.body;
    
    if (!veterinarian_id || !amount) {
        return res.status(400).json({ message: "Veterinarian ID and amount are required." });
    }

    try {
        await queryPromise(`
            INSERT INTO payouts (veterinarian_id, amount, status, payout_date, bank_name, account_number) 
            VALUES (?, ?, 'Paid', NOW(), ?, ?)
        `, [veterinarian_id, amount, bank_name || "Manual Release", account_number || "N/A"]);
        res.status(201).json({ message: "Payout recorded and released successfully." });
    } catch (error) {
        console.error("Error in createPayout:", error);
        res.status(500).json({ message: "Failed to record payout" });
    }
};

// 5. Disease Management
export const getDiseases = async (req, res) => {
    try {
        const diseases = await queryPromise("SELECT * FROM diseases ORDER BY id DESC");
        // Parse JSON fields
        const parsedDiseases = diseases.map(d => ({
            ...d,
            species: safeJsonParse(d.species),
            clinicalSigns: safeJsonParse(d.clinicalSigns),
            preventionSteps: safeJsonParse(d.preventionSteps),
            treatmentSteps: safeJsonParse(d.treatmentSteps)
        }));
        res.status(200).json(parsedDiseases);
    } catch (error) {
        console.error("Error in getDiseases:", error);
        res.status(500).json({ message: "Failed to fetch diseases" });
    }
};

export const createDisease = async (req, res) => {
    const data = req.body;
    if (!data.name || !data.slug) {
        return res.status(400).json({ message: "Disease name and slug are required." });
    }

    try {
        const species = JSON.stringify(data.species || []);
        const clinicalSigns = JSON.stringify(data.clinicalSigns || []);
        const preventionSteps = JSON.stringify(data.preventionSteps || []);
        const treatmentSteps = JSON.stringify(data.treatmentSteps || []);

        await queryPromise(`
            INSERT INTO diseases (slug, name, species, category, risk, image, symptoms, prevention, treatment, description, transmission, incubation, clinicalSigns, preventionSteps, treatmentSteps, emergencyProtocol)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            data.slug, data.name, species, data.category || "General", data.risk || "Medium Risk", data.image || "/default.jpg",
            data.symptoms || "", data.prevention || "", data.treatment || "", data.description || "", data.transmission || "",
            data.incubation || "", clinicalSigns, preventionSteps, treatmentSteps, data.emergencyProtocol || ""
        ]);
        res.status(201).json({ message: "Disease created successfully!" });
    } catch (error) {
        console.error("Error in createDisease:", error);
        res.status(500).json({ message: "Failed to create disease" });
    }
};

export const updateDisease = async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    if (!data.name || !data.slug) {
        return res.status(400).json({ message: "Disease name and slug are required." });
    }

    try {
        const species = JSON.stringify(data.species || []);
        const clinicalSigns = JSON.stringify(data.clinicalSigns || []);
        const preventionSteps = JSON.stringify(data.preventionSteps || []);
        const treatmentSteps = JSON.stringify(data.treatmentSteps || []);

        await queryPromise(`
            UPDATE diseases 
            SET slug=?, name=?, species=?, category=?, risk=?, image=?, symptoms=?, prevention=?, treatment=?, description=?, transmission=?, incubation=?, clinicalSigns=?, preventionSteps=?, treatmentSteps=?, emergencyProtocol=? 
            WHERE id=?
        `, [
            data.slug, data.name, species, data.category, data.risk, data.image,
            data.symptoms, data.prevention, data.treatment, data.description, data.transmission,
            data.incubation, clinicalSigns, preventionSteps, treatmentSteps, data.emergencyProtocol,
            id
        ]);
        res.status(200).json({ message: "Disease updated successfully!" });
    } catch (error) {
        console.error("Error in updateDisease:", error);
        res.status(500).json({ message: "Failed to update disease" });
    }
};

export const deleteDisease = async (req, res) => {
    const { id } = req.params;
    try {
        await queryPromise("DELETE FROM diseases WHERE id = ?", [id]);
        res.status(200).json({ message: "Disease deleted successfully!" });
    } catch (error) {
        console.error("Error in deleteDisease:", error);
        res.status(500).json({ message: "Failed to delete disease" });
    }
};

// 6. Feedback & Ratings
export const getFeedback = async (req, res) => {
    try {
        const feedback = await queryPromise(`
            SELECT f.id, f.rating, f.comment, f.created_at, f.show_on_homepage,
                   COALESCE(p.fullName, 'Anonymous Owner') AS ownerName, 
                   v.fullName AS vetName 
            FROM feedbacks f 
            LEFT JOIN pet_owners p ON f.pet_owner_id = p.id 
            LEFT JOIN veterinarians v ON f.veterinarian_id = v.id 
            ORDER BY f.id DESC
        `);
        res.status(200).json(feedback);
    } catch (error) {
        console.error("Error in getFeedback:", error);
        res.status(500).json({ message: "Failed to fetch feedback" });
    }
};

export const deleteFeedback = async (req, res) => {
    const { id } = req.params;
    try {
        await queryPromise("DELETE FROM feedbacks WHERE id = ?", [id]);
        res.status(200).json({ message: "Feedback deleted successfully" });
    } catch (error) {
        console.error("Error in deleteFeedback:", error);
        res.status(500).json({ message: "Failed to delete feedback" });
    }
};

export const toggleFeedbackHomepage = async (req, res) => {
    const { id } = req.params;
    const { showOnHomepage } = req.body;
    try {
        await queryPromise("UPDATE feedbacks SET show_on_homepage = ? WHERE id = ?", [showOnHomepage ? 1 : 0, id]);
        res.status(200).json({ message: "Feedback homepage visibility updated successfully" });
    } catch (error) {
        console.error("Error in toggleFeedbackHomepage:", error);
        res.status(500).json({ message: "Failed to update feedback visibility" });
    }
};

// 7. Reports & Analytics
export const getReports = async (req, res) => {
    try {
        // 1. User Signup & Consultation Growth (last 6 months real data)
        const ownerGrowth = await queryPromise(`
            SELECT month, SUM(cnt) AS count FROM (
                SELECT DATE_FORMAT(created_at, '%b %Y') AS month, DATE_FORMAT(created_at, '%Y-%m') AS ym, COUNT(*) AS cnt FROM appointments WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH) GROUP BY ym, month
                UNION ALL
                SELECT DATE_FORMAT(created_at, '%b %Y') AS month, DATE_FORMAT(created_at, '%Y-%m') AS ym, COUNT(*) AS cnt FROM consultations WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH) GROUP BY ym, month
            ) combined
            GROUP BY ym, month
            ORDER BY ym ASC
        `);

        // 2. Consultations by status
        const consultationStats = await queryPromise(`
            SELECT status, COUNT(*) AS count, COALESCE(SUM(fee), 0) AS totalFee
            FROM consultations
            GROUP BY status
        `);

        // 3. Specialty distribution
        const specialtyStats = await queryPromise(`
            SELECT specialization, COUNT(*) AS count
            FROM veterinarians
            GROUP BY specialization
            ORDER BY count DESC
        `);

        // 4. Financial Summary
        const [grossRevenue] = await queryPromise(`SELECT (COALESCE((SELECT SUM(fee) FROM consultations), 0) + COALESCE((SELECT SUM(v.consultation_fee) FROM appointments a JOIN veterinarians v ON a.veterinarian_id = v.id WHERE a.payment_status = 'Paid'), 0)) AS total`);
        const [paidPayouts] = await queryPromise(`SELECT COALESCE(SUM(amount), 0) AS total FROM payouts WHERE status = 'Paid'`);
        const [pendingPayouts] = await queryPromise(`SELECT COALESCE(SUM(amount), 0) AS total FROM payouts WHERE status = 'Pending'`);
        const [totalConsultationsCount] = await queryPromise(`SELECT ((SELECT COUNT(*) FROM consultations) + (SELECT COUNT(*) FROM appointments)) AS count`);

        const financialSummary = {
            grossRevenue: parseFloat(grossRevenue.total || 0),
            paidPayouts: parseFloat(paidPayouts.total || 0),
            pendingPayouts: parseFloat(pendingPayouts.total || 0),
            totalConsultations: totalConsultationsCount.count || 0
        };

        // 5. Veterinarian Performance Metrics
        const vetPerformance = await queryPromise(`
            SELECT 
                v.id, 
                v.fullName, 
                v.specialization, 
                v.consultation_fee,
                (COUNT(DISTINCT c.id) + COUNT(DISTINCT a.id)) AS totalConsultations, 
                (COALESCE(SUM(c.fee), 0) + COALESCE(SUM(CASE WHEN a.payment_status = 'Paid' THEN v.consultation_fee ELSE 0 END), 0)) AS totalRevenue,
                COALESCE(AVG(f.rating), 5.0) AS avgRating
            FROM veterinarians v
            LEFT JOIN consultations c ON v.id = c.doctor_id
            LEFT JOIN appointments a ON v.id = a.veterinarian_id
            LEFT JOIN feedbacks f ON v.id = f.veterinarian_id
            GROUP BY v.id, v.fullName, v.specialization, v.consultation_fee
            ORDER BY totalConsultations DESC, totalRevenue DESC
            LIMIT 10
        `);

        // 6. Patient / Animal Species & Clinical Stats
        const speciesStats = await queryPromise(`
            SELECT species, COUNT(*) AS count
            FROM animals
            GROUP BY species
            ORDER BY count DESC
        `);

        const [totalAnimals] = await queryPromise(`SELECT COUNT(*) AS count FROM animals`);
        const [totalMedicalRecords] = await queryPromise(`SELECT COUNT(*) AS count FROM animal_medical_histories`);

        const patientStats = {
            totalAnimals: totalAnimals.count || 0,
            totalMedicalRecords: totalMedicalRecords.count || 0,
            speciesStats
        };

        // 7. Recent Financial Audit Logs / Transactions
        const recentTransactions = await queryPromise(`
            SELECT * FROM (
                SELECT 
                    c.id, 
                    'Consultation Fee' AS type, 
                    c.fee AS amount, 
                    c.status, 
                    c.consultation_type AS mode,
                    c.created_at AS date,
                    v.fullName AS doctorName,
                    p.fullName AS ownerName
                FROM consultations c
                LEFT JOIN veterinarians v ON c.doctor_id = v.id
                LEFT JOIN pet_owners p ON c.owner_id = p.id
                UNION ALL
                SELECT 
                    a.id,
                    'Appointment Fee' AS type,
                    v.consultation_fee AS amount,
                    a.status,
                    a.consultation_type AS mode,
                    a.created_at AS date,
                    v.fullName AS doctorName,
                    p.fullName AS ownerName
                FROM appointments a
                LEFT JOIN veterinarians v ON a.veterinarian_id = v.id
                LEFT JOIN pet_owners p ON a.pet_owner_id = p.id
            ) combined_tx
            ORDER BY date DESC
            LIMIT 20
        `);

        res.status(200).json({
            ownerGrowth,
            consultationStats,
            specialtyStats,
            financialSummary,
            vetPerformance,
            patientStats,
            recentTransactions
        });
    } catch (error) {
        console.error("Error in getReports:", error);
        res.status(500).json({ message: "Failed to generate reports" });
    }
};

// 8. Admin Settings / Profile
export const updateAdminProfile = async (req, res) => {
    const { fullName, contact_No, email, password } = req.body;
    const adminId = req.user.id; // set by authenticate token middleware

    if (!fullName || !email) {
        return res.status(400).json({ message: "Name and Email are required." });
    }

    try {
        let sql = "UPDATE admins SET fullName = ?, contact_No = ?, email = ?";
        let params = [fullName, contact_No || null, email];

        if (password && password.trim() !== "") {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
            if (!passwordRegex.test(password)) {
                return res.status(400).json({ 
                    message: "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character/symbol." 
                });
            }
            const hashedPassword = bcrypt.hashSync(password, 11);
            sql += ", password = ?";
            params.push(hashedPassword);
        }

        sql += " WHERE id = ?";
        params.push(adminId);

        await queryPromise(sql, params);

        // Fetch fresh info
        const freshAdmin = await queryPromise("SELECT id, email, fullName, contact_No, image FROM admins WHERE id = ?", [adminId]);
        res.status(200).json({ message: "Profile updated successfully!", user: freshAdmin[0] });
    } catch (error) {
        console.error("Error in updateAdminProfile:", error);
        res.status(500).json({ message: "Failed to update admin profile" });
    }
};

// 9. System Settings (Commission, etc.)
export const getSystemSettings = async (req, res) => {
    try {
        const settings = await queryPromise("SELECT * FROM system_settings");
        const settingsObj = {};
        settings.forEach(s => {
            settingsObj[s.setting_key] = s.setting_value;
        });
        if (!settingsObj.commission_percentage) {
            settingsObj.commission_percentage = "10";
        }
        res.status(200).json(settingsObj);
    } catch (error) {
        console.error("Error in getSystemSettings:", error);
        res.status(500).json({ message: "Failed to fetch system settings" });
    }
};

export const updateSystemSettings = async (req, res) => {
    const { commission_percentage } = req.body;
    if (commission_percentage === undefined || commission_percentage === null) {
        return res.status(400).json({ message: "commission_percentage is required" });
    }
    
    try {
        const sql = `
            INSERT INTO system_settings (setting_key, setting_value) 
            VALUES ('commission_percentage', ?)
            ON DUPLICATE KEY UPDATE setting_value = ?
        `;
        await queryPromise(sql, [String(commission_percentage), String(commission_percentage)]);
        res.status(200).json({ message: "System settings updated successfully!" });
    } catch (error) {
        console.error("Error in updateSystemSettings:", error);
        res.status(500).json({ message: "Failed to update system settings" });
    }
};

export const addFeedback = async (req, res) => {
    const { petOwnerId, veterinarianId, rating, comment } = req.body;
    if (!petOwnerId || !rating) {
        return res.status(400).json({ message: "Pet Owner ID and Rating are required" });
    }
    try {
        const result = await queryPromise(`
            INSERT INTO feedbacks (pet_owner_id, veterinarian_id, rating, comment)
            VALUES (?, ?, ?, ?)
        `, [petOwnerId, veterinarianId || null, rating, comment || null]);
        
        res.status(201).json({ message: "Feedback added successfully", feedbackId: result.insertId });
    } catch (error) {
        console.error("Error in addFeedback:", error);
        res.status(500).json({ message: "Failed to add feedback" });
    }
};
