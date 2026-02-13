// reaction image library for AI-suggested images
// AI uses tags like [IMAGE:crying] in rewrites
// tags get replaced with actual images

export const REACTION_IMAGES = {
  // sadness/disappointment
  crying: "https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif",
  sad_cat: "https://media.giphy.com/media/BEob5qwFkSJ7G/giphy.gif",
  crying_cat: "https://media.giphy.com/media/6uGhT1O4sxpi8/giphy.gif",

  // acceptance/cope
  this_is_fine: "https://media.giphy.com/media/QMHoU66sBXqqLqYvGO/giphy.gif",
  shrug: "https://media.giphy.com/media/G4ZNYMQVMH6us/giphy.gif",
  accepting: "https://media.giphy.com/media/92wH9E5FNKtqVMPapQ/giphy.gif",

  // dark humor
  skeleton_waiting: "https://media.giphy.com/media/QBd2kLB5qDmysEXre9/giphy.gif",
  internal_screaming: "https://media.giphy.com/media/55itGuoAJiZEEen9gg/giphy.gif",
  burning: "https://media.giphy.com/media/l0IypeKl9NJhPFMrK/giphy.gif",

  // motivation/copium
  you_got_this: "https://media.giphy.com/media/yoJC2K6rCzwNY2EngA/giphy.gif",
  thumbs_up: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",

  // tech/dev
  bug: "https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif",
  error_404: "https://media.giphy.com/media/14uQ3cOFteDaU/giphy.gif",
  loading: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",

  // internet culture
  doge: "https://media.giphy.com/media/5xtDarqlsEW6F7F14Fq/giphy.gif",
  pepe_cry: "https://i.imgur.com/AdiBPrO.jpg",
  wojak_crying: "https://i.imgur.com/w3duR07.png",

  // general reactions
  shocked: "https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif",
  thinking: "https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif",
  celebration: "https://media.giphy.com/media/g9582DNuQppxC/giphy.gif",

  // political/trump mode
  trump_wrong: "https://media.giphy.com/media/3oz8xLd9DJq2l2VFtu/giphy.gif",
  trump_youre_fired: "https://media.giphy.com/media/l0IylOPCNkiqOgMyA/giphy.gif",
  trump_shrug: "https://media.giphy.com/media/l3vRfNA1p0rvhMSvS/giphy.gif",
  biden_confused: "https://media.giphy.com/media/W5ZUxqXT1lmiysXsDE/giphy.gif",
  obama_mic_drop: "https://media.giphy.com/media/3o7qDQ4kcSD1PLM3BK/giphy.gif",
  bernie_mittens: "https://i.imgur.com/sMnq55W.jpg",
  crying_maga: "https://media.giphy.com/media/gfT2hGhrI5wBME50p5/giphy.gif",
  political_disaster: "https://media.giphy.com/media/joV1k1sNOT5xC/giphy.gif",
};

// fallback if tag not found
export const DEFAULT_IMAGE = "https://media.giphy.com/media/G4ZNYMQVMH6us/giphy.gif"; // shrug

export function getReactionImage(tag) {
  return REACTION_IMAGES[tag] || DEFAULT_IMAGE;
}
