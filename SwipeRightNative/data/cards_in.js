// Top 30 Indian credit cards across major banks (HDFC, SBI, ICICI, Axis, AmEx, etc.)
// All rewards in % cashback equivalent

export const CARDS_DB_IN = [
  // ── HDFC BANK ────────────────────────────────────────
  {
    id: 'hdfc-infinia', name: 'Infinia', issuer: 'HDFC Bank', network: 'visa',
    color: ['#1e1b4b', '#312e81'], annual_fee: 12500,
    rates: { travel:5, hotels:5, flights:5, dining:3.3, grocery:3.3, gas:3.3, online:3.3, pharmacy:3.3, streaming:3.3, wholesale:3.3, amazon:3.3, apple:3.3, other:3.3 },
    perks: ['Unlimited lounge access', 'Golf privileges', '1% fuel surcharge waiver'],
  },
  {
    id: 'hdfc-diners-black', name: 'Diners Club Black', issuer: 'HDFC Bank', network: 'mastercard',
    color: ['#0f172a', '#1e293b'], annual_fee: 10000,
    rates: { travel:10, hotels:10, dining:5, grocery:3.3, gas:3.3, online:3.3, pharmacy:3.3, streaming:3.3, wholesale:3.3, amazon:3.3, apple:3.3, flights:5, other:3.3 },
    perks: ['Unlimited lounge access worldwide', '10X on partner brands', 'Golf'],
  },
  {
    id: 'hdfc-regalia-gold', name: 'Regalia Gold', issuer: 'HDFC Bank', network: 'visa',
    color: ['#92400e', '#d97706'], annual_fee: 2500,
    rates: { travel:2, hotels:2, dining:2, grocery:2, gas:1, online:1.3, pharmacy:1.3, streaming:1.3, wholesale:1.3, amazon:1.3, apple:1.3, flights:2, other:1.3 },
    perks: ['12 lounge visits/year', 'Marriott points', 'Travel insurance'],
  },
  {
    id: 'hdfc-millennia', name: 'Millennia', issuer: 'HDFC Bank', network: 'visa',
    color: ['#0c4a6e', '#0284c7'], annual_fee: 1000,
    rates: { online:5, amazon:5, dining:1, grocery:1, gas:1, travel:1, pharmacy:1, streaming:1, wholesale:1, apple:1, flights:1, other:1 },
    perks: ['5% cashback on Amazon, Flipkart, Myntra', '4 lounge visits/year', 'Low fee'],
  },
  {
    id: 'hdfc-swiggy', name: 'Swiggy HDFC', issuer: 'HDFC Bank', network: 'mastercard',
    color: ['#7c2d12', '#ea580c'], annual_fee: 500,
    rates: { dining:10, online:5, amazon:5, grocery:1, gas:1, travel:1, pharmacy:1, streaming:1, wholesale:1, apple:1, flights:1, other:1 },
    perks: ['10% on Swiggy', '5% on online shopping', 'Swiggy One membership'],
  },
  {
    id: 'hdfc-tata-neu-infinity', name: 'Tata Neu Infinity', issuer: 'HDFC Bank', network: 'visa',
    color: ['#1e3a8a', '#3b82f6'], annual_fee: 1499,
    rates: { online:5, dining:1.5, grocery:5, gas:1.5, travel:1.5, pharmacy:1.5, streaming:1.5, wholesale:1.5, amazon:1.5, apple:1.5, flights:1.5, other:1.5 },
    perks: ['5% on Tata brands', '8 lounge visits/year', '1.5% on everything'],
  },
  {
    id: 'hdfc-indianoil', name: 'IndianOil HDFC', issuer: 'HDFC Bank', network: 'visa',
    color: ['#16a34a', '#15803d'], annual_fee: 500,
    rates: { gas:5, dining:1, grocery:1, travel:1, online:1, pharmacy:1, streaming:1, wholesale:1, amazon:1, apple:1, flights:1, other:1 },
    perks: ['5% fuel cashback at IOC', '1% on others', 'Fuel surcharge waiver'],
  },

  // ── SBI CARD ─────────────────────────────────────────
  {
    id: 'sbi-cashback', name: 'SBI Cashback', issuer: 'SBI Card', network: 'visa',
    color: ['#1e3a8a', '#1d4ed8'], annual_fee: 999,
    rates: { online:5, amazon:5, dining:1, grocery:1, gas:1, travel:1, pharmacy:1, streaming:1, wholesale:1, apple:1, flights:1, other:1 },
    perks: ['5% cashback on online', '1% offline', 'No category restrictions'],
  },
  {
    id: 'sbi-simplyclick', name: 'SimplyCLICK SBI', issuer: 'SBI Card', network: 'visa',
    color: ['#1e3a5f', '#2563eb'], annual_fee: 499,
    rates: { online:5, amazon:5, dining:1.25, grocery:1.25, gas:1, travel:2.5, pharmacy:1.25, streaming:1.25, wholesale:1.25, apple:1.25, flights:2.5, other:1.25 },
    perks: ['10X on partner sites', '5X on online', 'Cleartrip travel vouchers'],
  },
  {
    id: 'sbi-bpcl-octane', name: 'BPCL SBI Octane', issuer: 'SBI Card', network: 'visa',
    color: ['#dc2626', '#991b1b'], annual_fee: 1499,
    rates: { gas:7.25, dining:2.5, grocery:2.5, travel:1.25, online:1.25, pharmacy:1.25, streaming:1.25, wholesale:1.25, amazon:1.25, apple:1.25, flights:1.25, other:1.25 },
    perks: ['7.25% fuel value back at BPCL', '4 lounge visits/year', 'Welcome bonus'],
  },
  {
    id: 'sbi-elite', name: 'SBI Elite', issuer: 'SBI Card', network: 'visa',
    color: ['#1f2937', '#374151'], annual_fee: 4999,
    rates: { dining:5, grocery:5, online:1.25, gas:1.25, travel:5, pharmacy:1.25, streaming:1.25, wholesale:1.25, amazon:1.25, apple:1.25, flights:5, hotels:5, other:1.25 },
    perks: ['8 international lounge visits', '5X on dining/grocery/movies', 'Club Vistara silver'],
  },
  {
    id: 'sbi-prime', name: 'SBI Prime', issuer: 'SBI Card', network: 'visa',
    color: ['#581c87', '#7c3aed'], annual_fee: 2999,
    rates: { dining:5, grocery:5, online:1.25, gas:1.25, travel:1.25, pharmacy:1.25, streaming:1.25, wholesale:1.25, amazon:1.25, apple:1.25, flights:1.25, other:1.25 },
    perks: ['5X on dining, grocery, movies', '8 lounge visits', 'Birthday 20X bonus'],
  },

  // ── ICICI BANK ───────────────────────────────────────
  {
    id: 'icici-amazon-pay', name: 'Amazon Pay ICICI', issuer: 'ICICI Bank', network: 'visa',
    color: ['#0f172a', '#1e293b'], annual_fee: 0,
    rates: { amazon:5, online:2, dining:1, grocery:1, gas:1, travel:1, pharmacy:1, streaming:1, wholesale:1, apple:1, flights:1, other:1 },
    perks: ['5% on Amazon (Prime)', '2% on Amazon Pay merchants', 'Lifetime free'],
  },
  {
    id: 'icici-emeralde-private', name: 'Emeralde Private Metal', issuer: 'ICICI Bank', network: 'visa',
    color: ['#064e3b', '#047857'], annual_fee: 12499,
    rates: { travel:6, hotels:6, dining:6, grocery:3, gas:3, online:3, pharmacy:3, streaming:3, wholesale:3, amazon:3, apple:3, flights:6, other:3 },
    perks: ['Unlimited lounge access', '6 reward points/Rs 200', 'Taj Epicure membership'],
  },
  {
    id: 'icici-coral', name: 'Coral', issuer: 'ICICI Bank', network: 'visa',
    color: ['#ea580c', '#c2410c'], annual_fee: 500,
    rates: { dining:2, grocery:2, online:1, gas:1, travel:1, pharmacy:1, streaming:1, wholesale:1, amazon:1, apple:1, flights:1, other:1 },
    perks: ['2X on dining/grocery', 'Movie ticket discounts', 'Entry-level card'],
  },
  {
    id: 'icici-sapphiro', name: 'Sapphiro', issuer: 'ICICI Bank', network: 'visa',
    color: ['#1e3a8a', '#1d4ed8'], annual_fee: 6500,
    rates: { dining:4, grocery:4, online:2, gas:1.5, travel:4, pharmacy:2, streaming:2, wholesale:2, amazon:2, apple:2, flights:4, hotels:4, other:2 },
    perks: ['4 international lounge visits', '4X on dining/grocery', 'Golf privileges'],
  },

  // ── AXIS BANK ────────────────────────────────────────
  {
    id: 'axis-magnus', name: 'Magnus', issuer: 'Axis Bank', network: 'mastercard',
    color: ['#1e1b4b', '#3730a3'], annual_fee: 12500,
    rates: { travel:6, hotels:6, dining:6, grocery:1.2, gas:1.2, online:1.2, pharmacy:1.2, streaming:1.2, wholesale:1.2, amazon:1.2, apple:1.2, flights:6, other:1.2 },
    perks: ['Unlimited lounge access', '25K bonus per Rs 1L spend', 'Tata CLiQ vouchers'],
  },
  {
    id: 'axis-ace', name: 'ACE', issuer: 'Axis Bank', network: 'visa',
    color: ['#7c2d12', '#9a3412'], annual_fee: 499,
    rates: { dining:2, grocery:2, gas:2, online:2, travel:2, pharmacy:2, streaming:2, wholesale:2, amazon:2, apple:2, flights:2, other:2 },
    perks: ['2% flat cashback', '5% on Google Pay bills', '4 lounge visits/year'],
  },
  {
    id: 'axis-flipkart', name: 'Flipkart Axis', issuer: 'Axis Bank', network: 'mastercard',
    color: ['#1e3a8a', '#1d4ed8'], annual_fee: 500,
    rates: { online:5, amazon:1.5, dining:4, grocery:1.5, gas:1.5, travel:1.5, pharmacy:1.5, streaming:1.5, wholesale:1.5, apple:1.5, flights:1.5, other:1.5 },
    perks: ['5% on Flipkart, Cleartrip', '4% on Swiggy, Uber, PVR', '4 lounge visits'],
  },
  {
    id: 'axis-atlas', name: 'Atlas', issuer: 'Axis Bank', network: 'visa',
    color: ['#0f172a', '#1f2937'], annual_fee: 5000,
    rates: { travel:5, hotels:5, dining:2, grocery:2, gas:2, online:2, pharmacy:2, streaming:2, wholesale:2, amazon:2, apple:2, flights:5, other:2 },
    perks: ['5X EDGE Miles on travel', '8 international lounge visits', 'Airline transfers'],
  },
  {
    id: 'axis-vistara-signature', name: 'Vistara Signature', issuer: 'Axis Bank', network: 'visa',
    color: ['#581c87', '#7e22ce'], annual_fee: 3000,
    rates: { flights:4, travel:2, hotels:2, dining:2, grocery:2, gas:2, online:2, pharmacy:2, streaming:2, wholesale:2, amazon:2, apple:2, other:2 },
    perks: ['1 free Premium Economy ticket', 'Club Vistara silver', '8 lounge visits'],
  },

  // ── AMERICAN EXPRESS ─────────────────────────────────
  {
    id: 'amex-platinum-travel-in', name: 'Platinum Travel', issuer: 'American Express', network: 'amex',
    color: ['#9ca3af', '#d1d5db'], annual_fee: 5000,
    rates: { travel:5, flights:5, hotels:5, dining:1, grocery:1, gas:1, online:1, pharmacy:1, streaming:1, wholesale:1, amazon:1, apple:1, other:1 },
    perks: ['Travel vouchers worth Rs 30K', '8 lounge visits/year', 'Taj voucher'],
  },
  {
    id: 'amex-mrcc', name: 'Membership Rewards', issuer: 'American Express', network: 'amex',
    color: ['#0f172a', '#1e293b'], annual_fee: 1500,
    rates: { dining:2, grocery:2, online:2, gas:1, travel:2, pharmacy:1, streaming:1, wholesale:1, amazon:2, apple:1, flights:2, other:1 },
    perks: ['1000 bonus points/Rs 20K', '4 lounge visits/year', 'Welcome vouchers'],
  },
  {
    id: 'amex-platinum-reserve', name: 'Platinum Reserve', issuer: 'American Express', network: 'amex',
    color: ['#1f2937', '#374151'], annual_fee: 5000,
    rates: { dining:5, hotels:5, travel:3, grocery:1, gas:1, online:1, pharmacy:1, streaming:1, wholesale:1, amazon:1, apple:1, flights:3, other:1 },
    perks: ['Accor Plus membership', '8 lounge visits/year', 'Taj Epicure'],
  },

  // ── KOTAK / OTHERS ───────────────────────────────────
  {
    id: 'kotak-myntra', name: 'Myntra Kotak', issuer: 'Kotak Bank', network: 'visa',
    color: ['#be185d', '#ec4899'], annual_fee: 500,
    rates: { online:7.5, amazon:1.25, dining:1.25, grocery:1.25, gas:1.25, travel:1.25, pharmacy:1.25, streaming:1.25, wholesale:1.25, apple:1.25, flights:1.25, other:1.25 },
    perks: ['7.5% on Myntra', 'Welcome voucher', 'Movie ticket discounts'],
  },
  {
    id: 'kotak-white', name: 'White', issuer: 'Kotak Bank', network: 'visa',
    color: ['#e5e7eb', '#9ca3af'], annual_fee: 3000,
    rates: { dining:1.5, grocery:1.5, online:1.5, gas:1, travel:1.5, pharmacy:1.5, streaming:1.5, wholesale:1.5, amazon:1.5, apple:1.5, flights:1.5, other:1.5 },
    perks: ['Premium metal card', '6 lounge visits', 'Concierge'],
  },
  {
    id: 'idfc-first-power', name: 'FIRST Power Plus', issuer: 'IDFC FIRST Bank', network: 'visa',
    color: ['#7c2d12', '#dc2626'], annual_fee: 499,
    rates: { gas:5, online:1.5, dining:1, grocery:5, travel:1, pharmacy:1, streaming:1, wholesale:1, amazon:1, apple:1, flights:1, other:1 },
    perks: ['5% on HPCL fuel', '5% on grocery', 'Fuel surcharge waiver'],
  },
  {
    id: 'rbl-savemax', name: 'SaveMax', issuer: 'RBL Bank', network: 'mastercard',
    color: ['#7e22ce', '#9333ea'], annual_fee: 500,
    rates: { grocery:5, dining:1, online:1, gas:1, travel:1, pharmacy:1, streaming:1, wholesale:1, amazon:1, apple:1, flights:1, other:1 },
    perks: ['5X on grocery', '10% off Zomato/BookMyShow', 'Welcome bonus'],
  },
  {
    id: 'indusind-tiger', name: 'Tiger', issuer: 'IndusInd Bank', network: 'visa',
    color: ['#ca8a04', '#a16207'], annual_fee: 0,
    rates: { dining:2.5, travel:5, hotels:5, grocery:1.5, gas:1, online:1.5, pharmacy:1.5, streaming:1.5, wholesale:1.5, amazon:1.5, apple:1.5, flights:5, other:1.5 },
    perks: ['Premium metal card', 'Unlimited lounge access', 'Taj Epicure'],
  },
  {
    id: 'hsbc-live-plus', name: 'Live+', issuer: 'HSBC Bank', network: 'visa',
    color: ['#dc2626', '#991b1b'], annual_fee: 999,
    rates: { dining:10, grocery:10, online:1.5, gas:1.5, travel:1.5, pharmacy:1.5, streaming:1.5, wholesale:1.5, amazon:1.5, apple:1.5, flights:1.5, other:1.5 },
    perks: ['10% on dining/grocery (cap Rs 1K)', '1.5% unlimited cashback', '4 lounge visits'],
  },
];

// India banks (used for grouping in setup screen)
export const BANKS_IN = [
  { id: 'hdfc', label: 'HDFC Bank', shortLabel: 'HDFC', color: '#1e3a8a' },
  { id: 'sbi', label: 'SBI Card', shortLabel: 'SBI', color: '#1d4ed8' },
  { id: 'icici', label: 'ICICI Bank', shortLabel: 'ICICI', color: '#ea580c' },
  { id: 'axis', label: 'Axis Bank', shortLabel: 'Axis', color: '#7c2d12' },
  { id: 'amex', label: 'American Express', shortLabel: 'Amex', color: '#374151' },
  { id: 'kotak', label: 'Kotak Bank', shortLabel: 'Kotak', color: '#be185d' },
  { id: 'idfc', label: 'IDFC FIRST Bank', shortLabel: 'IDFC FIRST', color: '#dc2626' },
  { id: 'rbl', label: 'RBL Bank', shortLabel: 'RBL', color: '#9333ea' },
  { id: 'indusind', label: 'IndusInd Bank', shortLabel: 'IndusInd', color: '#a16207' },
  { id: 'hsbc', label: 'HSBC Bank', shortLabel: 'HSBC', color: '#991b1b' },
];

// Stores in India context (slightly different categories)
export const STORES_IN = [
  { id:'grocery',    label:'Grocery',          icon:'🛒', category:'grocery' },
  { id:'dining',     label:'Restaurants',      icon:'🍽️', category:'dining' },
  { id:'gas',        label:'Fuel',             icon:'⛽', category:'gas' },
  { id:'travel',     label:'Travel',           icon:'✈️', category:'travel' },
  { id:'amazon',     label:'Amazon',           icon:'📦', category:'amazon' },
  { id:'online',     label:'Online Shopping',  icon:'🛍️', category:'online' },
  { id:'pharmacy',   label:'Pharmacy',         icon:'💊', category:'pharmacy' },
  { id:'streaming',  label:'Streaming',        icon:'🎬', category:'streaming' },
  { id:'apple',      label:'Apple Store',      icon:'🍎', category:'apple' },
  { id:'wholesale',  label:'Wholesale',        icon:'🏪', category:'wholesale' },
  { id:'flights',    label:'Flights',          icon:'🛫', category:'flights' },
  { id:'other',      label:'Other',            icon:'💳', category:'other' },
];
