// builds the user-facing rewrite prompt from the original email text

export function buildRewritePrompt(originalText, streak = 0) {
  let context = "";

  // add streak context if significant (optionally reference in humor)
  if (streak === 1) {
    context = "\n\nContext: This is the user's first rejection.";
  } else if (streak === 2) {
    context = "\n\nContext: This is the user's 2nd rejection in a row.";
  } else if (streak >= 3 && streak <= 5) {
    context = `\n\nContext: This is the user's ${streak}th rejection in a row. You can optionally reference this streak if it adds to the humor.`;
  } else if (streak > 5 && streak <= 10) {
    context = `\n\nContext: This is the user's ${streak}th rejection in a row (rough streak). You can optionally reference the mounting rejections if it makes the rewrite funnier.`;
  } else if (streak > 10) {
    context = `\n\nContext: This is the user's ${streak}th rejection in a row (brutal streak). Feel free to acknowledge this painful milestone in your rewrite if it enhances the humor.`;
  }

  return `Here is the original rejection email:\n\n"${originalText}"${context}\n\nRewrite it.`;
}
