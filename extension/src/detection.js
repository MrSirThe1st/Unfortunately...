// detection.js — rule-based email classification
// keyword matching + confidence scoring. no AI.
// exports: detectEmail(subject, body) → { type, confidence }

const CONFIDENCE_THRESHOLD = 0.4;

// subject keywords weighted higher — more signal per hit
const WEIGHTS = {
  subject: { strong: 0.4, weak: 0.15 },
  body:    { strong: 0.25, weak: 0.1 },
};

const REJECTION = {
  subject: {
    strong: [
      "unfortunately",
      "not moving forward",
      "not selected",
      "position filled",
      "unsuccessful",
      "decided to go with",
    ],
    weak: [
      "thank you for your interest",
      "thank you for your time",
      "regarding your application",
    ],
  },
  body: {
    strong: [
      "unfortunately",
      "we have decided not to",
      "not moving forward",
      "not proceeding",
      "will not be proceeding",
      "decided to go with another",
      "position has been filled",
      "will not be moving forward",
      "not selected",
      "was not selected",
      "were not selected",
      "went with other candidates",
      "not the right fit",
      "better suited",
      "will not be pursuing",
      "chosen not to move forward",
      "have decided to pursue",
      "moved to the next step",
      "moving forward with other",
      "not be considered further",
      "application has been unsuccessful",
      "regret to inform",
      "we regret",
      "will not be extending an offer",
      "have filled the position",
      "accepted another candidate",
    ],
    weak: [
      "thank you for your interest",
      "thank you for taking the time",
      "we appreciate your time",
      "wish you the best",
      "best of luck",
      "encourage you to apply for future",
      "keep your resume on file",
      "future opportunities",
    ],
  },
};

const ACCEPTANCE = {
  subject: {
    strong: [
      "congratulations",
      "you've been selected",
      "we'd like to offer",
      "offer letter",
    ],
    weak: [
      "offer",
      "welcome",
      "next steps",
    ],
  },
  body: {
    strong: [
      "pleased to offer",
      "congratulations",
      "welcome to the team",
      "we'd like to offer you",
      "offer letter",
      "formally offer",
      "excited to welcome you",
      "you have been selected",
    ],
    weak: [
      "start date",
      "onboarding",
      "looking forward to working with you",
      "excited to have you",
    ],
  },
};

function scoreText(text, strongKeywords, weakKeywords, strongWeight, weakWeight) {
  const lower = text.toLowerCase();
  let score = 0;
  for (const kw of strongKeywords) {
    if (lower.includes(kw)) score += strongWeight;
  }
  for (const kw of weakKeywords) {
    if (lower.includes(kw)) score += weakWeight;
  }
  return score;
}

function scoreSignals(subject, body, signals) {
  return (
    scoreText(subject, signals.subject.strong, signals.subject.weak, WEIGHTS.subject.strong, WEIGHTS.subject.weak) +
    scoreText(body, signals.body.strong, signals.body.weak, WEIGHTS.body.strong, WEIGHTS.body.weak)
  );
}

export function detectEmail(subject, body) {
  const rejection = Math.min(scoreSignals(subject, body, REJECTION), 1);
  const acceptance = Math.min(scoreSignals(subject, body, ACCEPTANCE), 1);

  // if tied or both below threshold → ambiguous, skip
  if (rejection > acceptance && rejection >= CONFIDENCE_THRESHOLD) {
    return { type: "rejection", confidence: rejection };
  }
  if (acceptance > rejection && acceptance >= CONFIDENCE_THRESHOLD) {
    return { type: "acceptance", confidence: acceptance };
  }
  return { type: "none", confidence: 0 };
}
