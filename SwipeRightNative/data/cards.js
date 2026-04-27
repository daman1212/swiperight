export const CARDS_DB = [
  // ── AMERICAN EXPRESS ──────────────────────────────────────
  {
    id: 'amex-platinum', name: 'Platinum Card', issuer: 'American Express', network: 'amex',
    color: ['#9ca3af', '#e5e7eb'], annual_fee: 695,
    rates: { travel:5, flights:5, hotels:5, dining:1, grocery:1, gas:1, online:1, pharmacy:1, streaming:1, wholesale:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['5x flights & hotels', 'Lounge access', '$200 travel credit'],
  },
  {
    id: 'amex-gold', name: 'Gold Card', issuer: 'American Express', network: 'amex',
    color: ['#92400e', '#d97706'], annual_fee: 250,
    rates: { dining:4, grocery:4, flights:3, travel:1, gas:1, online:1, pharmacy:1, streaming:1, wholesale:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['4x dining & groceries', '3x flights', '$120 dining credit'],
  },
  {
    id: 'amex-green', name: 'Green Card', issuer: 'American Express', network: 'amex',
    color: ['#064e3b', '#059669'], annual_fee: 150,
    rates: { travel:3, dining:3, transit:3, grocery:1, gas:1, online:1, pharmacy:1, streaming:1, wholesale:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['3x travel & dining', '3x transit', '$100 LoungeBuddy credit'],
  },
  {
    id: 'amex-bce', name: 'Blue Cash Everyday', issuer: 'American Express', network: 'amex',
    color: ['#0c4a6e', '#0284c7'], annual_fee: 0,
    rates: { grocery:3, online:3, streaming:3, gas:2, dining:1, travel:1, pharmacy:1, wholesale:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['3x groceries', '3x streaming', '2x gas'],
  },
  {
    id: 'amex-bcp', name: 'Blue Cash Preferred', issuer: 'American Express', network: 'amex',
    color: ['#1e3a8a', '#3b82f6'], annual_fee: 95,
    rates: { grocery:6, streaming:6, gas:3, transit:3, dining:1, travel:1, online:1, pharmacy:1, wholesale:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['6x groceries', '6x streaming', '3x gas & transit'],
  },
  {
    id: 'amex-blue-business-plus', name: 'Blue Business Plus', issuer: 'American Express', network: 'amex',
    color: ['#1e3a8a', '#2563eb'], annual_fee: 0,
    rates: { dining:2, grocery:2, gas:2, travel:2, online:2, pharmacy:2, streaming:2, wholesale:2, target:2, amazon:2, apple:2, other:2 },
    perks: ['2x on everything up to $50k', 'No annual fee', 'Business card'],
  },
  {
    id: 'amex-business-gold', name: 'Business Gold Card', issuer: 'American Express', network: 'amex',
    color: ['#78350f', '#d97706'], annual_fee: 375,
    rates: { dining:4, grocery:4, gas:4, online:4, travel:4, pharmacy:1, streaming:1, wholesale:1, target:1, amazon:4, apple:1, other:1 },
    perks: ['4x on top 2 categories', 'Auto-detects spending', '$240 digital credit'],
  },
  {
    id: 'amex-business-platinum', name: 'Business Platinum', issuer: 'American Express', network: 'amex',
    color: ['#6b7280', '#d1d5db'], annual_fee: 695,
    rates: { flights:5, hotels:5, travel:5, dining:1, grocery:1, gas:1, online:1.5, pharmacy:1, streaming:1, wholesale:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['5x flights & hotels', '1.5x on large purchases', 'Lounge access'],
  },
  {
    id: 'amex-hilton-honors', name: 'Hilton Honors', issuer: 'American Express', network: 'amex',
    color: ['#1e3a5f', '#1d4ed8'], annual_fee: 0,
    rates: { hotels:7, dining:5, grocery:5, gas:3, travel:3, online:1, pharmacy:1, streaming:1, wholesale:1, target:1, amazon:1, apple:1, other:3 },
    perks: ['7x Hilton hotels', '5x dining & grocery', 'No annual fee'],
  },
  {
    id: 'amex-hilton-surpass', name: 'Hilton Honors Surpass', issuer: 'American Express', network: 'amex',
    color: ['#1e3a5f', '#3b82f6'], annual_fee: 150,
    rates: { hotels:12, dining:6, grocery:6, gas:4, travel:3, online:1, pharmacy:1, streaming:1, wholesale:1, target:1, amazon:1, apple:1, other:3 },
    perks: ['12x Hilton hotels', '6x dining & grocery', 'Free night reward'],
  },
  {
    id: 'amex-marriott-bonvoy', name: 'Marriott Bonvoy', issuer: 'American Express', network: 'amex',
    color: ['#7f1d1d', '#b91c1c'], annual_fee: 125,
    rates: { hotels:6, dining:3, grocery:3, gas:2, travel:2, online:1, pharmacy:1, streaming:1, wholesale:1, target:1, amazon:1, apple:1, other:2 },
    perks: ['6x Marriott hotels', 'Free night reward', 'Silver Elite status'],
  },
  {
    id: 'amex-delta-gold', name: 'Delta SkyMiles Gold', issuer: 'American Express', network: 'amex',
    color: ['#1e3a5f', '#0ea5e9'], annual_fee: 150,
    rates: { flights:2, dining:2, grocery:2, travel:1, gas:1, online:1, pharmacy:1, streaming:1, wholesale:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['2x Delta flights', 'Free checked bag', '$100 Delta flight credit'],
  },
  {
    id: 'amex-delta-platinum', name: 'Delta SkyMiles Platinum', issuer: 'American Express', network: 'amex',
    color: ['#6b7280', '#9ca3af'], annual_fee: 350,
    rates: { flights:3, hotels:3, dining:2, grocery:2, travel:1, gas:1, online:1, pharmacy:1, streaming:1, wholesale:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['3x Delta flights', 'Companion certificate', 'MQM boosts'],
  },
  {
    id: 'amex-delta-reserve', name: 'Delta SkyMiles Reserve', issuer: 'American Express', network: 'amex',
    color: ['#0f172a', '#1e293b'], annual_fee: 650,
    rates: { flights:3, hotels:3, dining:1, grocery:1, travel:1, gas:1, online:1, pharmacy:1, streaming:1, wholesale:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['3x Delta flights', 'Delta Sky Club access', 'Companion certificate'],
  },
  {
    id: 'amex-blue-delta', name: 'Blue Delta SkyMiles', issuer: 'American Express', network: 'amex',
    color: ['#0c4a6e', '#075985'], annual_fee: 0,
    rates: { dining:2, flights:2, grocery:1, gas:1, travel:1, online:1, pharmacy:1, streaming:1, wholesale:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['2x dining & Delta flights', 'No annual fee', '20% inflight savings'],
  },

  // ── VISA ──────────────────────────────────────────────────
  {
    id: 'chase-sapphire-reserve', name: 'Sapphire Reserve', issuer: 'Chase', network: 'visa',
    color: ['#1e3a5f', '#2563eb'], annual_fee: 550,
    rates: { travel:10, hotels:10, dining:3, grocery:1, gas:1, online:1, pharmacy:1, streaming:1, wholesale:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['3x dining', '10x hotels', '$300 travel credit'],
  },
  {
    id: 'chase-sapphire-preferred', name: 'Sapphire Preferred', issuer: 'Chase', network: 'visa',
    color: ['#1e3a5f', '#1d4ed8'], annual_fee: 95,
    rates: { travel:5, dining:3, grocery:3, streaming:3, online:1, gas:1, pharmacy:1, wholesale:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['3x dining & groceries', '5x travel', '60k bonus points'],
  },
  {
    id: 'chase-freedom-unlimited', name: 'Freedom Unlimited', issuer: 'Chase', network: 'visa',
    color: ['#1e3a5f', '#0ea5e9'], annual_fee: 0,
    rates: { dining:3, pharmacy:3, travel:5, grocery:1.5, gas:1.5, online:1.5, streaming:1.5, wholesale:1.5, target:1.5, amazon:1.5, apple:1.5, other:1.5 },
    perks: ['1.5% on everything', '3x dining', '5x travel'],
  },
  {
    id: 'chase-freedom-flex', name: 'Freedom Flex', issuer: 'Chase', network: 'visa',
    color: ['#1e3a5f', '#06b6d4'], annual_fee: 0,
    rates: { dining:3, pharmacy:3, travel:5, grocery:1, gas:1, online:1, streaming:1, wholesale:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['5% rotating categories', '3x dining', 'No annual fee'],
  },
  {
    id: 'amazon-prime-visa', name: 'Prime Visa', issuer: 'Chase / Amazon', network: 'visa',
    color: ['#0f172a', '#1e293b'], annual_fee: 0,
    rates: { amazon:5, grocery:5, dining:2, gas:2, pharmacy:2, travel:1, online:1, streaming:1, wholesale:1, target:1, apple:1, other:1 },
    perks: ['5% Amazon & Whole Foods', '2% restaurants & gas'],
  },
  {
    id: 'chase-ink-preferred', name: 'Ink Business Preferred', issuer: 'Chase', network: 'visa',
    color: ['#1e3a5f', '#1d4ed8'], annual_fee: 95,
    rates: { travel:3, dining:3, streaming:3, online:3, grocery:1, gas:1, pharmacy:1, wholesale:1, target:1, amazon:3, apple:1, other:1 },
    perks: ['3x travel & categories', '100k bonus points', 'Cell phone protection'],
  },
  {
    id: 'chase-ink-unlimited', name: 'Ink Business Unlimited', issuer: 'Chase', network: 'visa',
    color: ['#1e3a5f', '#2563eb'], annual_fee: 0,
    rates: { dining:1.5, grocery:1.5, gas:1.5, travel:1.5, online:1.5, pharmacy:1.5, streaming:1.5, wholesale:1.5, target:1.5, amazon:1.5, apple:1.5, other:1.5 },
    perks: ['1.5% on everything', 'No annual fee', 'Business card'],
  },
  {
    id: 'chase-united-explorer', name: 'United Explorer', issuer: 'Chase', network: 'visa',
    color: ['#1e3a5f', '#0c4a6e'], annual_fee: 95,
    rates: { flights:2, dining:2, hotels:2, travel:1, grocery:1, gas:1, online:1, pharmacy:1, streaming:1, wholesale:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['2x United flights', 'Free checked bag', 'Priority boarding'],
  },
  {
    id: 'chase-marriott-boundless', name: 'Marriott Bonvoy Boundless', issuer: 'Chase', network: 'visa',
    color: ['#7f1d1d', '#dc2626'], annual_fee: 95,
    rates: { hotels:6, dining:3, grocery:3, gas:2, travel:2, online:1, pharmacy:1, streaming:1, wholesale:1, target:1, amazon:1, apple:1, other:2 },
    perks: ['6x Marriott hotels', 'Free night reward', 'Silver Elite status'],
  },
  {
    id: 'cap1-venture-x', name: 'Venture X', issuer: 'Capital One', network: 'visa',
    color: ['#1e1b4b', '#4338ca'], annual_fee: 395,
    rates: { travel:10, hotels:10, flights:5, dining:2, grocery:2, gas:2, online:2, pharmacy:2, streaming:2, wholesale:2, target:2, amazon:2, apple:2, other:2 },
    perks: ['10x hotels', '5x flights', '2x everything'],
  },
  {
    id: 'cap1-venture', name: 'Venture Rewards', issuer: 'Capital One', network: 'visa',
    color: ['#1e1b4b', '#6d28d9'], annual_fee: 95,
    rates: { travel:5, hotels:5, dining:2, grocery:2, gas:2, online:2, pharmacy:2, streaming:2, wholesale:2, target:2, amazon:2, apple:2, other:2 },
    perks: ['5x hotels & rental cars', '2x everything', '75k bonus miles'],
  },
  {
    id: 'cap1-savor-one', name: 'SavorOne', issuer: 'Capital One', network: 'visa',
    color: ['#1c1917', '#44403c'], annual_fee: 0,
    rates: { dining:3, grocery:3, streaming:3, entertainment:3, travel:5, gas:1, pharmacy:1, online:1, wholesale:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['3x dining & groceries', '3x streaming', 'No annual fee'],
  },
  {
    id: 'wells-active-cash', name: 'Active Cash', issuer: 'Wells Fargo', network: 'visa',
    color: ['#78350f', '#b45309'], annual_fee: 0,
    rates: { dining:2, grocery:2, gas:2, travel:2, online:2, pharmacy:2, streaming:2, wholesale:2, target:2, amazon:2, apple:2, other:2 },
    perks: ['2% on everything', '$200 welcome bonus'],
  },
  {
    id: 'wells-autograph', name: 'Autograph Card', issuer: 'Wells Fargo', network: 'visa',
    color: ['#7f1d1d', '#b91c1c'], annual_fee: 0,
    rates: { travel:3, dining:3, gas:3, streaming:3, transit:3, pharmacy:1, grocery:1, online:1, wholesale:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['3x travel, dining & gas', '3x streaming', 'No annual fee'],
  },
  {
    id: 'boa-travel-rewards', name: 'Travel Rewards', issuer: 'Bank of America', network: 'visa',
    color: ['#7f1d1d', '#b91c1c'], annual_fee: 0,
    rates: { travel:1.5, dining:1.5, grocery:1.5, gas:1.5, online:1.5, pharmacy:1.5, streaming:1.5, wholesale:1.5, target:1.5, amazon:1.5, apple:1.5, other:1.5 },
    perks: ['1.5x on everything', 'No annual fee', 'No foreign transaction fee'],
  },
  {
    id: 'boa-customized-cash', name: 'Customized Cash Rewards', issuer: 'Bank of America', network: 'visa',
    color: ['#7f1d1d', '#991b1b'], annual_fee: 0,
    rates: { dining:1, grocery:2, gas:3, travel:1, online:3, pharmacy:1, streaming:1, wholesale:2, target:1, amazon:3, apple:1, other:1 },
    perks: ['3% chosen category', '2% grocery & wholesale'],
  },
  {
    id: 'costco-visa', name: 'Costco Anywhere Visa', issuer: 'Citi', network: 'visa',
    color: ['#1e3a5f', '#1d4ed8'], annual_fee: 0,
    rates: { gas:4, travel:3, dining:3, wholesale:2, grocery:1, online:1, pharmacy:1, streaming:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['4% gas', '3% restaurants & travel', '2% Costco'],
  },
  {
    id: 'target-redcard', name: 'Target RedCard', issuer: 'Target', network: 'visa',
    color: ['#7f1d1d', '#b91c1c'], annual_fee: 0,
    rates: { target:5, dining:2, gas:2, grocery:1, travel:1, online:1, pharmacy:1, streaming:1, wholesale:1, amazon:1, apple:1, other:1 },
    perks: ['5% at Target', 'Free shipping', 'Extended returns'],
  },
  {
    id: 'apple-card', name: 'Apple Card', issuer: 'Goldman Sachs', network: 'visa',
    color: ['#1c1c1e', '#3a3a3c'], annual_fee: 0,
    rates: { apple:3, dining:2, grocery:2, gas:2, pharmacy:2, online:1, travel:1, streaming:1, wholesale:1, target:1, amazon:1, other:1 },
    perks: ['3% at Apple', '2% Apple Pay', 'Daily cash back'],
  },
  {
    id: 'discover-it', name: 'Discover it Cash Back', issuer: 'Discover', network: 'visa',
    color: ['#7f1d1d', '#dc2626'], annual_fee: 0,
    rates: { dining:1, grocery:1, gas:1, travel:1, online:1, pharmacy:1, streaming:1, wholesale:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['5% rotating categories', 'Cashback match yr 1', 'No annual fee'],
  },
  {
    id: 'us-bank-altitude-go', name: 'Altitude Go', issuer: 'US Bank', network: 'visa',
    color: ['#1e3a5f', '#0284c7'], annual_fee: 0,
    rates: { dining:4, streaming:2, grocery:2, gas:2, travel:1, online:1, pharmacy:1, wholesale:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['4x dining', '2x streaming', 'No annual fee'],
  },

  // ── MASTERCARD ────────────────────────────────────────────
  {
    id: 'citi-double-cash', name: 'Double Cash', issuer: 'Citi', network: 'mastercard',
    color: ['#111827', '#374151'], annual_fee: 0,
    rates: { dining:2, grocery:2, gas:2, travel:2, online:2, pharmacy:2, streaming:2, wholesale:2, target:2, amazon:2, apple:2, other:2 },
    perks: ['2% on everything', 'No annual fee'],
  },
  {
    id: 'citi-custom-cash', name: 'Custom Cash', issuer: 'Citi', network: 'mastercard',
    color: ['#0f172a', '#0e7490'], annual_fee: 0,
    rates: { dining:5, grocery:5, gas:5, travel:5, online:5, pharmacy:5, streaming:5, wholesale:5, target:5, amazon:5, apple:5, other:1 },
    perks: ['5% on top category', 'Auto-detects spending', 'No annual fee'],
  },
  {
    id: 'citi-premier', name: 'Citi Premier', issuer: 'Citi', network: 'mastercard',
    color: ['#0f172a', '#1e293b'], annual_fee: 95,
    rates: { travel:3, hotels:3, grocery:3, dining:3, gas:3, online:1, pharmacy:1, streaming:1, wholesale:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['3x hotels, grocery & dining', '3x gas & travel', '60k welcome points'],
  },
  {
    id: 'citi-rewards-plus', name: 'Rewards+ Card', issuer: 'Citi', network: 'mastercard',
    color: ['#1e3a5f', '#2563eb'], annual_fee: 0,
    rates: { grocery:2, gas:2, dining:1, travel:1, online:1, pharmacy:1, streaming:1, wholesale:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['2x grocery & gas', 'Rounds up to 10 points', 'No annual fee'],
  },
  {
    id: 'cap1-quicksilver', name: 'Quicksilver', issuer: 'Capital One', network: 'mastercard',
    color: ['#1e1b4b', '#4338ca'], annual_fee: 0,
    rates: { dining:1.5, grocery:1.5, gas:1.5, travel:5, online:1.5, pharmacy:1.5, streaming:1.5, wholesale:1.5, target:1.5, amazon:1.5, apple:1.5, other:1.5 },
    perks: ['1.5% on everything', 'No annual fee', '5x hotels via Capital One'],
  },
  {
    id: 'cap1-spark-cash-plus', name: 'Spark Cash Plus', issuer: 'Capital One', network: 'mastercard',
    color: ['#1e1b4b', '#6d28d9'], annual_fee: 150,
    rates: { dining:2, grocery:2, gas:2, travel:5, online:2, pharmacy:2, streaming:2, wholesale:2, target:2, amazon:2, apple:2, other:2 },
    perks: ['2% on everything', '5% hotels & rental cars', 'No preset spending limit'],
  },
  {
    id: 'bilt-mastercard', name: 'Bilt Mastercard', issuer: 'Wells Fargo', network: 'mastercard',
    color: ['#0f172a', '#1e293b'], annual_fee: 0,
    rates: { rent:1, dining:3, travel:2, grocery:1, gas:1, online:1, pharmacy:1, streaming:1, wholesale:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['Earn points on rent', '3x dining', 'Transfer to airlines'],
  },
  {
    id: 'td-cash', name: 'TD Cash Credit Card', issuer: 'TD Bank', network: 'mastercard',
    color: ['#064e3b', '#047857'], annual_fee: 0,
    rates: { dining:3, grocery:2, gas:1, travel:1, online:1, pharmacy:1, streaming:1, wholesale:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['3% dining', '2% grocery', 'No annual fee'],
  },
  {
    id: 'synchrony-premier', name: 'Premier Mastercard', issuer: 'Synchrony', network: 'mastercard',
    color: ['#1e3a5f', '#2563eb'], annual_fee: 0,
    rates: { dining:2, grocery:2, gas:2, travel:2, online:2, pharmacy:2, streaming:2, wholesale:2, target:2, amazon:2, apple:2, other:2 },
    perks: ['2% on everything', 'No annual fee', 'No foreign transaction fee'],
  },
  {
    id: 'amazon-store', name: 'Amazon Store Card', issuer: 'Synchrony', network: 'mastercard',
    color: ['#0f172a', '#334155'], annual_fee: 0,
    rates: { amazon:5, online:1, dining:1, grocery:1, gas:1, travel:1, pharmacy:1, streaming:1, wholesale:1, target:1, apple:1, other:1 },
    perks: ['5% Amazon', 'No annual fee', 'Special financing'],
  },
  {
    id: 'paypal-cashback', name: 'PayPal Cashback Mastercard', issuer: 'Synchrony', network: 'mastercard',
    color: ['#1e3a8a', '#1d4ed8'], annual_fee: 0,
    rates: { online:3, dining:2, grocery:2, gas:2, travel:2, pharmacy:2, streaming:2, wholesale:2, target:2, amazon:2, apple:2, other:2 },
    perks: ['3% PayPal purchases', '2% everywhere else', 'No annual fee'],
  },
  {
    id: 'navy-federal-more-rewards', name: 'More Rewards', issuer: 'Navy Federal', network: 'mastercard',
    color: ['#1e3a5f', '#1d4ed8'], annual_fee: 0,
    rates: { grocery:3, dining:3, gas:3, transit:3, travel:1, online:1, pharmacy:1, streaming:1, wholesale:1, target:1, amazon:1, apple:1, other:1 },
    perks: ['3x grocery, dining & gas', 'No annual fee', 'Military members'],
  },
];

export const NETWORKS = [
  { id: 'amex', label: 'American Express', shortLabel: 'Amex', color: '#2563eb' },
  { id: 'visa', label: 'Visa', shortLabel: 'Visa', color: '#1d4ed8' },
  { id: 'mastercard', label: 'Mastercard', shortLabel: 'Mastercard', color: '#dc2626' },
];

export const STORES = [
  { id:'grocery',    label:'Grocery Store',    icon:'🛒', category:'grocery' },
  { id:'dining',     label:'Restaurants',      icon:'🍽️', category:'dining' },
  { id:'gas',        label:'Gas Station',      icon:'⛽', category:'gas' },
  { id:'travel',     label:'Travel',           icon:'✈️', category:'travel' },
  { id:'amazon',     label:'Amazon',           icon:'📦', category:'amazon' },
  { id:'target',     label:'Target',           icon:'🎯', category:'target' },
  { id:'wholesale',  label:'Costco/Wholesale', icon:'🏪', category:'wholesale' },
  { id:'pharmacy',   label:'Pharmacy',         icon:'💊', category:'pharmacy' },
  { id:'streaming',  label:'Streaming',        icon:'🎬', category:'streaming' },
  { id:'apple',      label:'Apple Store',      icon:'🍎', category:'apple' },
  { id:'online',     label:'Online Shopping',  icon:'🛍️', category:'online' },
  { id:'other',      label:'Other',            icon:'💳', category:'other' },
];

export function getRate(card, category) {
  return card.rates[category] || card.rates['other'] || 1;
}
