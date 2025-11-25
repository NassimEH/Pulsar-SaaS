import {
  benefitIcon1,
  benefitIcon2,
  benefitIcon3,
  benefitIcon4,
  benefitImage2,
  chromecast,
  disc02,
  discord,
  discordBlack,
  facebook,
  figma,
  file02,
  framer,
  homeSmile,
  instagram,
  notification2,
  notification3,
  notification4,
  notion,
  photoshop,
  plusSquare,
  protopie,
  raindrop,
  recording01,
  recording03,
  roadmap1,
  roadmap2,
  roadmap3,
  roadmap4,
  searchMd,
  slack,
  sliders04,
  telegram,
  twitter,
  yourlogo,
} from "../assets";

export const navigation = [
  {
    id: "0",
    title: "Studio",
    url: "/studio",
  },
  {
    id: "1",
    title: "Fonctionnalités",
    url: "/#features",
  },
  {
    id: "2",
    title: "Tarifs",
    url: "/#pricing",
  },
  {
    id: "3",
    title: "Comment ça marche",
    url: "/#how-to-use",
  },
  {
    id: "4",
    title: "Roadmap",
    url: "/#roadmap",
  },
  {
    id: "5",
    title: "Créer un compte",
    url: "#signup",
    onlyMobile: true,
  },
  {
    id: "6",
    title: "Connexion",
    url: "#login",
    onlyMobile: true,
  },
];

export const heroIcons = [homeSmile, file02, searchMd, plusSquare];

export const notificationImages = [notification4, notification3, notification2];

export const companyLogos = [yourlogo, yourlogo, yourlogo, yourlogo, yourlogo];

export const brainwaveServices = [
  "Analyse IA du mix",
  "Traitement audio avancé",
  "Effets en temps réel",
];

export const brainwaveServicesIcons = [
  recording03,
  recording01,
  disc02,
  chromecast,
  sliders04,
];

export const roadmap = [
  {
    id: "0",
    title: "Détection vocale",
    text: "Séparation automatique des stems (voix, instruments) pour un mixage précis et des remixes créatifs.",
    date: "T1 2025",
    status: "done",
    imageUrl: roadmap1,
    colorful: true,
  },
  {
    id: "1",
    title: "Mastering IA",
    text: "Mastering automatique de vos tracks avec des algorithmes d'IA pour un son professionnel en un clic.",
    date: "T2 2025",
    status: "progress",
    imageUrl: roadmap2,
  },
  {
    id: "2",
    title: "Plugins VST",
    text: "Intégration directe dans vos DAW préférés (Ableton, FL Studio, Logic Pro) via des plugins VST/AU.",
    date: "T3 2025",
    status: "done",
    imageUrl: roadmap3,
  },
  {
    id: "3",
    title: "Collaboration temps réel",
    text: "Travaillez sur vos projets audio en temps réel avec d'autres créateurs, où qu'ils soient.",
    date: "T4 2025",
    status: "progress",
    imageUrl: roadmap4,
  },
];

export const collabText =
  "Avec des algorithmes d'IA avancés et une sécurité de niveau professionnel, c'est la solution parfaite pour les créateurs qui veulent travailler plus intelligemment.";

export const collabContent = [
  {
    id: "0",
    title: "Intégration fluide",
    text: collabText,
  },
  {
    id: "1",
    title: "Automatisation intelligente",
  },
  {
    id: "2",
    title: "Sécurité maximale",
  },
];

export const collabApps = [
  {
    id: "0",
    title: "Figma",
    icon: figma,
    width: 26,
    height: 36,
  },
  {
    id: "1",
    title: "Notion",
    icon: notion,
    width: 34,
    height: 36,
  },
  {
    id: "2",
    title: "Discord",
    icon: discord,
    width: 36,
    height: 28,
  },
  {
    id: "3",
    title: "Slack",
    icon: slack,
    width: 34,
    height: 35,
  },
  {
    id: "4",
    title: "Photoshop",
    icon: photoshop,
    width: 34,
    height: 34,
  },
  {
    id: "5",
    title: "Protopie",
    icon: protopie,
    width: 34,
    height: 34,
  },
  {
    id: "6",
    title: "Framer",
    icon: framer,
    width: 26,
    height: 34,
  },
  {
    id: "7",
    title: "Raindrop",
    icon: raindrop,
    width: 38,
    height: 32,
  },
];

export const pricing = [
  {
    id: "0",
    title: "Gratuit",
    description: "Analyse IA, effets basiques",
    price: "0",
    features: [
      "Analyse IA de vos fichiers audio",
      "Effets de base (pitch, speed)",
      "Jusqu'à 5 fichiers par mois",
    ],
  },
  {
    id: "1",
    title: "Pro",
    description: "Effets avancés, support prioritaire, exports illimités",
    price: "9.99",
    features: [
      "Tous les effets audio avancés",
      "Exports illimités en haute qualité",
      "Support prioritaire 24/7",
    ],
  },
  {
    id: "2",
    title: "Studio",
    description: "Solution complète pour professionnels",
    price: null,
    features: [
      "API dédiée pour intégration",
      "Traitement batch illimité",
      "Support technique dédié",
    ],
  },
];

export const benefits = [
  {
    id: "0",
    title: "Analyse intelligente",
    text: "Obtenez un diagnostic précis de votre mix grâce à l'IA. Balance fréquentielle, dynamique, et recommandations professionnelles.",
    backgroundUrl: "./src/assets/benefits/card-1.svg",
    iconUrl: benefitIcon1,
    imageUrl: benefitImage2,
  },
  {
    id: "1",
    title: "Effets en temps réel",
    text: "Appliquez des transformations audio instantanément : pitch shift, time stretch, Nightcore et bien plus encore.",
    backgroundUrl: "./src/assets/benefits/card-2.svg",
    iconUrl: benefitIcon2,
    imageUrl: benefitImage2,
    light: true,
  },
  {
    id: "2",
    title: "Accessible partout",
    text: "Travaillez sur vos projets audio depuis n'importe quel appareil, à tout moment, sans installation.",
    backgroundUrl: "./src/assets/benefits/card-3.svg",
    iconUrl: benefitIcon3,
    imageUrl: benefitImage2,
  },
  {
    id: "3",
    title: "Traitement rapide",
    text: "Des algorithmes optimisés pour un traitement audio ultra-rapide, même sur des fichiers volumineux.",
    backgroundUrl: "./src/assets/benefits/card-4.svg",
    iconUrl: benefitIcon4,
    imageUrl: benefitImage2,
    light: true,
  },
  {
    id: "4",
    title: "Interface intuitive",
    text: "Une interface pensée pour les créateurs : simple, élégante et efficace pour se concentrer sur l'essentiel.",
    backgroundUrl: "./src/assets/benefits/card-5.svg",
    iconUrl: benefitIcon1,
    imageUrl: benefitImage2,
  },
  {
    id: "5",
    title: "Qualité professionnelle",
    text: "Des outils de niveau studio pour beatmakers, chanteurs, rappeurs et ingénieurs du son.",
    backgroundUrl: "./src/assets/benefits/card-6.svg",
    iconUrl: benefitIcon2,
    imageUrl: benefitImage2,
  },
];

export const socials = [
  {
    id: "0",
    title: "Discord",
    iconUrl: discordBlack,
    url: "#",
  },
  {
    id: "1",
    title: "Twitter",
    iconUrl: twitter,
    url: "#",
  },
  {
    id: "2",
    title: "Instagram",
    iconUrl: instagram,
    url: "#",
  },
  {
    id: "3",
    title: "Telegram",
    iconUrl: telegram,
    url: "#",
  },
  {
    id: "4",
    title: "Facebook",
    iconUrl: facebook,
    url: "#",
  },
];
