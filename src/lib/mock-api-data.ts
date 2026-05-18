export const mockItinerary = {
  title: "A Chill Singapore Day With Food, Views, and Late Drinks",
  summary: {
    intro:
      "Ease into the day with a compact route that keeps travel time low while mixing food, city views, and a relaxed evening stop.",
    description:
      "This mock itinerary is designed for local development while live API integrations are paused. It uses realistic Singapore venues, prices, coordinates, tags, and source links so the results, map, timeline, and explore pages can be exercised end to end.",
    budget: "Around S$55-S$85 per person before optional drinks",
    duration: "12:00 PM - 9:30 PM",
    area: "Tiong Bahru, Marina Bay, Chinatown, and Ann Siang",
    perks: "Short hops, flexible pacing, photo-friendly stops, and several budget control points",
  },
  activities: [
    {
      id: 1,
      time: "12:00 PM",
      title: "Brunch at Tiong Bahru Bakery",
      description:
        "Start with pastries, coffee, and an easy neighborhood walk. Keep this stop flexible so the group can ease into the plan without rushing.",
      location: "Tiong Bahru",
      price: "S$18-S$28",
      discount: "Mock deal",
      tags: ["brunch", "coffee", "casual"],
      source_link: "https://www.tiongbahrubakery.com/",
      source_type: "web",
      coordinates: {
        lat: 1.2846,
        lng: 103.8326,
      },
    },
    {
      id: 2,
      time: "2:00 PM",
      title: "Gallery Hop at National Gallery Singapore",
      description:
        "Spend the early afternoon indoors with a calm cultural stop. The building itself gives the itinerary a strong visual anchor even before you get into the exhibitions.",
      location: "Civic District",
      price: "S$20",
      tags: ["museum", "culture", "indoors"],
      source_link: "https://www.nationalgallery.sg/",
      source_type: "web",
      coordinates: {
        lat: 1.2905,
        lng: 103.8515,
      },
    },
    {
      id: 3,
      time: "4:30 PM",
      title: "Golden Hour Walk at Marina Bay",
      description:
        "Take a scenic loop around the waterfront while the light softens. This is the low-cost stretch of the day and gives the group room to talk, browse, or pause for photos.",
      location: "Marina Bay",
      price: "Free",
      tags: ["views", "walk", "photos"],
      source_link: "https://www.marinabaysands.com/attractions.html",
      source_type: "web",
      coordinates: {
        lat: 1.2834,
        lng: 103.8607,
      },
    },
    {
      id: 4,
      time: "6:30 PM",
      title: "Dinner at Chinatown Complex Food Centre",
      description:
        "Reset with a practical dinner stop that has enough variety for mixed preferences. Pick a few shared plates so everyone can tune the spend up or down.",
      location: "Chinatown",
      price: "S$8-S$18",
      discount: "Budget pick",
      tags: ["hawker", "dinner", "group-friendly"],
      source_link: "https://www.visitsingapore.com/see-do-singapore/places-to-see/chinatown/",
      source_type: "web",
      coordinates: {
        lat: 1.2823,
        lng: 103.8439,
      },
    },
    {
      id: 5,
      time: "8:30 PM",
      title: "Drinks Around Ann Siang Hill",
      description:
        "End with a compact nightlife area where the group can choose between a quiet cocktail bar or a livelier drink. It keeps the final stop walkable from dinner and easy to extend.",
      location: "Ann Siang Hill",
      price: "S$18-S$32",
      tags: ["drinks", "nightlife", "date-night"],
      source_link: "https://www.visitsingapore.com/see-do-singapore/places-to-see/chinatown/ann-siang-hill-club-street/",
      source_type: "web",
      coordinates: {
        lat: 1.2808,
        lng: 103.8469,
      },
    },
  ],
};

export const mockPublicItineraries = [
  {
    id: "mock-itinerary-1",
    query: "Chill food and views day in Singapore",
    created_at: new Date().toISOString(),
    activities: ["Food", "Sightseeing", "Nightlife"],
    budget: 2,
    num_pax: "2",
    mbti: "ENFP",
    spicy: true,
    itinerary_data: mockItinerary,
    user_id: "mock-user-1",
    user_profile: {
      user_id: "mock-user-1",
      avatar_url: null,
      full_name: "Mock User",
      name: "Mock User",
    },
  },
  {
    id: "mock-itinerary-2",
    query: "Budget-friendly museum and hawker plan",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    activities: ["Culture", "Food", "Walking"],
    budget: 1,
    num_pax: "4",
    mbti: "INFJ",
    spicy: false,
    itinerary_data: {
      ...mockItinerary,
      title: "Budget Museum, Waterfront, and Hawker Evening",
      summary: {
        ...mockItinerary.summary,
        budget: "Around S$35-S$55 per person",
        perks: "Mostly free movement, one paid culture stop, and affordable dinner options",
      },
    },
    user_id: "mock-user-2",
    user_profile: {
      user_id: "mock-user-2",
      avatar_url: null,
      full_name: "Demo Planner",
      name: "Demo Planner",
    },
  },
];
