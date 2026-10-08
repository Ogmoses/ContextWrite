// Turns provider and parsing failures into messages a person can act on.
export function friendly(e: any): string | null {
  if (e?.code === "LIMIT") return `You've reached this month's usage limit (${e.limit} AI requests). It resets on the 1st.`;
  if (e?.message === "provider") {
    const s = e.status;
    if (s === 429) return "Your AI provider says you've hit its rate or quota limit. Wait a minute, or check your plan with the provider.";
    if (s === 401 || s === 403) return "Your AI provider rejected the key. Re-enter it in AI settings.";
    if (s === 404) return "That model isn't available for your key. Choose another model in AI settings.";
    return "Your AI provider returned an error. Check your key and model in AI settings, then try again.";
  }
  if (e instanceof SyntaxError) return "The AI's reply wasn't in the expected format. Try again, or choose a stronger model in AI settings.";
  return null;
}
