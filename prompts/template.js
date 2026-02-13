// builds the user-facing rewrite prompt from the original email text

export function buildRewritePrompt(originalText, streak = 0) {
  let context = "";

  // add streak context sparingly - don't make it the focus, just background info
  if (streak === 1) {
    // first rejection - rarely worth mentioning
    context = "";
  } else if (streak === 2 || streak === 3) {
    // low streak - mention but very subtle
    context = `\n\n[Background: ${streak} rejections in a row. Don't make this the focus - only reference if it naturally fits your rewrite style.]`;
  } else if (streak >= 4 && streak <= 7) {
    context = `\n\n[Background: ${streak} rejections in a row. You can occasionally work this into the humor if it feels natural, but it shouldn't dominate the rewrite.]`;
  } else if (streak >= 8 && streak <= 12) {
    context = `\n\n[Background: ${streak} rejection streak. This is notable - you can reference it if it enhances your rewrite, but focus on the email content first.]`;
  } else if (streak > 12) {
    context = `\n\n[Background: ${streak} rejection streak (ouch). This milestone might be worth acknowledging depending on your mode, but still keep the email itself as the main focus.]`;
  }

  return `Here is the original rejection email:\n\n"${originalText}"${context}\n\nRewrite it.`;
}
