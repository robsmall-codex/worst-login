const form = document.querySelector("#login-form");
const submitButton = document.querySelector("#submit-button");
const statusNode = document.querySelector("#status");
const successPanel = document.querySelector("#success-panel");

function setStatus(message, type = "") {
  statusNode.textContent = message;
  statusNode.className = `status${type ? ` ${type}` : ""}`;
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

      if (responseText) {
        throw new Error(responseText.trim());
      }

      throw new Error("Login failed.");
    }

    if (data && data.ok) {
      setStatus("Login successful.", "success-text");
      successPanel.hidden = false;
      form.reset();
      return;
    }

    setStatus("Invalid username or password.", "error");
  } catch (error) {
    setStatus(error.message || "Something went wrong.", "error");
  } finally {
    submitButton.disabled = false;
  }
});
