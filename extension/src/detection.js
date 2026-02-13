// detection.js — rule-based email classification
// keyword matching + confidence scoring. no AI.
// exports: detectEmail(subject, body) → { type, confidence }

const CONFIDENCE_THRESHOLD = 0.4;

// cap for weak signal contribution (prevents "thank you" spam from triggering false positive)
const WEAK_SIGNAL_CAP = 0.3;

// negation words that flip meaning when near keywords
const NEGATIONS = ["not", "no", "never", "won't", "can't", "cannot", "unable", "regret"];

// body weighted higher - actual rejection/acceptance language lives in body, not subject
// subjects are often generic ("Update on your application", "Regarding your position")
const WEIGHTS = {
  subject: { strong: 0.2, weak: 0.1 },
  body:    { strong: 0.4, weak: 0.15 },
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
      // negated acceptance phrases (important!)
      "not making an offer",
      "unable to offer",
      "cannot offer",
      "won't be offering",
      "not able to move forward",
      "not in a position to offer",
      "no offer at this time",
      "not making you an offer",
      "not extending an offer",
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

// escape regex special chars in keyword
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// check if keyword appears as whole word/phrase (not substring)
function matchesKeyword(text, keyword) {
  // for multi-word phrases, escape and match the whole phrase
  const escaped = escapeRegex(keyword);
  // use word boundaries only at start/end of phrase
  const regex = new RegExp(`\\b${escaped}\\b`, 'i');
  return regex.test(text);
}

// check if keyword is negated (negation within 5 words before keyword)
function isNegated(text, keyword) {
  const escaped = escapeRegex(keyword);
  // look for negation words within 5 words before the keyword
  // pattern: (negation word) ... (up to 5 words) ... (keyword)
  const negationPattern = NEGATIONS.map(escapeRegex).join('|');
  const regex = new RegExp(`\\b(${negationPattern})\\b(?:\\s+\\w+){0,5}?\\s+\\b${escaped}\\b`, 'i');
  return regex.test(text);
}

function scoreText(text, strongKeywords, weakKeywords, strongWeight, weakWeight, checkNegation = false) {
  let strongScore = 0;
  let weakScore = 0;

  for (const kw of strongKeywords) {
    if (matchesKeyword(text, kw)) {
      // if checking negation and keyword is negated, skip it
      if (checkNegation && isNegated(text, kw)) continue;
      strongScore += strongWeight;
    }
  }

  for (const kw of weakKeywords) {
    if (matchesKeyword(text, kw)) {
      // if checking negation and keyword is negated, skip it
      if (checkNegation && isNegated(text, kw)) continue;
      weakScore += weakWeight;
    }
  }

  // cap weak signal contribution to prevent spam inflation
  weakScore = Math.min(weakScore, WEAK_SIGNAL_CAP);

  return strongScore + weakScore;
}

function scoreSignals(subject, body, signals, checkNegation = false) {
  return (
    scoreText(subject, signals.subject.strong, signals.subject.weak, WEIGHTS.subject.strong, WEIGHTS.subject.weak, checkNegation) +
    scoreText(body, signals.body.strong, signals.body.weak, WEIGHTS.body.strong, WEIGHTS.body.weak, checkNegation)
  );
}

export function detectEmail(subject, body) {
  // don't check negation for rejection (negations are explicit in rejection keywords)
  const rejection = Math.min(scoreSignals(subject, body, REJECTION, false), 1);
  // DO check negation for acceptance (prevents "not making an offer" from scoring positive)
  const acceptance = Math.min(scoreSignals(subject, body, ACCEPTANCE, true), 1);

  // if tied or both below threshold → ambiguous, skip
  if (rejection > acceptance && rejection >= CONFIDENCE_THRESHOLD) {
    return { type: "rejection", confidence: rejection };
  }
  if (acceptance > rejection && acceptance >= CONFIDENCE_THRESHOLD) {
    return { type: "acceptance", confidence: acceptance };
  }
  return { type: "none", confidence: 0 };
}
