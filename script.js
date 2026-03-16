const form = document.querySelector("#login-form");
const submitButton = document.querySelector("#submit-button");
const statusNode = document.querySelector("#status");
const successPanel = document.querySelector("#success-panel");
const passwordInput = document.querySelector("#password");

const humiliationTiers = [
  [
    "Those credentials felt spiritually incorrect.",
    "Login denied. Please try again with more confidence.",
    "Still no. The system remains unconvinced.",
  ],
  [
    "Incorrect again. A bold strategy, if not an effective one.",
    "The machine reviewed your effort and sighed.",
    "No luck. We are entering concerning territory now.",
  ],
  [
    "Attempt rejected. Your keyboard may be innocent, but the result is not.",
    "This is getting memorable for all the wrong reasons.",
    "Denied again. You are building a reputation with the form.",
  ],
  [
    "At this point the login box knows your weakness better than you do.",
    "The form remains locked. Your persistence, however, is becoming performance art.",
    "Another failure. Historians may study this sequence one day.",
  ],
];

let failedAttempts = 0;

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function setStatus(message, type = "") {
  statusNode.textContent = message;
  statusNode.className = `status${type ? ` ${type}` : ""}`;
}

function getFailureMessage(attemptNumber, fallbackMessage) {
  if (fallbackMessage) {
    return fallbackMessage;
  }

  if (attemptNumber === 5) {
    return "Attempt 5. Impressive commitment to being wrong.";
  }

  if (attemptNumber === 10) {
    return "Attempt 10. The login form has officially lost respect for you.";
  }

  if (attemptNumber >= 15) {
    return `Attempt ${attemptNumber}. This has become a relationship, and not a healthy one.`;
  }

  const tierIndex = Math.min(
    humiliationTiers.length - 1,
    Math.floor((attemptNumber - 1) / 3)
  );
  const tier = humiliationTiers[tierIndex];
  const messageIndex = (attemptNumber - 1) % tier.length;

  return `Attempt ${attemptNumber}. ${tier[messageIndex]}`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  successPanel.hidden = true;

  const formData = new FormData(form);
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!username || !password) {
    setStatus("Enter both username and password.", "error");
    return;
  }

  submitButton.disabled = true;
  setStatus("Checking credentials...");

  try {
    await wait(1800 + failedAttempts * 500);

    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const responseText = await response.text();
    let data = null;

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = null;
    }

    if (!response.ok) {
      if (data && data.error) {
        throw new Error(data.error);
      }
      throw new Error("");
    }

    if (data && data.ok) {
      setStatus("Login successful.", "success-text");
      successPanel.hidden = false;
      failedAttempts = 0;
      form.reset();
      return;
    }

    failedAttempts += 1;
    passwordInput.value = "";
    setStatus(getFailureMessage(failedAttempts), "error");
  } catch (error) {
    failedAttempts += 1;
    passwordInput.value = "";
    setStatus(getFailureMessage(failedAttempts, error.message), "error");
  } finally {
    submitButton.disabled = false;
  }
});
