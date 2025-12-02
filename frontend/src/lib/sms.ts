const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN || "";
const TWILIO_FROM_NUMBER = import.meta.env.VITE_TWILIO_FROM_NUMBER || "";
const TEACHER_NUMBER = "+916305877692"; // update this to the actual teacher contact number

// Get parent number from logged-in user
const getParentNumber = (): string => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.parentMobile ? `+91${user.parentMobile}` : "";
    }
  } catch (error) {
    console.error("Error getting parent number:", error);
  }
  return "";
};

const encodeCredentials = () => {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    return window.btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  }
  return "";
};

const sendSms = async (to: string | null, body: string) => {
  const trimmed = body.trim();
  if (!trimmed || !to) return;

  // Check if Twilio is configured
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    console.warn("Twilio SMS not configured. Skipping SMS notification.");
    return;
  }

  const credentials = encodeCredentials();
  if (!credentials) {
    console.error("Unable to encode Twilio credentials.");
    return;
  }

  const formData = new URLSearchParams();
  formData.append("To", to);
  formData.append("From", TWILIO_FROM_NUMBER);
  formData.append("Body", trimmed);

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        // Suppress unverified number errors for Twilio trial accounts
        if (errorData.code === 21608) {
          console.warn("SMS not sent: Phone number is unverified in Twilio trial account.");
          return;
        }
      } catch {
        // If parsing fails, continue with normal error handling
      }
      console.error("Twilio SMS failed:", response.status, errorText);
    }
  } catch (error) {
    console.error("Failed to send SMS:", error);
  }
};

export const sendParentSms = async (body: string) => {
  const parentNumber = getParentNumber();
  if (!parentNumber) {
    console.warn("Parent number not found. Please ensure user is logged in.");
    return;
  }
  await sendSms(parentNumber, body);
};

export const sendTeacherSms = async (body: string) => {
  if (!TEACHER_NUMBER) {
    console.warn("Teacher number not configured. Please update TEACHER_NUMBER in sms.ts");
    return;
  }
  await sendSms(TEACHER_NUMBER, body);
};

