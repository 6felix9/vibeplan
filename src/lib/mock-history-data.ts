export interface HistoryItinerary {
  id: string;
  plannedAt: string;
  budgetRange: string;
  vibe: string;
  description: string;
  itinerary: {
    title: string;
    summary: {
      intro: string;
      description: string;
      budget: string;
      duration: string;
      area: string;
      perks: string;
    };
    activities: {
      id: number;
      time: string;
      title: string;
      description: string;
      location: string;
      price: string;
      discount?: string;
      tags: string[];
      source_link?: string;
      source_type?: string;
      coordinates: {
        lat: number;
        lng: number;
      };
    }[];
  };
}

export const mockHistoryItineraries: HistoryItinerary[] = [
  {
    id: "history-1",
    plannedAt: "May 18, 2026",
    budgetRange: "Under S$60 / pax",
    vibe: "Chill Outdoors",
    description: "An easygoing coastal date featuring breezy bike rides, beachfront brunch, and a golden hawker dinner.",
    itinerary: {
      title: "Chill East Coast Coastal Escape",
      summary: {
        intro: "A coastal-themed itinerary that balances outdoor activity with relaxing food stops along Singapore's East Coast.",
        description: "Perfect for couples or friends looking for fresh air, scenic views, and quality local food without heavy walking.",
        budget: "S$40 - S$60 per person",
        duration: "10:00 AM - 8:30 PM",
        area: "East Coast Park & Marine Parade",
        perks: "Great sea views, bike rental friendly, and classic local hawker food to close the day.",
      },
      activities: [
        {
          id: 1,
          time: "10:00 AM",
          title: "Biking along East Coast Park",
          description: "Rent a bicycle from GoCycling near Area C and enjoy a breezy morning ride along the coastal track.",
          location: "East Coast Park",
          price: "S$8 - S$12",
          tags: ["outdoors", "scenic", "active"],
          source_link: "https://www.nparks.gov.sg/gardens-parks-and-nature/parks-and-nature-reserves/east-coast-park",
          source_type: "web",
          coordinates: {
            lat: 1.3005,
            lng: 103.9126,
          },
        },
        {
          id: 2,
          time: "12:30 PM",
          title: "Brunch at East Coast Commune",
          description: "Recharge at this beautiful, cozy cafe with sourdough sandwiches, specialty coffee, and botanical interiors.",
          location: "Marine Cove",
          price: "S$22 - S$35",
          discount: "10% Off Coffee",
          tags: ["brunch", "cafe", "cozy"],
          source_link: "https://www.eccommune.com/",
          source_type: "web",
          coordinates: {
            lat: 1.3015,
            lng: 103.9054,
          },
        },
        {
          id: 3,
          time: "3:30 PM",
          title: "Coastal Sunset Walk & Gelato",
          description: "Walk off brunch towards the Parkland Green sector and grab a scoop of artisanal gelato at Birds of Paradise.",
          location: "Parkland Green",
          price: "S$6 - S$10",
          tags: ["sweet-treat", "views", "walk"],
          source_link: "https://www.instagram.com/bopgelato/",
          source_type: "web",
          coordinates: {
            lat: 1.2985,
            lng: 103.9022,
          },
        },
        {
          id: 4,
          time: "6:30 PM",
          title: "Dinner at East Coast Lagoon Food Village",
          description: "End the day with local culinary favorites like BBQ chicken wings, satay, and sugarcane juice right by the beach.",
          location: "East Coast Park Area E",
          price: "S$12 - S$20",
          tags: ["hawker", "dinner", "local-food"],
          source_link: "https://www.visitsingapore.com/see-do-singapore/architecture/modern/east-coast-lagoon-food-village/",
          source_type: "web",
          coordinates: {
            lat: 1.3072,
            lng: 103.9351,
          },
        },
      ],
    },
  },
  {
    id: "history-2",
    plannedAt: "May 15, 2026",
    budgetRange: "S$60 - S$120 / pax",
    vibe: "Artsy & Indulgent",
    description: "An arts-focused journey around the Civic District, complete with modern art installations and rooftop mocktails.",
    itinerary: {
      title: "Civic District Cultural Walk",
      summary: {
        intro: "A premium, fully air-conditioned afternoon experience for art lovers looking to explore world-class galleries and chic rooftop spots.",
        description: "Features indoor exhibitions, historical architecture, and scenic views of the Marina Bay skyline.",
        budget: "S$70 - S$110 per person",
        duration: "1:00 PM - 9:00 PM",
        area: "Civic District & City Hall",
        perks: "Rainproof, visual design, photography, and premium sunset views.",
      },
      activities: [
        {
          id: 1,
          time: "1:00 PM",
          title: "Exhibitions at National Gallery Singapore",
          description: "Explore the world's largest public collection of Singapore and Southeast Asian modern art in the former Supreme Court and City Hall.",
          location: "St. Andrew's Road",
          price: "S$20",
          tags: ["museum", "art", "indoors"],
          source_link: "https://www.nationalgallery.sg/",
          source_type: "web",
          coordinates: {
            lat: 1.2905,
            lng: 103.8515,
          },
        },
        {
          id: 2,
          time: "4:00 PM",
          title: "Afternoon Coffee & Design at National Design Centre",
          description: "Browse curated local design shops and enjoy a clean, single-origin filter brew in the open atrium space.",
          location: "Middle Road",
          price: "S$8 - S$15",
          tags: ["coffee", "design", "shopping"],
          source_link: "https://www.designsingapore.org/national-design-centre.html",
          source_type: "web",
          coordinates: {
            lat: 1.3012,
            lng: 103.8532,
          },
        },
        {
          id: 3,
          time: "6:00 PM",
          title: "Dinner at National Kitchen by Violet Oon",
          description: "Indulge in high-end, authentically styled Peranakan dishes inside the historically restored National Gallery hall.",
          location: "National Gallery Singapore",
          price: "S$45 - S$75",
          discount: "Chef's Special Treat",
          tags: ["peranakan", "dinner", "premium"],
          source_link: "https://violetoon.com/national-kitchen-by-violet-oon-national-gallery-singapore/",
          source_type: "web",
          coordinates: {
            lat: 1.2905,
            lng: 103.8515,
          },
        },
        {
          id: 4,
          time: "8:00 PM",
          title: "Rooftop Drinks at Smoke & Mirrors",
          description: "Sip creative, art-inspired craft cocktails or mocktails while enjoying panoramic views of the Marina Bay Sands skyline.",
          location: "National Gallery Rooftop",
          price: "S$22 - S$35",
          tags: ["drinks", "views", "nightlife"],
          source_link: "https://www.smokeandmirrors.com.sg/",
          source_type: "web",
          coordinates: {
            lat: 1.2902,
            lng: 103.8517,
          },
        },
      ],
    },
  },
  {
    id: "history-3",
    plannedAt: "May 10, 2026",
    budgetRange: "Under S$30 / pax",
    vibe: "Cultural Foodie",
    description: "An affordable food and history crawl through Chinatown and Outram, perfect for discovering local secrets.",
    itinerary: {
      title: "Chinatown Heritage & Hawker Trail",
      summary: {
        intro: "A wallet-friendly exploration of Chinatown's rich heritage sites coupled with Michelin-approved hawker bites.",
        description: "Ideal for foodie adventurers who love history, temples, local coffee, and colorful street murals.",
        budget: "S$20 - S$30 per person",
        duration: "11:00 AM - 5:30 PM",
        area: "Chinatown & Outram",
        perks: "Extremely affordable, rich cultural highlights, and highly walkable.",
      },
      activities: [
        {
          id: 1,
          time: "11:00 AM",
          title: "Traditional Nanyang Toast at Ya Kun",
          description: "Start with charcoal-grilled kaya toast, soft boiled eggs, and a strong cup of traditional Kopi at the original Far East Square outlet.",
          location: "China Street",
          price: "S$6 - S$8",
          tags: ["breakfast", "local", "traditional"],
          source_link: "https://yakun.com/",
          source_type: "web",
          coordinates: {
            lat: 1.2828,
            lng: 103.8483,
          },
        },
        {
          id: 2,
          time: "12:30 PM",
          title: "Explore Buddha Tooth Relic Temple",
          description: "Step inside this majestic Tang-styled Chinese Buddhist temple to view the detailed artwork and peaceful roof garden.",
          location: "South Bridge Road",
          price: "Free",
          tags: ["temple", "culture", "landmark"],
          source_link: "https://www.buddhatoothrelictemple.org.sg/",
          source_type: "web",
          coordinates: {
            lat: 1.2815,
            lng: 103.8443,
          },
        },
        {
          id: 3,
          time: "2:00 PM",
          title: "Michelin Hawker Lunch at Chinatown Complex",
          description: "Taste world-renowned hawker dishes like soya sauce chicken rice, handmade dumplings, and traditional local desserts.",
          location: "Smith Street",
          price: "S$6 - S$12",
          discount: "Michelin Guide Pick",
          tags: ["hawker", "lunch", "foodie"],
          source_link: "https://www.visitsingapore.com/see-do-singapore/places-to-see/chinatown/",
          source_type: "web",
          coordinates: {
            lat: 1.2823,
            lng: 103.8439,
          },
        },
        {
          id: 4,
          time: "4:00 PM",
          title: "Mural Hunting in Everton Park",
          description: "Wander through the quiet pre-war shophouse streets of Everton Park to spot beautiful heritage murals painted by Yip Yew Chong.",
          location: "Everton Road",
          price: "Free",
          tags: ["street-art", "walk", "photos"],
          source_link: "https://yipyc.com/blog/2015/09/16/everton-road-murals/",
          source_type: "web",
          coordinates: {
            lat: 1.2778,
            lng: 103.8394,
          },
        },
      ],
    },
  },
];
