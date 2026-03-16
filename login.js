function readAcceptedCredentials() {
  const username = process.env.LOGIN_USERNAME;
  const password = process.env.LOGIN_PASSWORD;

  if (!username || !password) {
    return null;
  }

  return { username, password };
}

function readRequestBody(body) {
  if (!body) {
    return {};
  }

  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }

  return body;
}

function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const accepted = readAcceptedCredentials();

  if (!accepted) {
    return res.status(500).json({
      error: "Server credentials are not configured.",
    });
  }

  const { username, password } = readRequestBody(req.body);
  const isValid =
    typeof username === "string" &&
    typeof password === "string" &&
    username === accepted.username &&
    password === accepted.password;

  if (!isValid) {
    return res.status(401).json({ ok: false });
  }

  return res.status(200).json({ ok: true });
}

module.exports = handler;
