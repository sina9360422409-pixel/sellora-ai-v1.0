import { Product, ConnectedChannel, UserProfile, OnboardingData, AISuggestion, GeneratedContent } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Premium Wireless Headphones',
    category: 'Electronics',
    status: 'Published',
    price: 249,
    currency: '$',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    description: 'Ultra-low latency Bluetooth 5.3 headphones with active hybrid noise cancellation, 40-hour battery life, and memory foam ear cushions.',
    features: [
      'Hybrid Active Noise Cancellation (42dB reduction)',
      '40mm custom bio-cellulose drivers',
      '40-hour playtime on single charge (USB-C Fast Charging)',
      'Multipoint Bluetooth 5.3 connection'
    ],
    tags: ['Audio', 'Noise Cancelling', 'Wireless', 'Premium'],
    targetAudience: 'Professionals, travelers, and audiophiles',
    usp: 'Studio-grade acoustic precision with zero listening fatigue',
    lastUpdated: '2 hours ago',
    aiContentCount: 14
  },
  {
    id: 'prod-2',
    name: 'Magnetic iPhone Case',
    category: 'Accessories',
    status: 'Ready',
    price: 39,
    currency: '$',
    image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&auto=format&fit=crop&q=80',
    description: 'Slim aerospace-grade aramid fiber case with ultra-strong N52 neodymium magnetic ring array for flawless MagSafe alignment.',
    features: [
      'Built-in 38-magnet array for instant MagSafe latching',
      'Military grade 10ft drop tested armor',
      'Matte oleophobic anti-fingerprint coating',
      'Micro-fiber interior scratch guard'
    ],
    tags: ['MagSafe', 'iPhone Case', 'Aramid Fiber', 'Slim'],
    targetAudience: 'Everyday tech users and commuters',
    usp: 'Featherweight protection that never slips or yellows',
    lastUpdated: '1 day ago',
    aiContentCount: 8
  },
  {
    id: 'prod-3',
    name: 'Smart Fitness Watch',
    category: 'Wearables',
    status: 'Needs improvement',
    price: 189,
    currency: '$',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
    description: 'Always-on AMOLED fitness tracker with ECG, SpO2 sensor, sleep staging analytics, and 50m water resistance.',
    features: [
      '1.43" Ultra-retina AMOLED display',
      'Real-time heart rate, stress & VO2 max monitoring',
      '120+ preloaded sports modes with auto-detection',
      '14-day battery life on standby mode'
    ],
    tags: ['Fitness', 'Smartwatch', 'Health Tracker', 'AMOLED'],
    targetAudience: 'Fitness enthusiasts and wellness-minded adults',
    usp: 'Clinical grade health tracking in a minimalist titanium bezel',
    lastUpdated: '3 days ago',
    aiContentCount: 3
  },
  {
    id: 'prod-4',
    name: 'Minimal Travel Backpack',
    category: 'Bags & Luggage',
    status: 'Draft',
    price: 129,
    currency: '$',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
    description: 'Weatherproof 28L expandable carry-on backpack with dedicated 16-inch suspended laptop vault and hidden passport pocket.',
    features: [
      'Cordura 500D waterproof nylon construction',
      'Luggage pass-through handle strap',
      'Ergonomic airflow back panel',
      'YKK AquaGuard heavy-duty zippers'
    ],
    tags: ['Travel', 'Backpack', 'Waterproof', 'Carry-On'],
    targetAudience: 'Digital nomads, urban commuters, and weekend travelers',
    usp: 'TSA-friendly clamshell layout that packs a week into a personal item',
    lastUpdated: '5 days ago',
    aiContentCount: 1
  },
  {
    id: 'prod-5',
    name: 'Artisan Ceramic Pour-Over Set',
    category: 'Home & Kitchen',
    status: 'Ready',
    price: 54,
    currency: '$',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    description: 'Hand-thrown stoneware dripper with insulated server pot for extracting the cleanest single-origin coffee flavor profile.',
    features: [
      'Handcrafted from high-fired natural clay',
      'Internal spiral ribbing for optimized flow rate',
      'Includes 600ml heat-resistant borosilicate carafe',
      'Lead-free food-safe matte glaze'
    ],
    tags: ['Coffee', 'Pour Over', 'Artisan', 'Kitchen'],
    targetAudience: 'Specialty coffee lovers and design conscious homeowners',
    usp: 'Elevate morning coffee ritual into a barista-grade experience',
    lastUpdated: '1 week ago',
    aiContentCount: 6
  }
];

export const INITIAL_USER: UserProfile = {
  name: 'Alex Vance',
  storeName: 'Vance & Co. Goods',
  email: 'alex@vancegoods.store',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  plan: 'Pro',
  creditsUsed: 82,
  creditsTotal: 100,
  currency: '$',
  defaultTone: 'Premium',
  autoSave: true
};

export const INITIAL_CHANNELS: ConnectedChannel[] = [
  {
    id: 'chan-1',
    name: 'Instagram',
    type: 'instagram',
    icon: 'Instagram',
    status: 'Not connected',
    handle: '@vancegoods',
    lastSync: 'Never'
  },
  {
    id: 'chan-2',
    name: 'Amazon',
    type: 'amazon',
    icon: 'ShoppingBag',
    status: 'Not connected',
    handle: 'Vance Goods Storefront',
    lastSync: 'Never'
  },
  {
    id: 'chan-3',
    name: 'Shopify',
    type: 'shopify',
    icon: 'Store',
    status: 'Not connected',
    handle: 'vancegoods.myshopify.com',
    lastSync: 'Never'
  },
  {
    id: 'chan-4',
    name: 'TikTok',
    type: 'tiktok',
    icon: 'Video',
    status: 'Not connected',
    handle: '@vanceshop',
    lastSync: 'Never'
  },
  {
    id: 'chan-5',
    name: 'Etsy',
    type: 'etsy',
    icon: 'Tag',
    status: 'Not connected',
    handle: 'VanceCraftStudios',
    lastSync: 'Never'
  }
];

export const AI_SUGGESTIONS: AISuggestion[] = [
  {
    id: 'sug-1',
    title: 'Your product image could perform better.',
    description: 'Enhance the "Smart Fitness Watch" background with a luxury studio scene to boost perceived value by up to 34%.',
    actionType: 'image',
    productId: 'prod-3',
    tag: 'Image Studio'
  },
  {
    id: 'sug-2',
    title: 'Your latest product is missing a strong selling point.',
    description: 'Generate high-converting Amazon & Shopify bullet points for "Minimal Travel Backpack" before publishing.',
    actionType: 'listing',
    productId: 'prod-4',
    tag: 'Listing Optimizer'
  },
  {
    id: 'sug-3',
    title: 'Create a social post for your new product.',
    description: 'Instagram engagement peaks on Wednesdays. Launch a carousel script for "Premium Wireless Headphones".',
    actionType: 'social',
    productId: 'prod-1',
    tag: 'Social Growth'
  }
];

export const INITIAL_ONBOARDING: OnboardingData = {
  categories: ['Electronics', 'Accessories', 'Bags & Luggage'],
  channels: ['Shopify', 'Instagram', 'Amazon'],
  goal: 'Get more sales',
  completed: true
};

const STORAGE_KEYS = {
  PRODUCTS: 'sellora_products_v1',
  USER: 'sellora_user_v1',
  CHANNELS: 'sellora_channels_v1',
  ONBOARDING: 'sellora_onboarding_v1',
  HISTORY: 'sellora_history_v1'
};

export const storage = {
  getProducts: (): Product[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return data ? JSON.parse(data) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  },
  saveProducts: (products: Product[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  },
  getUser: (): UserProfile => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  },
  saveUser: (user: UserProfile) => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  },
  getChannels: (): ConnectedChannel[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHANNELS);
      return data ? JSON.parse(data) : INITIAL_CHANNELS;
    } catch {
      return INITIAL_CHANNELS;
    }
  },
  saveChannels: (channels: ConnectedChannel[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(channels));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  },
  getOnboarding: (): OnboardingData => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ONBOARDING);
      return data ? JSON.parse(data) : INITIAL_ONBOARDING;
    } catch {
      return INITIAL_ONBOARDING;
    }
  },
  saveOnboarding: (data: OnboardingData) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(data));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  },
  getHistory: (): GeneratedContent[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  saveHistory: (history: GeneratedContent[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }
};
