// Lazily loads Paddle.js (Paddle Billing v2) and initializes it once with the
// client token + environment returned by the backend's /api/payments/config.
// Safe to call multiple times — the script and Paddle.Initialize both no-op
// after the first successful call.

let loadingPromise = null;

function loadPaddleScript() {
  if (window.Paddle) return Promise.resolve(window.Paddle);
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => resolve(window.Paddle);
    script.onerror = () => reject(new Error("Failed to load Paddle.js"));
    document.head.appendChild(script);
  });

  return loadingPromise;
}

let initialized = false;

export async function initPaddle({ environment, clientToken }) {
  const Paddle = await loadPaddleScript();
  if (!initialized) {
    if (environment === "sandbox") {
      Paddle.Environment.set("sandbox");
    }
    Paddle.Initialize({ token: clientToken });
    initialized = true;
  }
  return Paddle;
}

export async function openPaddleCheckout({ environment, clientToken, transactionId }) {
  const Paddle = await initPaddle({ environment, clientToken });
  Paddle.Checkout.open({ transactionId });
}
