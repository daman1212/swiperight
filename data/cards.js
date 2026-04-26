// SwipeRight — Card Rewards Database
// Rates sourced from card issuer benefit guides (as of 2024-2025)
// Categories: grocery, dining, gas, travel, online, pharmacy, streaming, wholesale, target, amazon, apple, other

const CARDS_DB = [
  // ── AMERICAN EXPRESS ──────────────────────────────────────
  {
    id: "amex-platinum",
    name: "Platinum Card",
    issuer: "American Express",
    network: "Amex",
    color: ["#9ca3af","#e5e7eb"],
    annual_fee: 695,
    rates: { travel:5, flights:5, hotels:5, dining:1, grocery:1, gas:1, online:1, pharmacy:1, streaming:1, wholesale:1, other:1 },
    perks: ["Airport lounge access","$200 travel credit","$200 Uber Cash","Global Entry credit"],
    best_for: "travel"
  },
  {
    id: "amex-gold",
    name: "Gold Card",
    issuer: "American Express",
    network: "Amex",
    color: ["#92400e","#d97706"],
    annual_fee: 250,
    rates: { dining:4, grocery:4, flights:3, travel:1, gas:1, online:1, pharmacy:1, streaming:1, wholesale:1, other:1 },
    perks: ["$120 dining credit","$120 Uber Cash","No foreign transaction fee"],
    best_for: "dining & groceries"
  },
  {
    id: "amex-bce",
    name: "Blue Cash Everyday",
    issuer: "American Express",
    network: "Amex",
    color: ["#0c4a6e","#0284c7"],
    annual_fee: 0,
    rates: { grocery:3, online:3, gas:2, streaming:3, dining:1, travel:1, pharmacy:1, wholesale:1, other:1 },
    perks: ["$200 welcome bonus","No annual fee","Disney Bundle credit"],
    best_for: "groceries & streaming"
  },
  {
    id: "amex-bcp",
    name: "Blue Cash Preferred",
    issuer: "American Express",
    network: "Amex",
    color: ["#1e3a8a","#3b82f6"],
    annual_fee: 95,
    rates: { grocery:6, streaming:6, transit:3, gas:3, dining:1, travel:1, online:1, pharmacy:1, wholesale:1, other:1 },
    perks: ["6% groceries (up to $6k/yr)","6% streaming","$300 welcome bonus"],
    best_for: "groceries"
  },

  // ── CHASE ──────────────────────────────────────────────────
  {
    id: "chase-sapphire-reserve",
    name: "Sapphire Reserve",
    issuer: "Chase",
    network: "Visa",
    color: ["#1e3a5f","#2563eb"],
    annual_fee: 550,
    rates: { travel:10, hotels:10, car_rental:10, dining:3, grocery:1, gas:1, online:1, pharmacy:1, streaming:1, other:1 },
    perks: ["$300 travel credit","Priority Pass lounge","Global Entry credit","Trip cancellation insurance"],
    best_for: "travel & dining"
  },
  {
    id: "chase-sapphire-preferred",
    name: "Sapphire Preferred",
    issuer: "Chase",
    network: "Visa",
    color: ["#1e3a5f","#1d4ed8"],
    annual_fee: 95,
    rates: { travel:5, dining:3, grocery:3, streaming:3, online:1, gas:1, pharmacy:1, wholesale:1, other:1 },
    perks: ["$50 hotel credit","60k point welcome bonus","Trip delay insurance"],
    best_for: "travel & dining"
  },
  {
    id: "chase-freedom-unlimited",
    name: "Freedom Unlimited",
    issuer: "Chase",
    network: "Visa",
    color: ["#1e3a5f","#0ea5e9"],
    annual_fee: 0,
    rates: { dining:3, pharmacy:3, travel:5, grocery:1.5, gas:1.5, online:1.5, streaming:1.5, wholesale:1.5, other:1.5 },
    perks: ["No annual fee","1.5% on everything","Pairs with Sapphire for more value"],
    best_for: "everyday spending"
  },
  {
    id: "chase-freedom-flex",
    name: "Freedom Flex",
    issuer: "Chase",
    network: "Mastercard",
    color: ["#1e3a5f","#06b6d4"],
    annual_fee: 0,
    rates: { rotating_quarterly:5, dining:3, pharmacy:3, travel:5, grocery:1, gas:1, online:1, other:1 },
    perks: ["5% rotating categories (up to $1,500/quarter)","No annual fee","Cell phone protection"],
    best_for: "rotating categories"
  },
  {
    id: "amazon-prime-visa",
    name: "Prime Visa",
    issuer: "Chase",
    network: "Visa",
    color: ["#0f172a","#1e293b"],
    annual_fee: 0,
    rates: { amazon:5, wholefoods:5, dining:2, gas:2, pharmacy:2, grocery:1, travel:1, streaming:1, other:1 },
    perks: ["5% at Amazon & Whole Foods","Requires Prime membership","No foreign transaction fee"],
    best_for: "Amazon shoppers"
  },

  // ── CAPITAL ONE ────────────────────────────────────────────
  {
    id: "cap1-venture-x",
    name: "Venture X",
    issuer: "Capital One",
    network: "Visa",
    color: ["#1e1b4b","#4338ca"],
    annual_fee: 395,
    rates: { travel:10, hotels:10, car_rental:10, flights:5, dining:2, grocery:2, gas:2, online:2, other:2 },
    perks: ["$300 travel credit","Airport lounge access","10k anniversary bonus miles"],
    best_for: "travel"
  },
  {
    id: "cap1-savor-one",
    name: "SavorOne",
    issuer: "Capital One",
    network: "Mastercard",
    color: ["#1c1917","#44403c"],
    annual_fee: 0,
    rates: { dining:3, grocery:3, entertainment:3, streaming:3, travel:5, gas:1, pharmacy:1, online:1, other:1 },
    perks: ["No annual fee","No foreign transaction fee","$200 welcome bonus"],
    best_for: "dining & entertainment"
  },

  // ── CITI ──────────────────────────────────────────────────
  {
    id: "citi-double-cash",
    name: "Double Cash",
    issuer: "Citi",
    network: "Mastercard",
    color: ["#111827","#374151"],
    annual_fee: 0,
    rates: { dining:2, grocery:2, gas:2, travel:2, online:2, pharmacy:2, streaming:2, wholesale:2, other:2 },
    perks: ["2% on everything (1% when buy, 1% when pay)","No annual fee","Simple flat-rate"],
    best_for: "simplicity & flat rate"
  },
  {
    id: "citi-custom-cash",
    name: "Custom Cash",
    issuer: "Citi",
    network: "Mastercard",
    color: ["#0f172a","#0e7490"],
    annual_fee: 0,
    rates: { top_category_auto:5, dining:1, grocery:1, gas:1, travel:1, online:1, pharmacy:1, streaming:1, other:1 },
    perks: ["5% on top eligible category each billing cycle (up to $500)","Auto-detects your most-spent category","No annual fee"],
    best_for: "flexible top category"
  },
  {
    id: "costco-visa",
    name: "Costco Anywhere Visa",
    issuer: "Citi",
    network: "Visa",
    color: ["#1e3a5f","#1d4ed8"],
    annual_fee: 0,
    rates: { gas:4, travel:3, dining:3, wholesale:2, grocery:1, online:1, pharmacy:1, streaming:1, other:1 },
    perks: ["4% gas (up to $7k/year)","3% restaurants & travel","Requires Costco membership"],
    best_for: "gas & Costco"
  },

  // ── WELLS FARGO ───────────────────────────────────────────
  {
    id: "wells-active-cash",
    name: "Active Cash",
    issuer: "Wells Fargo",
    network: "Visa",
    color: ["#78350f","#b45309"],
    annual_fee: 0,
    rates: { dining:2, grocery:2, gas:2, travel:2, online:2, pharmacy:2, streaming:2, wholesale:2, other:2 },
    perks: ["2% on everything","$200 welcome bonus","Cell phone protection"],
    best_for: "flat-rate cash back"
  },

  // ── DISCOVER ──────────────────────────────────────────────
  {
    id: "discover-it",
    name: "Discover it Cash Back",
    issuer: "Discover",
    network: "Discover",
    color: ["#7f1d1d","#dc2626"],
    annual_fee: 0,
    rates: { rotating_quarterly:5, dining:1, grocery:1, gas:1, travel:1, online:1, pharmacy:1, streaming:1, other:1 },
    perks: ["5% rotating categories (up to $1,500/quarter)","Cashback match first year","No annual fee"],
    best_for: "rotating categories"
  },

  // ── BANK OF AMERICA ───────────────────────────────────────
  {
    id: "boa-customized-cash",
    name: "Customized Cash Rewards",
    issuer: "Bank of America",
    network: "Visa",
    color: ["#7f1d1d","#b91c1c"],
    annual_fee: 0,
    rates: { chosen_category:3, grocery:2, wholesale:2, dining:1, gas:1, travel:1, online:1, pharmacy:1, streaming:1, other:1 },
    perks: ["3% on chosen category","2% grocery & wholesale (up to $2,500/quarter)","Preferred Rewards boosts"],
    best_for: "customizable rewards"
  },
  {
    id: "boa-travel-rewards",
    name: "Travel Rewards",
    issuer: "Bank of America",
    network: "Visa",
    color: ["#0c4a6e","#0369a1"],
    annual_fee: 0,
    rates: { travel:3, dining:2, grocery:1.5, gas:1.5, online:1.5, pharmacy:1.5, streaming:1.5, other:1.5 },
    perks: ["No annual fee","No foreign transaction fee","Preferred Rewards bonus up to 75%"],
    best_for: "no-fee travel"
  },

  // ── STORE CARDS ───────────────────────────────────────────
  {
    id: "target-redcard",
    name: "Target RedCard",
    issuer: "Target",
    network: "Mastercard",
    color: ["#7f1d1d","#b91c1c"],
    annual_fee: 0,
    rates: { target:5, dining:2, gas:2, grocery:1, travel:1, online:1, pharmacy:1, streaming:1, other:1 },
    perks: ["5% at Target stores & Target.com","Free shipping at Target.com","30-day extended returns"],
    best_for: "Target shoppers"
  },
  {
    id: "apple-card",
    name: "Apple Card",
    issuer: "Goldman Sachs",
    network: "Mastercard",
    color: ["#1c1c1e","#3a3a3c"],
    annual_fee: 0,
    rates: { apple:3, dining:2, grocery:2, gas:2, pharmacy:2, online:1, travel:1, streaming:1, wholesale:1, other:1 },
    perks: ["3% at Apple & select merchants","2% Apple Pay","Daily cash back","No fees ever"],
    best_for: "Apple ecosystem"
  },
];

// Store categories for matching
const STORES = [
  { id:"grocery",    label:"Grocery Store",  icon:"🛒", category:"grocery",   examples:"Safeway, Kroger, Publix, Trader Joe's" },
  { id:"dining",     label:"Restaurants",    icon:"🍽️", category:"dining",    examples:"Any restaurant, café, fast food" },
  { id:"gas",        label:"Gas Station",    icon:"⛽", category:"gas",       examples:"Shell, BP, Esso, Petro-Canada" },
  { id:"travel",     label:"Travel",         icon:"✈️", category:"travel",    examples:"Flights, hotels, car rental, Uber" },
  { id:"amazon",     label:"Amazon",         icon:"📦", category:"amazon",    examples:"Amazon.com, Amazon.ca" },
  { id:"target",     label:"Target",         icon:"🎯", category:"target",    examples:"Target stores & Target.com" },
  { id:"wholefoods", label:"Whole Foods",    icon:"🥦", category:"wholefoods",examples:"Whole Foods Market" },
  { id:"costco",     label:"Costco",         icon:"🏪", category:"wholesale", examples:"Costco, Sam's Club" },
  { id:"pharmacy",   label:"Pharmacy",       icon:"💊", category:"pharmacy",  examples:"CVS, Walgreens, Rite Aid" },
  { id:"streaming",  label:"Streaming",      icon:"🎬", category:"streaming", examples:"Netflix, Spotify, Disney+, Apple TV+" },
  { id:"apple",      label:"Apple Store",    icon:"🍎", category:"apple",     examples:"Apple.com, App Store, Apple hardware" },
  { id:"online",     label:"Online Shopping",icon:"🛍️", category:"online",    examples:"Any other online store" },
  { id:"other",      label:"Other / General",icon:"💳", category:"other",     examples:"Everywhere else" },
];

// Get the best rate for a card at a given category
function getRate(card, category) {
  return card.rates[category] || card.rates["other"] || 1;
}

// Get top card recommendations for a store + amount
function recommend(ownedCardIds, category, amount) {
  const owned = CARDS_DB.filter(c => ownedCardIds.includes(c.id));
  if (!owned.length) return { best: null, ranked: [], rejected: [] };

  const ranked = owned.map(card => {
    const rate = getRate(card, category);
    const earned = +(amount * rate / 100).toFixed(2);
    return { card, rate, earned };
  }).sort((a, b) => b.earned - a.earned);

  return {
    best: ranked[0],
    ranked: ranked.slice(0, 3),
    allRanked: ranked
  };
}
