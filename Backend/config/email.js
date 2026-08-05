import nodemailer from "nodemailer";
import dns from "dns";

// Force Node.js to resolve IPv4 first (fixes Railway IPv6 ENETUNREACH & Connection Timeout errors)
try {
    dns.setDefaultResultOrder("ipv4first");
} catch {
    // Ignore if not supported in older Node versions
}

const getFrontendUrl = () => {
    const rawUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || process.env.VERCEL_URL || "http://localhost:5173";
    let url = rawUrl.trim().replace(/\/+$/, '');
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
    }
    return url;
};

// Helper to send email with robust fallbacks
export const sendEmail = async ({ to, subject, html, text }) => {
    const rawUser = process.env.EMAIL_USER || process.env.SMTP_USER || process.env.GMAIL_USER || process.env.MAIL_USER || "";
    const rawPass = process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.MAIL_PASS || "";

    const emailUser = rawUser.trim().replace(/^["']|["']$/g, '');
    const emailPass = rawPass.trim().replace(/\s+/g, '').replace(/^["']|["']$/g, '');

    if (!emailUser || !emailPass) {
        console.log("=========================================");
        console.log(`[EMAIL SIMULATION] TO: ${to}`);
        console.log(`[EMAIL SIMULATION] SUBJECT: ${subject}`);
        console.log(`[EMAIL SIMULATION] TEXT: ${text}`);
        console.log("=========================================");
        return { message: "Email simulation successful (credentials not set)" };
    }

    try {
        const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com";
        const customPort = process.env.EMAIL_PORT || process.env.SMTP_PORT;
        const port = customPort ? parseInt(customPort, 10) : 465;
        const secure = process.env.EMAIL_SECURE !== undefined 
            ? process.env.EMAIL_SECURE === "true" 
            : (port === 465);

        const transporterConfig = {
            host,
            port,
            secure,
            family: 4, // CRITICAL FOR RAILWAY: Force IPv4 connection to prevent ENETUNREACH on IPv6
            auth: {
                user: emailUser,
                pass: emailPass
            },
            tls: {
                rejectUnauthorized: false,
                servername: host
            },
            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 15000
        };

        if (host.includes("gmail") && !process.env.EMAIL_HOST && !process.env.SMTP_HOST) {
            transporterConfig.service = "gmail";
        }

        const transporter = nodemailer.createTransport(transporterConfig);

        const info = await transporter.sendMail({
            from: `"VetCloud Notifications" <${emailUser}>`,
            to,
            subject,
            text: text || "New notification from VetCloud",
            html
        });
        console.log(`[EMAIL SUCCESS] Email sent to ${to}: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`[EMAIL SMTP ERROR] Failed to send email to ${to}:`, error.message || error);

        // Fallback retry using port 587 STARTTLS if port 465 SSL failed on cloud host
        if (error.message && (error.message.includes("ENETUNREACH") || error.message.includes("timeout") || error.message.includes("connect"))) {
            try {
                console.log(`[EMAIL RETRY] Attempting IPv4 fallback transport on port 587 to ${to}...`);
                const fallbackTransporter = nodemailer.createTransport({
                    host: "smtp.gmail.com",
                    port: 587,
                    secure: false,
                    family: 4,
                    auth: {
                        user: emailUser,
                        pass: emailPass
                    },
                    tls: {
                        rejectUnauthorized: false,
                        servername: "smtp.gmail.com"
                    },
                    connectionTimeout: 15000,
                    greetingTimeout: 15000,
                    socketTimeout: 15000
                });
                const fallbackInfo = await fallbackTransporter.sendMail({
                    from: `"VetCloud Notifications" <${emailUser}>`,
                    to,
                    subject,
                    text: text || "New notification from VetCloud",
                    html
                });
                console.log(`[EMAIL SUCCESS - FALLBACK] Email sent to ${to}: ${fallbackInfo.messageId}`);
                return fallbackInfo;
            } catch (retryErr) {
                console.error(`[EMAIL RETRY ERROR] Fallback transport also failed:`, retryErr.message || retryErr);
            }
        }

        console.log("=========================================");
        console.log(`[EMAIL FALLBACK SIMULATION] TO: ${to}`);
        console.log(`[EMAIL FALLBACK SIMULATION] SUBJECT: ${subject}`);
        console.log(`[EMAIL FALLBACK SIMULATION] TEXT: ${text}`);
        console.log("=========================================");
        return { message: "Email fallback simulation completed", error: error.message };
    }
};

// HTML Email Layout Generator
const wrapTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 1px border #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .body { padding: 40px 30px; line-height: 1.6; }
        .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-t: 1px solid #e2e8f0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
        .details-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .details-item { margin-bottom: 10px; display: flex; justify-content: space-between; }
        .details-label { font-weight: 600; color: #64748b; }
        .details-value { font-weight: 500; color: #0f172a; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
        </div>
        <div class="body">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; 2026 VetCloud. All rights reserved.</p>
            <p>Providing state-of-the-art care for your pets & livestock.</p>
        </div>
    </div>
</body>
</html>
`;

// Helper to safely extract plain text notes from reason field
const parseReasonNotes = (reason) => {
    if (!reason) return "";
    if (typeof reason === "object") return reason.notes || "";
    try {
        const parsed = JSON.parse(reason);
        if (parsed && typeof parsed === "object") {
            return parsed.notes || "";
        }
    } catch {
        // Plain string
    }
    return String(reason);
};

// 1. Appointment Confirmation Email Template
export const getAppointmentConfirmationTemplate = (ownerName, animalName, vetName, date, time, type, reason) => {
    let formattedDate = "";
    try {
        const dateObj = date ? new Date(date) : new Date();
        formattedDate = isNaN(dateObj.getTime()) ? String(date || "") : dateObj.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        formattedDate = String(date || "");
    }
    const safeType = (type || 'General').toUpperCase();
    const cleanReason = parseReasonNotes(reason);

    const content = `
        <p>Dear ${ownerName || 'Valued Client'},</p>
        <p>Your appointment booking has been <strong>successfully confirmed</strong>! Here are the details of your upcoming consultation:</p>
        
        <div class="details-box">
            <div class="details-item">
                <span class="details-label">Patient:</span>
                <span class="details-value">${animalName || 'Patient'}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Veterinarian:</span>
                <span class="details-value">${vetName || 'Veterinarian'}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Date:</span>
                <span class="details-value">${formattedDate}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Time:</span>
                <span class="details-value">${time || 'Scheduled Time'}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Consultation Type:</span>
                <span class="details-value">${safeType}</span>
            </div>
            ${cleanReason ? `
            <div class="details-item">
                <span class="details-label">Reason:</span>
                <span class="details-value">${cleanReason}</span>
            </div>
            ` : ""}
        </div>

        <p>If you need to reschedule or cancel this consultation, please manage it from your VetCloud Dashboard.</p>
        <p>Thank you for choosing VetCloud.</p>
    `;
    return wrapTemplate("Appointment Confirmed", content);
};

// 2. Vaccination Schedule Email Template
export const getVaccinationReminderTemplate = (ownerName, animalName, vaccineName, dueDate) => {
    const formattedDate = new Date(dueDate).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const content = `
        <p>Dear ${ownerName},</p>
        <p>This is a reminder that a vaccination is **due soon** for your animal, **${animalName}**:</p>
        
        <div class="details-box">
            <div class="details-item">
                <span class="details-label">Animal:</span>
                <span class="details-value">${animalName}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Vaccination:</span>
                <span class="details-value">${vaccineName}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Due Date:</span>
                <span class="details-value">${formattedDate}</span>
            </div>
        </div>

        <p>Keeping up with vaccinations is vital to ensure long-term health and prevent contagious diseases in your household or flock.</p>
        <p>Please log in to your dashboard to request a consultation with a vet to administer this vaccine.</p>
        <a href="${getFrontendUrl()}/dashboard/user/appoinment" class="button">Schedule Consultation</a>
    `;
    return wrapTemplate("Vaccination Schedule Reminder", content);
};

// 3. Medical Report / Test Result Email Template
export const getMedicalReportTemplate = (ownerName, animalName, reportTitle, reportType, notes, vetName, date) => {
    const content = `
        <p>Dear ${ownerName},</p>
        <p>A new clinical report or test result has been uploaded to **${animalName}**'s medical history file:</p>
        
        <div class="details-box">
            <div class="details-item">
                <span class="details-label">Animal:</span>
                <span class="details-value">${animalName}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Record Type:</span>
                <span class="details-value">${reportType}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Report Title:</span>
                <span class="details-value">${reportTitle}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Diagnosing Vet:</span>
                <span class="details-value">${vetName}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Date:</span>
                <span class="details-value">${date}</span>
            </div>
        </div>

        <div class="details-box" style="background-color: #f1f5f9;">
            <strong style="display:block; margin-bottom: 5px; color: #334155;">Clinical Notes:</strong>
            <p style="margin:0; font-size: 14px; color: #475569;">${notes || "No additional notes provided."}</p>
        </div>

        <p>You can view the full record and details in the "My Animals" section of your dashboard.</p>
        <a href="${getFrontendUrl()}/dashboard/user/animals" class="button">View Medical Records</a>
    `;
    return wrapTemplate("Medical Report Delivered", content);
};

// 4. Invoice / Payment Receipt Template
export const getInvoiceTemplate = (ownerName, amount, orderId, date, animalName, vetName) => {
    const content = `
        <p>Dear ${ownerName},</p>
        <p>Thank you for your payment. Your transaction was successful. Here is your digital invoice receipt:</p>
        
        <div class="details-box">
            <div class="details-item">
                <span class="details-label">Transaction ID:</span>
                <span class="details-value">#${orderId}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Date:</span>
                <span class="details-value">${date}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Consultation For:</span>
                <span class="details-value">${animalName || "Pet Consultation"}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Veterinarian:</span>
                <span class="details-value">${vetName || "VetCloud Professional"}</span>
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;">
            <div class="details-item" style="font-size: 18px;">
                <span class="details-label" style="color: #0f172a;">Amount Paid:</span>
                <span class="details-value" style="color: #10b981; font-weight: 700;">LKR ${parseFloat(amount).toFixed(2)}</span>
            </div>
        </div>

        <p>This invoice has been recorded in your billing history. If you have any payment disputes or billing questions, please contact VetCloud support.</p>
    `;
    return wrapTemplate("Payment Receipt / Invoice", content);
};

// 5. Account Verification Email Template
export const getAccountVerificationTemplate = (ownerName, email) => {
    const verificationUrl = `${getFrontendUrl()}/dashboard/user/settings?verifyEmail=${encodeURIComponent(email)}`;
    const content = `
        <p>Welcome to VetCloud, ${ownerName}!</p>
        <p>Thank you for registering on our platform. To finalize your account setup and enable all dashboard features, please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify My Account</a>
        </div>

        <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; font-size: 13px; color: #64748b;">${verificationUrl}</p>
        
        <p>If you did not create a VetCloud account, you can safely ignore this email.</p>
    `;
    return wrapTemplate("Verify Your Account", content);
};

// 6. Password Reset Link / OTP Template
export const getPasswordResetTemplate = (ownerName, otp) => {
    const content = `
        <p>Dear ${ownerName || "User"},</p>
        <p>We received a request to reset your VetCloud account password.</p>
        <p>Please use the following 6-digit One-Time Password (OTP) to proceed with resetting your password. This OTP is valid for **10 minutes**.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 5px; color: #059669; background-color: #ecfdf5; border: 2px dashed #34d399; padding: 10px 20px; border-radius: 12px; display: inline-block;">
                ${otp}
            </span>
        </div>

        <p>If you did not initiate this request, someone else may be trying to access your account. We recommend securing your email and account credentials.</p>
    `;
    return wrapTemplate("Password Reset OTP", content);
};

// 7. Veterinarian Daily Schedule Template
export const getDailyAppointmentScheduleTemplate = (vetName, appointments) => {
    let rowsHtml = "";
    if (appointments.length === 0) {
        rowsHtml = `<tr><td colspan="4" style="padding: 12px; text-align: center; color: #64748b;">No appointments scheduled for today.</td></tr>`;
    } else {
        appointments.forEach(apt => {
            rowsHtml += `
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${apt.slot_time}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600;">${apt.owner_name}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${apt.animal_name} (${apt.animal_species})</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-transform: uppercase;">${apt.consultation_type}</td>
                </tr>
            `;
        });
    }

    const content = `
        <p>Dear Dr. ${vetName},</p>
        <p>Here is your daily appointment schedule for today, **${new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}**:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #e2e8f0; text-align: left;">
            <thead>
                <tr style="background-color: #f8fafc;">
                    <th style="padding: 12px; border-bottom: 2px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Time</th>
                    <th style="padding: 12px; border-bottom: 2px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Pet Owner</th>
                    <th style="padding: 12px; border-bottom: 2px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Animal</th>
                    <th style="padding: 12px; border-bottom: 2px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Type</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>

        <p>Please log in to your VetCloud Dashboard to manage these appointments and start calls on time.</p>
        <a href="${getFrontendUrl()}/dashboard/doctor/schedule" class="button">View My Schedule</a>
    `;
    return wrapTemplate("Daily Appointment Schedule", content);
};

// 8. Veterinarian Monthly Performance Report Template
export const getMonthlyPerformanceReportTemplate = (vetName, stats) => {
    const content = `
        <p>Dear Dr. ${vetName},</p>
        <p>Your Monthly Performance Report for the past month is ready:</p>
        
        <div class="details-box">
            <div class="details-item">
                <span class="details-label">Total Completed Consultations:</span>
                <span class="details-value">${stats.completedCount || 0}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Consultation Revenue Generated:</span>
                <span class="details-value" style="color: #10b981; font-weight: 700;">LKR ${parseFloat(stats.revenue || 0).toFixed(2)}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Average Patient Rating:</span>
                <span class="details-value">${stats.averageRating ? stats.averageRating + ' / 5.0' : 'N/A'}</span>
            </div>
        </div>

        <p>Thank you for your dedicated service on the VetCloud platform! We appreciate your commitment to animal care.</p>
    `;
    return wrapTemplate("Monthly Performance Report", content);
};

// 9. System Announcements Template
export const getSystemAnnouncementTemplate = (title, message) => {
    const content = `
        <h3>System Announcement</h3>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">${message}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="font-size: 12px; color: #64748b;">This is a system broadcast sent to all registered partners on VetCloud.</p>
    `;
    return wrapTemplate(title || "System Announcement", content);
};

// 10. Admin Security Alert Template
export const getSecurityAlertTemplate = (alertType, message, details) => {
    const content = `
        <p style="color: #e11d48; font-weight: bold; font-size: 16px;">⚠️ SECURITY ALERT: ${alertType}</p>
        <p>${message}</p>
        <div class="details-box" style="background-color: #fff1f2; border-color: #fecdd3;">
            <p style="margin: 0; font-size: 13px; font-family: monospace; color: #9f1239; word-break: break-all;">
                ${details || "No technical details available."}
            </p>
        </div>
        <p style="font-size: 12px; color: #64748b;">This alert requires administrator attention immediately.</p>
    `;
    return wrapTemplate("System Security Alert", content);
};

// 11. Admin Failed Payment Report Template
export const getFailedPaymentReportTemplate = (appointmentId, ownerName, amount, errorMsg) => {
    const content = `
        <p style="color: #e11d48; font-weight: bold;">❌ Failed Payment Transaction Detected</p>
        <p>A billing transaction failed during Stripe processing:</p>
        
        <div class="details-box">
            <div class="details-item">
                <span class="details-label">Appointment ID:</span>
                <span class="details-value">#${appointmentId}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Customer Name:</span>
                <span class="details-value">${ownerName}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Attempted Amount:</span>
                <span class="details-value">LKR ${parseFloat(amount || 0).toFixed(2)}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Failure Reason:</span>
                <span class="details-value" style="color: #e11d48;">${errorMsg || "Transaction Cancelled/Failed"}</span>
            </div>
        </div>
    `;
    return wrapTemplate("Failed Payment Transaction", content);
};

// 12. Admin User Account Issue Template
export const getUserAccountIssueTemplate = (issueType, details) => {
    const content = `
        <p style="font-weight: bold;">⚠️ User Account Issue Ticket Raised</p>
        <p>An issue was detected or reported concerning a platform user profile:</p>
        
        <div class="details-box">
            <div class="details-item">
                <span class="details-label">Issue Category:</span>
                <span class="details-value">${issueType}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Incident details:</span>
                <span class="details-value">${details}</span>
            </div>
        </div>
    `;
    return wrapTemplate("User Account Issue", content);
};

// 13. Vet Consultation Assignment Template
export const getNewConsultationAssignmentTemplate = (vetName, ownerName, animalName, date, time) => {
    const formattedDate = date ? new Date(date).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "N/A";
    const content = `
        <p>Dear Dr. ${vetName},</p>
        <p>A new consultation has been requested/assigned to you. Here are the details:</p>
        
        <div class="details-box">
            <div class="details-item">
                <span class="details-label">Pet Owner:</span>
                <span class="details-value">${ownerName}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Patient Animal:</span>
                <span class="details-value">${animalName}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Preferred Date:</span>
                <span class="details-value">${formattedDate}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Preferred Time:</span>
                <span class="details-value">${time || "N/A"}</span>
            </div>
        </div>
        
        <p>Please log in to your dashboard to accept/confirm or reschedule this consultation.</p>
        <a href="${getFrontendUrl()}/dashboard/doctor/requests" class="button">View Requests</a>
    `;
    return wrapTemplate("New Consultation Assignment", content);
};

// 14. Appointment Cancelled Email Template
export const getAppointmentCancelledTemplate = (ownerName, animalName, vetName, date, time) => {
    const formattedDate = date ? new Date(date).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "N/A";
    const content = `
        <p>Dear ${ownerName || "Client"},</p>
        <p>Your scheduled consultation appointment has been <strong>cancelled</strong>.</p>
        
        <div class="details-box">
            <div class="details-item">
                <span class="details-label">Patient:</span>
                <span class="details-value">${animalName || "Patient"}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Veterinarian:</span>
                <span class="details-value">${vetName || "Veterinary Doctor"}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Scheduled Date:</span>
                <span class="details-value">${formattedDate}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Scheduled Time:</span>
                <span class="details-value">${time || "N/A"}</span>
            </div>
        </div>

        <p>If you need to book a new appointment slot, please visit your VetCloud dashboard.</p>
        <a href="${getFrontendUrl()}/dashboard/user/consultations" class="button">Book New Consultation</a>
    `;
    return wrapTemplate("Appointment Cancelled", content);
};

// 15. Doctor Feedback Request Email Template
export const getFeedbackRequestTemplate = (ownerName, vetName, animalName, appointmentId) => {
    const content = `
        <p>Dear ${ownerName || "Valued Client"},</p>
        <p>Your virtual consultation for <strong>${animalName || "your animal"}</strong> with <strong>Dr. ${vetName || "the doctor"}</strong> (Appointment #${appointmentId}) has been successfully completed!</p>
        
        <p>We would love to hear about your experience. Your feedback helps us maintain the highest quality of veterinary care on VetCloud.</p>

        <div style="text-align: center; margin: 25px 0;">
            <a href="${getFrontendUrl()}/dashboard/user/consultations" class="button" style="background-color: #059669; font-size: 16px; padding: 14px 28px;">
                ⭐ Rate & Review Doctor
            </a>
        </div>

        <p>Thank you for choosing VetCloud for your animal healthcare needs!</p>
    `;
    return wrapTemplate("Doctor Feedback Request", content);
};
