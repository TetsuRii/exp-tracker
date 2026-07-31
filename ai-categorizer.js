// Smart Category Guesser - works offline (no API key needed)
// Can be upgraded to use OpenAI/Gemini by setting AI_API_KEY env var

const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'local';
const AI_ENDPOINT = process.env.AI_ENDPOINT || '';

// Comprehensive keyword-to-category map
const CATEGORY_MAP = [
  // DAIRY & EGGS
  { keywords: ['milk', 'cream', 'half and half', 'half-half', 'butter', 'margarine', 'cheese', 'cheddar', 'mozzarella', 'swiss', 'provolone', 'gouda', 'parmesan', 'ricotta', 'cottage cheese', 'sour cream', 'yogurt', 'greek yogurt', 'kefir', 'buttermilk', 'whipped cream', 'cream cheese', 'egg', 'eggs', 'egg whites', 'egg substitute', 'paneer', 'queso'], category: 'Dairy & Eggs' },
  
  // MEAT & POULTRY
  { keywords: ['beef', 'chicken', 'pork', 'turkey', 'lamb', 'veal', 'bacon', 'sausage', 'ham', 'ground beef', 'ground turkey', 'steak', 'chops', 'breast', 'thigh', 'drumstick', 'wing', 'chicken wing', 'ribs', 'roast', 'brisket', 'tenderloin', 'salami', 'pepperoni', 'hot dog', 'frankfurter', 'kielbasa', 'bratwurst', 'meatball', 'meatloaf'], category: 'Meat & Poultry' },
  
  // SEAFOOD
  { keywords: ['fish', 'salmon', 'tuna', 'tilapia', 'cod', 'haddock', 'mahi', 'mackerel', 'sardine', 'anchovy', 'shrimp', 'prawn', 'crab', 'lobster', 'scallop', 'clam', 'mussel', 'oyster', 'squid', 'calamari', 'octopus', 'seafood', 'catfish', 'trout', 'bass', 'snapper', 'grouper', 'flounder', 'sole'], category: 'Seafood' },
  
  // FRUITS
  { keywords: ['apple', 'banana', 'orange', 'grape', 'strawberry', 'blueberry', 'raspberry', 'blackberry', 'cherry', 'lemon', 'lime', 'grapefruit', 'watermelon', 'melon', 'cantaloupe', 'honeydew', 'peach', 'nectarine', 'plum', 'apricot', 'pear', 'mango', 'papaya', 'kiwi', 'pineapple', 'avocado', 'coconut', 'pomegranate', 'fig', 'date', 'raisin', 'prune', 'dragon fruit', 'lychee', 'plantain', 'guava', 'passion fruit', 'boysenberry', 'cranberry'], category: 'Fruits' },
  
  // VEGETABLES
  { keywords: ['lettuce', 'romaine', 'iceberg', 'spinach', 'kale', 'collard', 'chard', 'arugula', 'cabbage', 'broccoli', 'cauliflower', 'brussel', 'asparagus', 'green bean', 'string bean', 'pea', 'snow pea', 'snap pea', 'corn', 'carrot', 'celery', 'cucumber', 'zucchini', 'squash', 'pumpkin', 'butternut', 'acorn squash', 'bell pepper', 'jalapeno', 'habanero', 'serrano', 'chili pepper', 'potato', 'sweet potato', 'yam', 'onion', 'red onion', 'yellow onion', 'sweet onion', 'shallot', 'garlic', 'ginger', 'turmeric', 'radish', 'beet', 'turnip', 'parsnip', 'rutabaga', 'daikon', 'mushroom', 'portobello', 'shiitake', 'tomato', 'eggplant', 'okra', 'artichoke', 'leek', 'scallion', 'green onion', 'jicama', 'watercress', 'endive', 'fennel'], category: 'Vegetables' },
  
  // BREAD & BAKERY
  { keywords: ['bread', 'whole wheat bread', 'white bread', 'rye bread', 'sourdough', 'bagel', 'croissant', 'muffin', 'english muffin', 'biscuit', 'roll', 'dinner roll', 'hoagie roll', 'sub roll', 'tortilla', 'flour tortilla', 'corn tortilla', 'pita', 'naan', 'pita bread', 'lavash', 'wrap', 'pancake', 'waffle', 'french toast', 'donut', 'doughnut', 'cake', 'cupcake', 'brownie', 'cookie', 'pie', 'pastry', 'danish', 'coffee cake', 'scone', 'crumble', 'cobbler', 'eclair', 'baklava', 'bun', 'cinnamon roll', 'baguette', 'ciabatta', 'focaccia'], category: 'Bread & Bakery' },
  
  // BEVERAGES
  { keywords: ['water', 'spring water', 'mineral water', 'sparkling water', 'soda', 'pop', 'cola', 'coke', 'pepsi', 'sprite', 'fanta', 'ginger ale', 'tonic water', 'juice', 'orange juice', 'apple juice', 'grape juice', 'cranberry juice', 'tomato juice', 'lemonade', 'iced tea', 'sweet tea', 'coffee', 'ground coffee', 'coffee bean', 'espresso', 'latte', 'cappuccino', 'tea', 'green tea', 'black tea', 'herbal tea', 'chai', 'hot chocolate', 'cocoa', 'energy drink', 'gatorade', 'powerade', 'sports drink', 'coconut water', 'kombucha', 'seltzer', 'club soda', 'ginger beer', 'milk shake', 'smoothie', 'protein shake'], category: 'Beverages' },
  
  // CONDIMENTS & SAUCES
  { keywords: ['ketchup', 'mustard', 'mayonnaise', 'mayo', 'relish', 'hot sauce', 'tabasco', 'sriracha', 'soy sauce', 'teriyaki', 'bbq sauce', 'barbecue sauce', 'steak sauce', 'worcestershire', 'vinegar', 'balsamic', 'olive oil', 'vegetable oil', 'canola oil', 'coconut oil', 'sesame oil', 'cooking spray', 'salad dressing', 'ranch', 'italian dressing', 'caesar', 'vinaigrette', 'honey', 'maple syrup', 'syrup', 'molasses', 'jam', 'jelly', 'preserves', 'marmalade', 'peanut butter', 'almond butter', 'nutella', 'spread', 'hummus', 'guacamole', 'salsa', 'pasta sauce', 'marinara', 'alfredo', 'pesto', 'taco sauce', 'enchilada sauce', 'fish sauce', 'oyster sauce', 'hoisin', 'miso'], category: 'Condiments & Sauces' },
  
  // CANNED & JARRED
  { keywords: ['canned', 'can of', 'tinned', 'soup', 'chicken soup', 'tomato soup', 'vegetable soup', 'bean', 'black bean', 'kidney bean', 'pinto bean', 'chickpea', 'garbanzo', 'lentil', 'split pea', 'corn', 'canned corn', 'tomato', 'canned tomato', 'diced tomato', 'crushed tomato', 'tomato paste', 'tomato sauce', 'spaghetti', 'spaghetti os', 'ravioli', 'chili', 'canned chili', 'tuna', 'canned tuna', 'salmon', 'canned salmon', 'sardine', 'canned sardine', 'fruit cocktail', 'pineapple', 'canned pineapple', 'peach', 'canned peach', 'apple sauce', 'applesauce', 'pickle', 'pickles', 'olive', 'olives', 'capers', 'artichoke heart', 'roasted pepper', 'chipotle'], category: 'Canned & Jarred' },
  
  // GRAINS, PASTA & RICE
  { keywords: ['rice', 'white rice', 'brown rice', 'jasmine rice', 'basmati rice', 'wild rice', 'pasta', 'spaghetti', 'penne', 'rigatoni', 'fettuccine', 'linguine', 'angel hair', 'elbow macaroni', 'shell pasta', 'rotini', 'bow tie', 'farfalle', 'lasagna', 'lasagne', 'macaroni', 'noodle', 'ramen', 'udon', 'soba', 'rice noodle', 'egg noodle', 'couscous', 'quinoa', 'barley', 'oats', 'oatmeal', 'steel cut oats', 'rolled oats', 'grits', 'polenta', 'farro', 'bulgur', 'millet', 'amaranth', 'cereal', 'corn flake', 'cheerios', 'granola', 'muesli', 'flour', 'all-purpose flour', 'bread flour', 'cake flour', 'almond flour', 'coconut flour', 'cornmeal', 'bread crumb', 'panko', 'stuffing', 'crackers', 'saltine', 'graham cracker', 'rice cake'], category: 'Grains, Pasta & Rice' },
  
  // SNACKS
  { keywords: ['chips', 'potato chips', 'tortilla chips', 'corn chips', 'pita chips', 'pretzel', 'popcorn', 'microwave popcorn', 'crackers', 'nut', 'almond', 'cashew', 'peanut', 'walnut', 'pecan', 'macadamia', 'pistachio', 'mixed nuts', 'trail mix', 'granola bar', 'protein bar', 'energy bar', 'candy', 'chocolate', 'chocolate bar', 'm&m', 'snickers', 'kit kat', 'gummy', 'gum', 'mint', 'breath mint', 'jerky', 'beef jerky', 'pork rinds', 'seed', 'sunflower seed', 'pumpkin seed', 'sesame seed', 'fruit snack', 'fruit leather', 'cookie', 'biscuit', 'wafer', 'brownie', 'rice krispie'], category: 'Snacks' },
  
  // FROZEN FOODS
  { keywords: ['frozen', 'ice cream', 'gelato', 'sorbet', 'frozen yogurt', 'popsicle', 'frozen pizza', 'frozen dinner', 'tv dinner', 'frozen meal', 'frozen vegetable', 'frozen fruit', 'frozen chicken', 'frozen fish', 'frozen shrimp', 'frozen waffle', 'frozen pancake', 'frozen fries', 'frozen onion ring', 'frozen burrito', 'frozen taco', 'frozen snack', 'frozen pie', 'frozen cake', 'frozen dessert'], category: 'Frozen Foods' },
  
  // SPICES & SEASONINGS
  { keywords: ['salt', 'sea salt', 'kosher salt', 'pepper', 'black pepper', 'white pepper', 'seasoning', 'spice', 'cinnamon', 'nutmeg', 'clove', 'allspice', 'ginger', 'turmeric', 'paprika', 'smoked paprika', 'chili powder', 'cumin', 'coriander', 'cardamom', 'vanilla', 'vanilla extract', 'almond extract', 'bay leaf', 'thyme', 'rosemary', 'oregano', 'basil', 'parsley', 'dill', 'mint', 'sage', 'tarragon', 'chive', 'cilantro', 'curry', 'curry powder', 'garlic powder', 'onion powder', 'italian seasoning', 'pumpkin pie spice', 'cajun seasoning', 'old bay', 'garlic salt', 'seasoned salt', 'peppercorn', 'red pepper flake', 'bay leaves'], category: 'Spices & Seasonings' },
  
  // BAKING
  { keywords: ['baking soda', 'baking powder', 'vanilla extract', 'almond extract', 'food coloring', 'sprinkles', 'frosting', 'cake mix', 'brownie mix', 'pancake mix', 'cornstarch', 'yeast', 'active dry yeast', 'instant yeast', 'gelatin', 'jello', 'pudding', 'chocolate chip', 'baking chocolate', 'cocoa powder', 'shortening', 'crisco', 'confectioner sugar', 'powdered sugar', 'brown sugar'], category: 'Baking' },
  
  // BABY & INFANT
  { keywords: ['baby', 'infant', 'formula', 'baby food', 'baby cereal', 'baby snack', 'teether', 'baby juice', 'baby water', 'diaper', 'wipes', 'baby wipe'], category: 'Baby & Infant' },
  
  // PET FOOD
  { keywords: ['dog food', 'cat food', 'dog treat', 'cat treat', 'pet food', 'pet treat', 'dog biscuit', 'pet', 'kibble', 'canned dog', 'canned cat', 'cat litter', 'bird seed', 'fish food'], category: 'Pet Food' },
  
  // CLEANING
  { keywords: ['cleaner', 'cleaning', 'detergent', 'laundry', 'dish soap', 'dishwasher', 'bleach', 'ammonia', 'disinfectant', 'all-purpose cleaner', 'glass cleaner', 'bathroom cleaner', 'toilet cleaner', 'floor cleaner', 'fabric softener', 'stain remover', 'scrub', 'sponge', 'paper towel', 'napkin', 'tissue', 'facial tissue', 'toilet paper', 'trash bag', 'garbage bag', 'plastic wrap', 'aluminum foil', 'parchment paper', 'wax paper', 'ziploc', 'sandwich bag', 'storage bag'], category: 'Cleaning & Household' },
  
  // PERSONAL CARE
  { keywords: ['shampoo', 'conditioner', 'soap', 'body wash', 'face wash', 'lotion', 'moisturizer', 'deodorant', 'antiperspirant', 'toothpaste', 'toothbrush', 'floss', 'mouthwash', 'razor', 'shaving cream', 'shaving gel', 'sunscreen', 'sunblock', 'lip balm', 'chapstick', 'hand sanitizer', 'tissue', 'cotton ball', 'cotton swab', 'q-tip', 'makeup remover', 'tampon', 'pad', 'sanitary pad', 'pantyliner', 'condom'], category: 'Personal Care' },
  
  // MEDICINE & HEALTH
  { keywords: ['medicine', 'medication', 'pill', 'tablet', 'capsule', 'vitamin', 'supplement', 'ibuprofen', 'advil', 'tylenol', 'acetaminophen', 'aspirin', 'naproxen', 'aleve', 'antihistamine', 'benadryl', 'claritin', 'zyrtec', 'allergy', 'cold medicine', 'cough syrup', 'cough drop', 'throat lozenge', 'antacid', 'tums', 'pepto', 'first aid', 'bandaid', 'bandage', 'neosporin', 'antibiotic ointment', 'eye drop', 'contact solution', 'saline'], category: 'Medicine & Health' },
  
  // ALCOHOL
  { keywords: ['beer', 'ale', 'lager', 'stout', 'ipa', 'wine', 'red wine', 'white wine', 'rosé', 'rose wine', 'champagne', 'sparkling wine', 'vodka', 'whiskey', 'whisky', 'bourbon', 'scotch', 'rum', 'gin', 'tequila', 'mezcal', 'brandy', 'cognac', 'liquor', 'spirit', 'liqueur', 'cocktail', 'mixer', 'hard seltzer', 'malt liquor', 'cider', 'hard cider'], category: 'Alcohol' },

  // PAPER & WRAPPING
  { keywords: ['paper towel', 'toilet paper', 'tissue paper', 'wrapping paper', 'gift bag', 'gift box', 'ribbon', 'tape', 'scotch tape', 'packing tape', 'duct tape', 'string', 'twine'], category: 'Paper & Wrapping' },

  // OFFICE & SCHOOL
  { keywords: ['pen', 'pencil', 'marker', 'highlighter', 'eraser', 'paper', 'notebook', 'binder', 'folder', 'stapler', 'staple', 'tape', 'scissors', 'glue', 'calculator', 'ruler', 'envelope', 'stamp', 'ink', 'toner'], category: 'Office & School' },

  // ELECTRONICS
  { keywords: ['battery', 'aa battery', 'aaa battery', 'bulb', 'light bulb', 'led', 'charger', 'cable', 'usb', 'hdmi', 'phone case', 'screen protector', 'earphone', 'headphone', 'speaker', 'remote', 'remote control'], category: 'Electronics' }
];

// Products that are commonly known with specific categories (exact matches)
const EXACT_MATCHES = {
  'coca-cola': 'Beverages',
  'pepsi': 'Beverages',
  'sprite': 'Beverages',
  'fanta': 'Beverages',
  'heinz': 'Condiments & Sauces',
  'kraft': 'Dairy & Eggs',
  'nestle': 'Beverages',
  'oreo': 'Snacks',
  'ritz': 'Snacks',
  'cinnamon toast crunch': 'Grains, Pasta & Rice',
  'frosted flakes': 'Grains, Pasta & Rice',
  'froot loops': 'Grains, Pasta & Rice',
  'lucky charms': 'Grains, Pasta & Rice',
  'reeces': 'Snacks',
  'hershey': 'Snacks',
  'dove': 'Snacks',
  'snickers': 'Snacks',
  'twix': 'Snacks',
  'm&m': 'Snacks',
  'skittles': 'Snacks',
  'starbucks': 'Beverages',
  'dunkin': 'Beverages',
  'folgers': 'Beverages',
  'gatorade': 'Beverages',
  'powerade': 'Beverages',
  'red bull': 'Beverages',
  'monster': 'Beverages',
};

function guessCategory(productName) {
  if (!productName || typeof productName !== 'string') return { category: 'Other', confidence: 0 };
  
  const lower = productName.toLowerCase().trim();
  
  // 1. Check exact matches
  if (EXACT_MATCHES[lower]) {
    return { category: EXACT_MATCHES[lower], confidence: 1.0 };
  }
  
  // 2. Check partial exact matches
  for (const [key, cat] of Object.entries(EXACT_MATCHES)) {
    if (lower.includes(key)) {
      return { category: cat, confidence: 0.9 };
    }
  }
  
  // 3. Check keyword map
  let bestMatch = null;
  let bestScore = 0;
  
  for (const entry of CATEGORY_MAP) {
    for (const kw of entry.keywords) {
      if (lower === kw || lower.startsWith(kw + ' ') || lower.includes(' ' + kw + ' ') || lower.endsWith(' ' + kw) || lower.endsWith(' ' + kw + 's') || lower.startsWith(kw + 's ')) {
        const score = (lower === kw) ? 1.0 : (kw.length / lower.length) * 0.8;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = entry.category;
        }
      }
    }
  }
  
  if (bestMatch && bestScore > 0.3) {
    return { category: bestMatch, confidence: Math.min(bestScore, 0.95) };
  }
  
  return { category: 'Other', confidence: 0.1 };
}

// Suggest product name based on partial input using reference DB
function suggestProducts(db, userId, partial, limit = 10) {
  if (!partial || partial.length < 2) return [];
  const lower = partial.toLowerCase();
  const results = [];
  try {
    const stmt = db.prepare("SELECT DISTINCT name, category FROM reference_products WHERE user_id=? AND LOWER(name) LIKE ? ORDER BY name LIMIT ?");
    stmt.bind([userId, '%' + lower + '%', limit]);
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({ name: row.name, category: row.category || 'Other' });
    }
    stmt.free();
    
    // Also search existing products
    if (results.length < limit) {
      const stmt2 = db.prepare("SELECT DISTINCT name, category FROM products WHERE user_id=? AND LOWER(name) LIKE ? ORDER BY name LIMIT ?");
      stmt2.bind([userId, '%' + lower + '%', limit - results.length]);
      while (stmt2.step()) {
        const row = stmt2.getAsObject();
        // Avoid duplicates
        if (!results.find(r => r.name === row.name)) {
          results.push({ name: row.name, category: row.category || 'Other' });
        }
      }
      stmt2.free();
    }
  } catch (e) {
    console.error('Suggest error:', e.message);
  }
  return results;
}

// AI-powered chat - answers questions about inventory
function answerQuestion(db, userId, question, username) {
  const lower = question.toLowerCase();
  const storeNames = { lowthers: 'Lowthers Lane', valley: 'Valley', la_tante: 'La Tante', laTante: 'La Tante' };
  
  // Get all products for this user
  let products = [];
  try {
    const stmt = db.prepare("SELECT * FROM products WHERE user_id=? ORDER BY expiry_date ASC");
    stmt.bind([userId]);
    while (stmt.step()) products.push(stmt.getAsObject());
    stmt.free();
  } catch (e) {
    return { answer: "Sorry, I couldn't access your product data.", data: null };
  }
  
  if (products.length === 0) {
    return { answer: "You don't have any products in your inventory yet. Add some products to get started!", data: null };
  }
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Calculate date 7 days from now
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];
  
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toISOString().split('T')[0];
  
  // Count by category
  const categoryCounts = {};
  for (const p of products) {
    const cat = p.category || 'Other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + (p.quantity || 1);
  }
  
  // Count by store
  const storeCounts = { lowthers: 0, valley: 0, laTante: 0 };
  for (const p of products) {
    storeCounts.lowthers += p.store_lowthers || 0;
    storeCounts.valley += p.store_valley || 0;
    storeCounts.laTante += p.store_la_tante || 0;
  }
  
  // Expiring soon
  const expiringSoon = products.filter(p => p.expiry_date && p.expiry_date >= todayStr && p.expiry_date <= nextWeekStr);
  const expiringThisMonth = products.filter(p => p.expiry_date && p.expiry_date >= todayStr && p.expiry_date <= nextMonthStr);
  const alreadyExpired = products.filter(p => p.expiry_date && p.expiry_date < todayStr);
  
  // Determine intent
  let intent = 'general';
  
  if (lower.includes('expir') && (lower.includes('week') || lower.includes('7 day') || lower.includes('soon'))) intent = 'expiring_week';
  else if (lower.includes('expir') && (lower.includes('month') || lower.includes('30 day'))) intent = 'expiring_month';
  else if (lower.includes('expir') || lower.includes('expired') || lower.includes('past due')) intent = 'expired';
  else if (lower.includes('lowthers')) intent = 'store_lowthers';
  else if (lower.includes('valley')) intent = 'store_valley';
  else if (lower.includes('la tante') || lower.includes('latante')) intent = 'store_laTante';
  else if (lower.includes('store') || lower.includes('all store') || lower.includes('each store')) intent = 'all_stores';
  else if (lower.includes('how many') || lower.includes('count') || lower.includes('total') || lower.includes('how much')) intent = 'total_count';
  else if (lower.includes('category') || lower.includes('type') || lower.includes('kind')) intent = 'categories';
  else if (lower.includes('oldest') || lower.includes('longest')) intent = 'oldest';
  else if (lower.includes('recent') || lower.includes('newest') || lower.includes('latest') || lower.includes('just added')) intent = 'newest';
  else if (lower.includes('most') && lower.includes('store')) intent = 'most_stocked';
  
  let answer = '';
  let data = null;
  
  switch (intent) {
    case 'expiring_week': {
      if (expiringSoon.length === 0) {
        answer = `✅ Great news! Nothing is expiring in the next 7 days. You have ${products.length} products total.`;
      } else {
        answer = `⚠️ You have **${expiringSoon.length} product${expiringSoon.length > 1 ? 's' : ''}** expiring within 7 days:\n\n`;
        data = expiringSoon.map(p => ({ name: p.name, expiry: p.expiry_date, store: `Lowthers:${p.store_lowthers||0} Valley:${p.store_valley||0} LaTante:${p.store_la_tante||0}` }));
        const list = expiringSoon.slice(0, 10).map(p => `• ${p.name} — expires ${p.expiry_date}`).join('\n');
        answer += list;
        if (expiringSoon.length > 10) answer += `\n\n... and ${expiringSoon.length - 10} more`;
      }
      break;
    }
    case 'expiring_month': {
      if (expiringThisMonth.length === 0) {
        answer = `✅ Nothing expiring in the next 30 days. All ${products.length} products are good!`;
      } else {
        answer = `📅 **${expiringThisMonth.length} product${expiringThisMonth.length > 1 ? 's' : ''}** expiring within 30 days:\n\n`;
        const list = expiringThisMonth.slice(0, 15).map(p => `• ${p.name} — expires ${p.expiry_date} (Qty: ${p.quantity})`).join('\n');
        answer += list;
        if (expiringThisMonth.length > 15) answer += `\n\n... and ${expiringThisMonth.length - 15} more`;
      }
      break;
    }
    case 'expired': {
      if (alreadyExpired.length === 0) {
        answer = `✅ No expired products found. All ${products.length} items are within date!`;
      } else {
        answer = `❌ **${alreadyExpired.length} product${alreadyExpired.length > 1 ? 's' : ''}** are expired:\n\n`;
        const list = alreadyExpired.slice(0, 10).map(p => `• ${p.name} — expired ${p.expiry_date}`).join('\n');
        answer += list;
        if (alreadyExpired.length > 10) answer += `\n\n... and ${alreadyExpired.length - 10} more`;
      }
      break;
    }
    case 'store_lowthers':
    case 'store_valley':
    case 'store_laTante': {
      const storeField = intent === 'store_lowthers' ? 'store_lowthers' : intent === 'store_valley' ? 'store_valley' : 'store_la_tante';
      const storeName = storeNames[storeField === 'store_la_tante' ? 'la_tante' : storeField === 'store_valley' ? 'valley' : 'lowthers'];
      const items = products.filter(p => (p[storeField] || 0) > 0);
      if (items.length === 0) {
        answer = `📭 No products currently stocked at **${storeName}**.`;
      } else {
        const total = items.reduce((sum, p) => sum + (p[storeField] || 0), 0);
        answer = `🏪 **${storeName}** — ${items.length} product types, ${total} total items:\n\n`;
        const list = items.slice(0, 10).map(p => `• ${p.name} — ${p[storeField]} pcs`).join('\n');
        answer += list;
        if (items.length > 10) answer += `\n\n... and ${items.length - 10} more products`;
      }
      break;
    }
    case 'all_stores': {
      answer = `🏪 **Products by Store:**\n\n`;
      for (const [key, name] of Object.entries({ lowthers: 'Lowthers Lane', valley: 'Valley', laTante: 'La Tante' })) {
        const field = key === 'laTante' ? 'store_la_tante' : `store_${key}`;
        const items = products.filter(p => (p[field] || 0) > 0);
        const total = items.reduce((sum, p) => sum + (p[field] || 0), 0);
        answer += `• **${name}**: ${items.length} product types, ${total} total items\n`;
      }
      answer += `\n📊 **Total**: ${products.length} product types across all stores`;
      break;
    }
    case 'total_count': {
      const totalQty = products.reduce((sum, p) => sum + (p.quantity || 1), 0);
      answer = `📊 You have **${products.length} product types** with a total of **${totalQty} units** across all stores.`;
      break;
    }
    case 'categories': {
      const sorted = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
      answer = `📁 **Categories breakdown:**\n\n`;
      for (const [cat, count] of sorted.slice(0, 15)) {
        answer += `• **${cat}**: ${count} items\n`;
      }
      if (sorted.length > 15) answer += `\n... and ${sorted.length - 15} more categories`;
      break;
    }
    case 'oldest': {
      const oldest = [...products].sort((a, b) => (a.expiry_date || '9999') > (b.expiry_date || '9999') ? 1 : -1).slice(0, 5);
      answer = `⏰ **Items expiring soonest:**\n\n`;
      answer += oldest.map(p => `• ${p.name} — ${p.expiry_date || 'No expiry date'}`).join('\n');
      break;
    }
    case 'newest': {
      const newest = [...products].sort((a, b) => (b.added_at || '') > (a.added_at || '') ? 1 : -1).slice(0, 5);
      answer = `🆕 **Most recently added:**\n\n`;
      answer += newest.map(p => `• ${p.name} — added ${p.added_at || 'unknown'}`).join('\n');
      break;
    }
    case 'most_stocked': {
      const itemsWithQty = products.filter(p => (p.quantity || 1) > 5).sort((a, b) => (b.quantity || 1) - (a.quantity || 1)).slice(0, 10);
      if (itemsWithQty.length === 0) {
        answer = `No products with more than 5 units in stock.`;
      } else {
        answer = `📦 **Most stocked items:**\n\n`;
        answer += itemsWithQty.map(p => `• ${p.name} — ${p.quantity} units`).join('\n');
      }
      break;
    }
    default: {
      // General overview
      const topCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      answer = `👋 Hi ${username}! Here's your inventory overview:\n\n`;
      answer += `📊 **${products.length} product types** total\n`;
      answer += `⚠️ **${expiringSoon.length} expiring** within 7 days\n`;
      answer += `❌ **${alreadyExpired.length} expired** items\n`;
      answer += `🏪 **3 stores** tracked: Lowthers Lane, Valley, La Tante\n\n`;
      answer += `**Top categories:**\n`;
      answer += topCategories.map(([c, n]) => `• ${c}: ${n}`).join('\n');
      answer += `\n\n💡 Try asking: "What's expiring this week?", "Show Lowthers Lane store", "How many items total?"`;
    }
  }
  
  return { answer, data };
}

// Generate insights/analytics
function generateInsights(db, userId) {
  let products = [];
  try {
    const stmt = db.prepare("SELECT * FROM products WHERE user_id=? ORDER BY expiry_date ASC");
    stmt.bind([userId]);
    while (stmt.step()) products.push(stmt.getAsObject());
    stmt.free();
  } catch (e) {
    return { insights: [], error: e.message };
  }
  
  if (products.length === 0) {
    return { insights: [{ type: 'info', icon: '📝', message: 'Your inventory is empty. Start adding products!', priority: 0 }] };
  }
  
  const insights = [];
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];
  
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toISOString().split('T')[0];
  
  // 1. Expired products
  const expired = products.filter(p => p.expiry_date && p.expiry_date < todayStr);
  if (expired.length > 0) {
    insights.push({
      type: 'danger',
      icon: '❌',
      message: `${expired.length} product${expired.length > 1 ? 's' : ''} expired. Consider removing or donating.`,
      priority: 10,
      count: expired.length,
      items: expired.slice(0, 5).map(p => p.name)
    });
  }
  
  // 2. Expiring within a week
  const expiringSoon = products.filter(p => p.expiry_date && p.expiry_date >= todayStr && p.expiry_date <= nextWeekStr);
  if (expiringSoon.length > 0) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      message: `${expiringSoon.length} product${expiringSoon.length > 1 ? 's' : ''} expiring within 7 days. Use them soon!`,
      priority: 8,
      count: expiringSoon.length,
      items: expiringSoon.slice(0, 5).map(p => p.name + ' (' + p.expiry_date + ')')
    });
  }
  
  // 3. Expiring within a month (excluding week)
  const expiringMonth = products.filter(p => p.expiry_date && p.expiry_date > nextWeekStr && p.expiry_date <= nextMonthStr);
  if (expiringMonth.length > 0) {
    insights.push({
      type: 'info',
      icon: '📅',
      message: `${expiringMonth.length} product${expiringMonth.length > 1 ? 's' : ''} expiring within 30 days.`,
      priority: 5,
      count: expiringMonth.length,
      items: expiringMonth.slice(0, 5).map(p => p.name + ' (' + p.expiry_date + ')')
    });
  }
  
  // 4. No expiry date set
  const noExpiry = products.filter(p => !p.expiry_date);
  if (noExpiry.length > 0) {
    insights.push({
      type: 'info',
      icon: '📋',
      message: `${noExpiry.length} product${noExpiry.length > 1 ? 's' : ''} missing expiry dates.`,
      priority: 3,
      count: noExpiry.length
    });
  }
  
  // 5. Store distribution
  const stores = ['store_lowthers', 'store_valley', 'store_la_tante'];
  const storeNames = ['Lowthers Lane', 'Valley', 'La Tante'];
  const storeCounts = stores.map((s, i) => ({
    name: storeNames[i],
    count: products.reduce((sum, p) => sum + (p[s] || 0), 0),
    products: products.filter(p => (p[s] || 0) > 0).length
  }));
  
  // Find emptiest store
  const emptiest = [...storeCounts].sort((a, b) => a.count - b.count)[0];
  insights.push({
    type: 'info',
    icon: '🏪',
    message: `${emptiest.name} has ${emptiest.count} items across ${emptiest.products} product types.`,
    priority: 2,
    store: emptiest
  });
  
  // 6. Most common categories
  const categoryCounts = {};
  for (const p of products) {
    const cat = p.category || 'Other';
    if (!categoryCounts[cat]) categoryCounts[cat] = 0;
    categoryCounts[cat] += p.quantity || 1;
  }
  const topCat = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (topCat.length > 0) {
    insights.push({
      type: 'stats',
      icon: '📊',
      message: `Top categories: ${topCat.map(([c, n]) => `${c} (${n})`).join(', ')}`,
      priority: 1
    });
  }
  
  // 7. Total stats
  const totalQty = products.reduce((sum, p) => sum + (p.quantity || 1), 0);
  insights.push({
    type: 'stats',
    icon: '📦',
    message: `Total inventory: ${products.length} product types, ~${totalQty} units across 3 stores.`,
    priority: 0
  });
  
  return {
    insights: insights.sort((a, b) => b.priority - a.priority),
    summary: {
      totalProducts: products.length,
      totalQuantity: totalQty,
      expired: expired.length,
      expiringSoon: expiringSoon.length,
      expiringMonth: expiringMonth.length,
      storeCounts: storeCounts
    }
  };
}

export { guessCategory, suggestProducts, answerQuestion, generateInsights };
