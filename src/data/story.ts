/**
 * "Our Story" — drawn from the Hololabs company profile ("Who We Are",
 * "Our Philosophy", "Our DNA", closing manifesto). The notes flag this
 * section's final copy as pending sign-off from Pak Rian; this is the
 * working draft until that lands.
 */
export const storyIntro = {
  eyebrow: "Our Story",
  statement: "We turn technology into experience.",
  lead:
    "Hololabs adalah experience laboratory yang menciptakan pengalaman imersif terintegrasi, menggabungkan visual, audio, permainan interaktif, teknologi, dan desain spasial — tidak hanya untuk dilihat, tapi didengar, dirasakan, dimainkan, disentuh, dan direspons.",
};

export const philosophy = {
  quote: "Technology should not just be seen. It should be experienced.",
  body:
    "Bagi Hololabs, teknologi bukan tujuan akhir — ia adalah medium untuk menciptakan interaction, emotion, curiosity, connection, dan experience. Karena itu kami tidak sekadar menunjukkan teknologi; kami mengubahnya jadi pengalaman.",
};

export interface DnaTrait {
  title: string;
  description: string;
}

export const dnaTraits: DnaTrait[] = [
  { title: "Futuristic", description: "Exploring what technology can become." },
  { title: "Experimental", description: "Testing new ideas and possibilities." },
  { title: "Immersive", description: "Bringing people inside the experience." },
  { title: "Interactive", description: "Turning audiences into participants." },
  { title: "Intelligent", description: "Creating technology that understands, responds, and adapts." },
];

export const manifesto = [
  "We explore.",
  "We experiment.",
  "We integrate.",
  "We create.",
  "And we invite people to step inside.",
];
