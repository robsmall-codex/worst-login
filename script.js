const form = document.querySelector("#login-form");
const card = document.querySelector(".card");
const submitButton = document.querySelector("#submit-button");
const statusNode = document.querySelector("#status");
const successPanel = document.querySelector("#success-panel");
const passwordChangePanel = document.querySelector("#password-change-panel");
const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");
const captchaSection = document.querySelector(".captcha");
const captchaInstruction = document.querySelector("#captcha-instruction");
const captchaHint = document.querySelector("#captcha-hint");
const captchaPrompt = document.querySelector("#captcha-prompt");
const captchaAnswerInput = document.querySelector("#captcha-answer");
const captchaTimer = document.querySelector("#captcha-timer");
const captchaRefreshButton = document.querySelector("#captcha-refresh");

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
let currentCaptchaAnswer = "";
let captchaExpiresAt = 0;
let captchaDifficulty = 0;
let captchaTimerId = null;
let audioContext = null;
let audioUnlocked = false;
let lastTickSecond = null;
let activeCardMotion = "";
let remainingSubmitDodges = 3;

const dodgeMotions = ["dodge-1", "dodge-2", "dodge-3"];

const captchaWords = [
  "marzipan",
  "lighthouse",
  "accordion",
  "daydream",
  "treasure",
  "backflip",
  "whiplash",
  "cinnamon",
];

const misleadingHints = [
  "Hint: If your answer seems right, consider second-guessing yourself anyway.",
  "Formatting matters emotionally, if not mathematically.",
  "Please answer calmly. Panic has a poor success rate.",
  "This challenge was reviewed by nobody and approved immediately.",
  "Refresh if confused. It almost never helps.",
];

function randomNumber(max) {
  return Math.floor(Math.random() * max);
}

function buildMathChallenge() {
  const level = Math.min(4, 2 + captchaDifficulty);
  const a = randomNumber(8) + 4;
  const b = randomNumber(7) + 3;
  const c = randomNumber(6) + 2;

  if (level <= 2) {
    const answer = a * (b + c);

    return {
      instruction: "Evaluate the expression exactly before continuing.",
      hint: misleadingHints[randomNumber(misleadingHints.length)],
      prompt: `${a} x (${b} + ${c})`,
      answer: String(answer),
    };
  }

  if (level === 3) {
    const answer = a * b - c * (a - 1);

    return {
      instruction: "Respect the order of operations. The form certainly will.",
      hint: misleadingHints[randomNumber(misleadingHints.length)],
      prompt: `${a} x ${b} - ${c} x (${a - 1})`,
      answer: String(answer),
    };
  }

  const divisor = randomNumber(4) + 2;
  const base = divisor * (randomNumber(5) + 6);
  const subtractor = randomNumber(9) + 7;
  const answer = (base + subtractor) / divisor + c;

  return {
    instruction: "Perform each step carefully and enter only the final integer.",
    hint: misleadingHints[randomNumber(misleadingHints.length)],
    prompt: `(${base} + ${subtractor}) / ${divisor} + ${c}`,
    answer: String(answer),
  };
}

function buildCaptchaChallenge() {
  const challengeType = randomNumber(3);

  if (challengeType === 0) {
    return buildMathChallenge();
  }

  if (challengeType === 1) {
    const word = captchaWords[randomNumber(captchaWords.length)];

    return {
      instruction: "Type this word backwards to prove you are probably organic.",
      hint: misleadingHints[randomNumber(misleadingHints.length)],
      prompt: word.toUpperCase(),
      answer: word.split("").reverse().join(""),
    };
  }

  const word = captchaWords[randomNumber(captchaWords.length)];
  const first = word[0];
  const third = word[2];
  const last = word[word.length - 1];

  return {
    instruction: "Enter the 1st, 3rd, and last letters with no spaces.",
    hint: misleadingHints[randomNumber(misleadingHints.length)],
    prompt: word.toUpperCase(),
    answer: `${first}${third}${last}`,
  };
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function ensureAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    audioContext = new AudioContextClass();
  }

  if (!audioUnlocked && audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  audioUnlocked = true;
  return audioContext;
}

function playTone({ frequency, duration, type = "square", volume = 0.08 }) {
  const context = ensureAudioContext();

  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const now = context.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(volume, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function playTick(remainingSeconds) {
  const urgencyBoost = remainingSeconds <= 5 ? 220 : remainingSeconds <= 10 ? 120 : 0;
  const volume =
    remainingSeconds <= 3 ? 0.28 :
    remainingSeconds <= 5 ? 0.22 :
    remainingSeconds <= 10 ? 0.15 :
    0.08;
  const duration = remainingSeconds <= 5 ? 0.12 : 0.09;

  playTone({
    frequency: 880 + urgencyBoost,
    duration,
    type: "square",
    volume,
  });
}

function playTimeoutAlarm() {
  const context = ensureAudioContext();

  if (!context) {
    return;
  }

  playTone({ frequency: 220, duration: 0.22, type: "sawtooth", volume: 0.18 });

  window.setTimeout(() => {
    playTone({ frequency: 165, duration: 0.32, type: "sawtooth", volume: 0.22 });
  }, 140);

  window.setTimeout(() => {
    playTone({ frequency: 110, duration: 0.48, type: "triangle", volume: 0.2 });
  }, 300);
}

function playSuccessFanfare() {
  const notes = [
    { frequency: 392.0, duration: 0.11, delay: 0, volume: 0.13 },
    { frequency: 369.99, duration: 0.11, delay: 120, volume: 0.13 },
    { frequency: 311.13, duration: 0.11, delay: 240, volume: 0.13 },
    { frequency: 440.0, duration: 0.12, delay: 360, volume: 0.14 },
    { frequency: 415.3, duration: 0.12, delay: 500, volume: 0.145 },
    { frequency: 523.25, duration: 0.13, delay: 650, volume: 0.155 },
    { frequency: 587.33, duration: 0.14, delay: 820, volume: 0.16 },
    { frequency: 783.99, duration: 0.42, delay: 1000, volume: 0.19 },
  ];

  notes.forEach((note) => {
    window.setTimeout(() => {
      playTone({
        frequency: note.frequency,
        duration: note.duration,
        type: "square",
        volume: note.volume,
      });
    }, note.delay);
  });
}

function unlockAudioOnce() {
  ensureAudioContext();
  window.removeEventListener("pointerdown", unlockAudioOnce);
  window.removeEventListener("keydown", unlockAudioOnce);
}

function setStatus(message, type = "") {
  statusNode.textContent = message;
  statusNode.className = `status${type ? ` ${type}` : ""}`;
}

function clearCredentialInputs() {
  usernameInput.value = "";
  passwordInput.value = "";
  updateCardShift();
}

function resetSubmitDodges() {
  remainingSubmitDodges = 3;
}

function updateCardShift() {
  const hasUsername = usernameInput.value.trim().length > 0;
  card.classList.toggle("card-shifted", hasUsername);
  card.dataset.motion = activeCardMotion;
}

function setCardMotion(motion) {
  activeCardMotion = motion;
  updateCardShift();
}

function refreshCaptcha() {
  const challenge = buildCaptchaChallenge();
  currentCaptchaAnswer = challenge.answer.toLowerCase();
  captchaExpiresAt = Date.now() + Math.max(12000, 20000 - captchaDifficulty * 1000);
  lastTickSecond = null;
  captchaInstruction.textContent = challenge.instruction;
  captchaHint.textContent = challenge.hint;
  captchaPrompt.textContent = challenge.prompt;
  captchaAnswerInput.value = "";
  updateCaptchaTimer();
}

function updateCaptchaTimer() {
  const remainingSeconds = Math.max(
    0,
    Math.ceil((captchaExpiresAt - Date.now()) / 1000)
  );

  captchaTimer.textContent = `Expires in ${remainingSeconds}s`;
  captchaTimer.classList.toggle("captcha-expiring", remainingSeconds <= 5);

  if (remainingSeconds > 0 && remainingSeconds !== lastTickSecond) {
    lastTickSecond = remainingSeconds;
    playTick(remainingSeconds);
  }
}

function dodgeSubmitButton() {
  if (!usernameInput.value.trim() || captchaSection.hidden || remainingSubmitDodges <= 0) {
    return false;
  }

  const motion = dodgeMotions[3 - remainingSubmitDodges];
  remainingSubmitDodges -= 1;
  setCardMotion(motion);
  setStatus(
    `Submit button evasive maneuver ${3 - remainingSubmitDodges}/3 engaged. Please try to deserve it.`,
    "error"
  );
  return true;
}

function startCaptchaTimer() {
  if (captchaTimerId) {
    window.clearInterval(captchaTimerId);
  }

  captchaTimerId = window.setInterval(() => {
    updateCaptchaTimer();

    if (Date.now() >= captchaExpiresAt) {
      captchaDifficulty += 1;
      playTimeoutAlarm();
      refreshCaptcha();
      clearCredentialInputs();
      setStatus("Captcha expired. The replacement is less cooperative.", "error");
    }
  }, 250);
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
  ensureAudioContext();
  successPanel.hidden = true;
  passwordChangePanel.hidden = true;
  captchaSection.hidden = false;

  const formData = new FormData(form);
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const captchaAnswer = String(formData.get("captcha-answer") || "")
    .trim()
    .toLowerCase();

  if (!username || !password) {
    setStatus("Enter both username and password.", "error");
    return;
  }

  if (!captchaAnswer) {
    setStatus("Complete the captcha ritual first.", "error");
    return;
  }

  if (Date.now() >= captchaExpiresAt) {
    failedAttempts += 1;
    captchaDifficulty += 1;
    clearCredentialInputs();
    resetSubmitDodges();
    refreshCaptcha();
    setStatus(
      `Attempt ${failedAttempts}. Captcha expired. Speed and accuracy were both invited.`,
      "error"
    );
    return;
  }

  if (captchaAnswer !== currentCaptchaAnswer) {
    failedAttempts += 1;
    captchaDifficulty += 1;
    clearCredentialInputs();
    resetSubmitDodges();
    refreshCaptcha();
    setStatus(
      `Attempt ${failedAttempts}. Captcha failed. A stunning setback before the login even mattered.`,
      "error"
    );
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
      passwordChangePanel.hidden = false;
      captchaSection.hidden = true;
      form.hidden = true;
      playSuccessFanfare();
      failedAttempts = 0;
      captchaDifficulty = 0;
      resetSubmitDodges();
      form.reset();
      setCardMotion("");
      updateCardShift();
      if (captchaTimerId) {
        window.clearInterval(captchaTimerId);
        captchaTimerId = null;
      }
      refreshCaptcha();
      return;
    }

    failedAttempts += 1;
    captchaDifficulty += 1;
    passwordInput.value = "";
    resetSubmitDodges();
    refreshCaptcha();
    setStatus(getFailureMessage(failedAttempts), "error");
  } catch (error) {
    failedAttempts += 1;
    captchaDifficulty += 1;
    passwordInput.value = "";
    resetSubmitDodges();
    refreshCaptcha();
    setStatus(getFailureMessage(failedAttempts, error.message), "error");
  } finally {
    submitButton.disabled = false;
  }
});

captchaRefreshButton.addEventListener("click", () => {
  ensureAudioContext();
  captchaDifficulty += 1;
  resetSubmitDodges();
  setCardMotion("captcha");
  refreshCaptcha();
  setStatus("A fresh challenge has been issued. It is not friendlier.", "error");
});

usernameInput.addEventListener("input", updateCardShift);
usernameInput.addEventListener("focus", () => setCardMotion(""));
passwordInput.addEventListener("focus", () => setCardMotion("password"));
captchaAnswerInput.addEventListener("focus", () => setCardMotion("captcha"));
submitButton.addEventListener("pointerenter", () => {
  if (dodgeSubmitButton()) {
    return;
  }

  if (usernameInput.value.trim()) {
    setCardMotion(captchaSection.hidden ? "password" : "submit");
  }
});
submitButton.addEventListener("focus", () => {
  if (dodgeSubmitButton()) {
    return;
  }

  if (usernameInput.value.trim()) {
    setCardMotion(captchaSection.hidden ? "password" : "submit");
  }
});
submitButton.addEventListener("click", (event) => {
  if (dodgeSubmitButton()) {
    event.preventDefault();
  }
});

window.addEventListener("pointerdown", unlockAudioOnce);
window.addEventListener("keydown", unlockAudioOnce);

refreshCaptcha();
updateCardShift();
startCaptchaTimer();
