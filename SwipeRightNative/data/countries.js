import { CARDS_DB as CARDS_CA, NETWORKS as NETWORKS_CA, STORES as STORES_CA, getRate } from './cards';
import { CARDS_DB_IN, BANKS_IN, STORES_IN } from './cards_in';

export const COUNTRIES = {
  CA: {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    currency: '$',
    currencyCode: 'CAD',
    cards: CARDS_CA,
    stores: STORES_CA,
    // Canada groups by NETWORK (Amex/Visa/Mastercard)
    groupBy: 'network',
    groups: NETWORKS_CA,
    featuredIds: {
      amex: ['amex-platinum', 'amex-gold', 'amex-bce', 'amex-bcp'],
      visa: ['chase-sapphire-reserve', 'chase-sapphire-preferred', 'chase-freedom-unlimited', 'cap1-venture-x'],
      mastercard: ['citi-double-cash', 'citi-custom-cash', 'citi-premier', 'cap1-quicksilver'],
    },
  },
  IN: {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currency: '₹',
    currencyCode: 'INR',
    cards: CARDS_DB_IN,
    stores: STORES_IN,
    // India groups by BANK (since people think bank-first)
    groupBy: 'bank',
    groups: BANKS_IN,
    featuredIds: {
      hdfc: ['hdfc-millennia', 'hdfc-swiggy', 'hdfc-regalia-gold', 'hdfc-tata-neu-infinity'],
      sbi: ['sbi-cashback', 'sbi-simplyclick', 'sbi-bpcl-octane', 'sbi-prime'],
      icici: ['icici-amazon-pay', 'icici-coral', 'icici-sapphiro', 'icici-emeralde-private'],
      axis: ['axis-ace', 'axis-flipkart', 'axis-magnus', 'axis-atlas'],
      amex: ['amex-platinum-travel-in', 'amex-mrcc', 'amex-platinum-reserve'],
      kotak: ['kotak-myntra', 'kotak-white'],
      idfc: ['idfc-first-power'],
      rbl: ['rbl-savemax'],
      indusind: ['indusind-tiger'],
      hsbc: ['hsbc-live-plus'],
    },
  },
};

// Helper to get a card by ID across all countries (in case user switches countries)
export function findCardAnywhere(id) {
  for (const country of Object.values(COUNTRIES)) {
    const card = country.cards.find(c => c.id === id);
    if (card) return { card, country: country.code };
  }
  return null;
}

export { getRate };
