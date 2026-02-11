// builds the user-facing rewrite prompt from the original email text

export function buildRewritePrompt(originalText) {
  return `Here is the original rejection email:\n\n"${originalText}"\n\nRewrite it.`;
}
