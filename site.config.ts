export const site = {
  name: "Aleksander Eriksen",
  role: "Developer & entrepreneur",
  // Base for every RSS link and OG tag. Set this before deploying.
  url: "https://jakeriksen.github.io",
  description:
    "Mechanical engineer by training, developer by habit. I build products and the companies around them.",
  /** The hero line. Keep it short. It is set large, in the display face. */
  tagline: "I studied machines. Now I write software.",
  bio: "MSc in mechanical engineering and product development. I started coding somewhere in the middle of that and never stopped. Machines or software, the part I enjoy is the same: building products.",
  links: [
    { label: "GitHub", href: "https://github.com/jakeriksen" },
    { label: "X", href: "https://x.com/jakeriksen" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/aleksander-eriksen/" },
    { label: "Email", href: "mailto:jakeriksen@gmail.com" },
  ],
} as const;
