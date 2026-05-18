export type HomeActivity = {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  price: string;
  time: string;
  location: string;
  discount?: string;
  vibe: string;
  tags: string[];
  imageClass: string;
  noteClass: string;
};

export const homeActivities: HomeActivity[] = [
  {
    id: "midnight-pottery",
    title: "Midnight Pottery Jam",
    category: "Artsy",
    description:
      "Clay, playlists, and a tiny dessert bar after dark. Good for dates that need less talking and more making.",
    image:
      "https://images.unsplash.com/photo-1493106819501-66d381c466f1?auto=format&fit=crop&w=900&q=80",
    price: "$28 per pax",
    time: "Fri, 8:30 PM",
    location: "Tiong Bahru Studio",
    discount: "2-for-1 after 8 PM",
    vibe: "Hands-on, low pressure, cozy",
    tags: ["Date", "Indoor", "Workshop"],
    imageClass: "h-28 sm:h-48",
    noteClass: "rotate-[-1.5deg]",
  },
  {
    id: "rooftop-cinema",
    title: "Rooftop Cinema Picnic",
    category: "Event",
    description:
      "Outdoor movie night with beanbags, skyline views, and snack bundles cheaper than the usual dinner plan.",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80",
    price: "$18 entry",
    time: "Sat, 7:15 PM",
    location: "Bugis Rooftop",
    discount: "Student tickets available",
    vibe: "Breezy, cinematic, casual",
    tags: ["Movie", "Outdoor", "Promo"],
    imageClass: "h-32 sm:h-60",
    noteClass: "rotate-[1deg]",
  },
  {
    id: "ramen-stamp",
    title: "Hidden Ramen Stamp Trail",
    category: "Food",
    description:
      "Three tiny ramen counters, one stamp card, and a free gyoza reward if you finish the route.",
    image:
      "https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=900&q=80",
    price: "$12-$22",
    time: "Daily, lunch onward",
    location: "Orchard to Dhoby Ghaut",
    discount: "Free side on final stop",
    vibe: "Tasty, walkable, a little competitive",
    tags: ["Food", "Walk", "Discount"],
    imageClass: "h-24 sm:h-44",
    noteClass: "rotate-[0.5deg]",
  },
  {
    id: "neon-bouldering",
    title: "Neon Bouldering Night",
    category: "Sports",
    description:
      "Beginner-friendly climbing with glow holds, rental shoes, and instructors walking the floor.",
    image:
      "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=900&q=80",
    price: "$24 with rentals",
    time: "Wed, 6:00 PM",
    location: "Kallang",
    vibe: "Active, social, beginner-safe",
    tags: ["Fitness", "Group", "Indoor"],
    imageClass: "h-[7.5rem] sm:h-56",
    noteClass: "rotate-[-0.5deg]",
  },
  {
    id: "indie-market",
    title: "Indie Makers Market",
    category: "Shopping",
    description:
      "Local candles, zines, ceramics, thrift racks, and a coffee cart tucked into the back lane.",
    image:
      "https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=900&q=80",
    price: "Free entry",
    time: "Sun, 11:00 AM",
    location: "Joo Chiat",
    discount: "Bundle deals at 4 stalls",
    vibe: "Browsey, sunny, easy to leave",
    tags: ["Market", "Thrift", "Cafe"],
    imageClass: "h-28 sm:h-48",
    noteClass: "rotate-[1.5deg]",
  },
  {
    id: "mystery-dessert",
    title: "Mystery Dessert Counter",
    category: "Offer",
    description:
      "A rotating secret plated dessert menu. Tell them your mood and they pick the flavor profile.",
    image:
      "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=80",
    price: "$9-$16",
    time: "Thu-Sun, 3:00 PM",
    location: "Haji Lane",
    discount: "15% off before 5 PM",
    vibe: "Sweet, spontaneous, low commitment",
    tags: ["Dessert", "Cafe", "Deal"],
    imageClass: "h-[7.5rem] sm:h-56",
    noteClass: "rotate-[-1deg]",
  },
  {
    id: "sunrise-kayak",
    title: "Sunrise Kayak Loop",
    category: "Outdoor",
    description:
      "Calm-water route with guide, dry bag, and breakfast kopi at the finish point.",
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
    price: "$35 per pax",
    time: "Sat, 6:45 AM",
    location: "Punggol Waterway",
    vibe: "Fresh air, quiet, worth waking up",
    tags: ["Outdoor", "Morning", "Water"],
    imageClass: "h-36 sm:h-72",
    noteClass: "rotate-[0.75deg]",
  },
  {
    id: "arcade-hour",
    title: "Retro Arcade Hour",
    category: "Games",
    description:
      "Unlimited tokens for a one-hour window, with old fighting cabinets and rhythm games in the back.",
    image:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80",
    price: "$14 pass",
    time: "Mon-Thu, 5:00 PM",
    location: "Somerset",
    discount: "Weekday off-peak pass",
    vibe: "Fast, nostalgic, group-friendly",
    tags: ["Games", "Indoor", "Budget"],
    imageClass: "h-24 sm:h-40",
    noteClass: "rotate-[-1.25deg]",
  },
  {
    id: "gallery-afterhours",
    title: "Gallery Afterhours",
    category: "Culture",
    description:
      "Late gallery entry, mini curator talks, and a quiet courtyard bar with mocktails under $10.",
    image:
      "https://images.unsplash.com/photo-1545987796-200677ee1011?auto=format&fit=crop&w=900&q=80",
    price: "$10 entry",
    time: "Fri, 7:00 PM",
    location: "Civic District",
    vibe: "Polished, calm, conversation-ready",
    tags: ["Museum", "Night", "Artsy"],
    imageClass: "h-[7.5rem] sm:h-52",
    noteClass: "rotate-[1.25deg]",
  },
];

export const homeActivityCategories = [
  "All",
  ...Array.from(new Set(homeActivities.map((activity) => activity.category))),
];
