export function isPosMenuSync() {
  return (process.env.MENU_SYNC_MODE ?? "pos") !== "local";
}

export function isOrderingEnabled() {
  return process.env.NEXT_PUBLIC_ORDERING_ENABLED === "true";
}

export function posBaseUrl() {
  return (process.env.POS_INTEGRATION_BASE_URL ?? "").replace(/\/$/, "");
}

export function posApiKey() {
  return (process.env.POS_INTEGRATION_API_KEY ?? "").trim();
}

export function posConfigured() {
  return Boolean(posBaseUrl() && posApiKey());
}
