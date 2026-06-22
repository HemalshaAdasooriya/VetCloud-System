import nodemailer from "nodemailer";

// Helper to send email with robust fallbacks
export const sendEmail = async ({ to, subject, html, text }) => {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
        console.log("=========================================");
        console.log(`[EMAIL SIMULATION] TO: ${to}`);
        console.log(`[EMAIL SIMULATION] SUBJECT: ${subject}`);
        console.log(`[EMAIL SIMULATION] TEXT: ${text}`);
        console.log("=========================================");
        return { message: "Email simulation successful (credentials not set)" };
    }

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: emailUser,
                pass: emailPass
            }
        });

        const info = await transporter.sendMail({
            from: `"VetCloud Notifications" <${emailUser}>`,
            to,
            subject,
            text: text || "New notification from VetCloud",
            html
        });
        console.log(`Email successfully sent to ${to}: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`Failed to send email to ${to}:`, error);
        throw error;
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

// 1. Appointment Confirmation Email Template
export const getAppointmentConfirmationTemplate = (ownerName, animalName, vetName, date, time, type, reason) => {
    const formattedDate = new Date(date).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const content = `
        <p>Dear ${ownerName},</p>
        <p>Your appointment booking has been **successfully confirmed**! Here are the details of your upcoming consultation:</p>
        
        <div class="details-box">
            <div class="details-item">
                <span class="details-label">Patient:</span>
                <span class="details-value">${animalName}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Veterinarian:</span>
                <span class="details-value">${vetName}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Date:</span>
                <span class="details-value">${formattedDate}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Time:</span>
                <span class="details-value">${time}</span>
            </div>
            <div class="details-item">
                <span class="details-label">Consultation Type:</span>
                <span class="details-value">${type.toUpperCase()}</span>
            </div>
            ${reason ? `
            <div class="details-item">
                <span class="details-label">Reason:</span>
                <span class="details-value">${reason}</span>
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
        <a href="http://localhost:5173/dashboard/user/appoinment" class="button">Schedule Consultation</a>
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
        <a href="http://localhost:5173/dashboard/user/animals" class="button">View Medical Records</a>
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
    const verificationUrl = `http://localhost:5173/dashboard/user/settings?verifyEmail=${encodeURIComponent(email)}`;
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
