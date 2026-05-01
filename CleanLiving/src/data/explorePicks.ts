import type { SwapCategory } from '../types';

/** Category chips on Explore (null = no category filter). */
export const EXPLORE_CATEGORY_OPTIONS: { value: SwapCategory | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'stainlessBottle', label: 'Steel' },
  { value: 'glassBottle', label: 'Glass' },
  { value: 'castileSoap', label: 'Castile' },
  { value: 'fragranceFreePersonalCare', label: 'Body' },
  { value: 'organicSnack', label: 'Snacks' },
  { value: 'bpaFreeStorage', label: 'Storage' },
  { value: 'naturalFiberClothing', label: 'Textiles' },
];

export type ExplorePick = {
  id: string;
  title: string;
  subtitle: string;
  category: SwapCategory;
};

const ROTATION: SwapCategory[] = [
  'stainlessBottle',
  'glassBottle',
  'castileSoap',
  'fragranceFreePersonalCare',
  'organicSnack',
  'bpaFreeStorage',
  'naturalFiberClothing',
];

type Seed = { title: string; subtitle: string };

/** ≥15 rows each so round-robin to 100 stays unique enough (floor(i/7) < 15). */
const SEEDS: Record<SwapCategory, Seed[]> = {
  stainlessBottle: [
    { title: 'Narrow-mouth insulated bottle', subtitle: 'Slim profile for cup holders; skip disposable plastic on commutes.' },
    { title: 'Wide-mouth 32 oz steel bottle', subtitle: 'Easy ice and cleaning; double-wall keeps drinks cold for hours.' },
    { title: 'Straw-lid hydration bottle', subtitle: 'Sip without unscrewing — handy for workouts and car trips.' },
    { title: 'Powder-coated steel growler', subtitle: 'Durable finish; refill instead of buying bottled water by the case.' },
    { title: 'Kids’ steel water bottle', subtitle: 'Leak-resistant options help replace single-use juice bottles at school.' },
    { title: 'Handle-carry steel canteen', subtitle: 'Clip or carry — good for hikes when you want metal over plastic.' },
    { title: 'Coffee-friendly steel mug', subtitle: 'Some models fit car cup holders for hot drinks without paper cups.' },
    { title: 'Stackable steel pint set', subtitle: 'Outdoor entertaining with less disposable cup waste.' },
    { title: 'Insulated sports bottle', subtitle: 'One-handed lids are common — compare insulation claims before buying.' },
    { title: 'Filter-ready steel bottle', subtitle: 'Pair with your preferred filter if tap taste is a concern.' },
    { title: 'Slim 20 oz everyday bottle', subtitle: 'Lightweight daily carry; check “18/8 stainless” in listings.' },
    { title: 'Half-gallon steel jug', subtitle: 'Desk or jobsite hydration with fewer refill trips.' },
    { title: 'Chug-cap steel bottle', subtitle: 'Fast hydration after runs; rinse caps often to keep fresh.' },
    { title: 'Steel bottle with sleeve', subtitle: 'Silicone sleeves can help grip and quiet dents.' },
    { title: 'Replacement lids & gaskets', subtitle: 'Extend bottle life instead of tossing the whole unit.' },
  ],
  glassBottle: [
    { title: 'Silicone-sleeve glass bottle', subtitle: 'Grip and bump protection while keeping drink contact mostly glass.' },
    { title: 'Wide-mouth glass water bottle', subtitle: 'Easier to drop in citrus or ice; heavier than steel but zero plastic liner.' },
    { title: 'Flip-cap glass bottle', subtitle: 'Quick sips at a desk; verify seals to avoid leaks in a bag.' },
    { title: 'Glass bottle with straw', subtitle: 'Some prefer straws for iced drinks; wash straws regularly.' },
    { title: 'Small 12 oz glass bottle', subtitle: 'Purse-sized option when you only need a short outing’s worth.' },
    { title: 'Borosilicate glass bottle', subtitle: 'Often marketed for thermal shock resistance — read care instructions.' },
    { title: 'Glass infusion bottle', subtitle: 'Fruit or herb infusions without flavored syrups.' },
    { title: 'Juicer-friendly glass bottle', subtitle: 'Store cold-press juice short-term; glass avoids some plastic aftertaste.' },
    { title: 'Milk-style glass bottle', subtitle: 'Reusable vibe for plant milks or cold brew at home.' },
    { title: 'Tinted glass bottle', subtitle: 'UV tint sometimes marketed for oils — compare seller claims.' },
    { title: 'Swing-top glass bottle', subtitle: 'Home kombucha or sparkling water experiments with a solid seal.' },
    { title: 'Glass bottle brush add-on', subtitle: 'Long brushes help prevent residue in narrow necks.' },
    { title: 'Protective bottle boot', subtitle: 'Bottom bumper rings reduce glass chip risk on hard surfaces.' },
    { title: 'Time-marked glass bottle', subtitle: 'Printed hourly marks as a hydration nudge — optional gimmick.' },
    { title: 'Glass bottle twin pack', subtitle: 'Keep one at work and one in the car to build the habit.' },
  ],
  castileSoap: [
    { title: 'Unscented castile liquid', subtitle: 'Dilute for hand soap, body wash, or light household use.' },
    { title: 'Peppermint castile soap', subtitle: 'Cooling feel; patch-test if skin is sensitive.' },
    { title: 'Tea tree castile soap', subtitle: 'Popular for foot soak or gym bag wash — still dilute for surfaces.' },
    { title: 'Citrus castile soap', subtitle: 'Kitchen-friendly scent for dish scrub routines.' },
    { title: 'Lavender castile soap', subtitle: 'Evening shower option when you want a mild botanical note.' },
    { title: 'Almond castile soap', subtitle: 'Often described as richer lather — check ingredient list for allergies.' },
    { title: 'Rose castile soap', subtitle: 'Floral option; still read full label for sensitivities.' },
    { title: 'Bar castile soap', subtitle: 'Travel-friendly solid; keep dry between uses to extend life.' },
    { title: 'Gallon refill castile', subtitle: 'Lower cost per ounce if you’ll actually use the volume.' },
    { title: 'Pump bottle + castile refill', subtitle: 'Decant into a reusable pump to cut countertop clutter.' },
    { title: 'Baby-gentle castile label', subtitle: 'Marketing varies — verify “tear-free” claims with pediatric guidance.' },
    { title: 'Organic castile soap', subtitle: 'If organic certification matters, confirm USDA or equivalent on label.' },
    { title: 'Fair trade castile soap', subtitle: 'Ethical sourcing angle — compare third-party certifications.' },
    { title: 'Foaming pump dilution set', subtitle: 'Thin castile with water in a foamer for hand soap economics.' },
    { title: 'Travel mini castile', subtitle: 'TSA-sized for carry-on when you want one soap for multiple uses.' },
  ],
  fragranceFreePersonalCare: [
    { title: 'Fragrance-free body wash', subtitle: 'Look for “fragrance-free,” not only “unscented,” to skip hidden perfume.' },
    { title: 'Fragrance-free lotion', subtitle: 'Thicker creams for winter legs; patch-test new brands.' },
    { title: 'Fragrance-free shampoo', subtitle: 'Mild surfactants help if scalp is picky about sulfates.' },
    { title: 'Fragrance-free conditioner', subtitle: 'Silicone-free options exist if you’re avoiding certain film formers.' },
    { title: 'Fragrance-free deodorant', subtitle: 'Baking-soda-free variants for sensitive skin — YMMV.' },
    { title: 'Fragrance-free sunscreen', subtitle: 'Mineral vs chemical filters — read SPF and reapply guidance.' },
    { title: 'Fragrance-free lip balm', subtitle: 'Simple butters and waxes without mint or “flavor.”' },
    { title: 'Fragrance-free hand cream', subtitle: 'Desk drawer staple after sanitizer-heavy days.' },
    { title: 'Fragrance-free baby balm', subtitle: 'Thick ointments for dry patches — still check pediatric advice.' },
    { title: 'Fragrance-free face cleanser', subtitle: 'Gel vs cream texture — pick what rinses clean for you.' },
    { title: 'Fragrance-free shaving cream', subtitle: 'Brushless options for quick showers.' },
    { title: 'Fragrance-free bar soap', subtitle: 'Oat or glycerin bars marketed for sensitive skin.' },
    { title: 'Fragrance-free hair mask', subtitle: 'Weekly treatment when heat styling dries ends.' },
    { title: 'Fragrance-free micellar water', subtitle: 'Light makeup removal without heavy perfume.' },
    { title: 'Fragrance-free oil cleanser', subtitle: 'First step in double-cleanse routines for sunscreen removal.' },
  ],
  organicSnack: [
    { title: 'Organic fruit strips', subtitle: 'Lunchbox swap vs candy with long dye lists.' },
    { title: 'Organic seed crackers', subtitle: 'Pair with hummus for a fiber-forward snack.' },
    { title: 'Organic applesauce pouches', subtitle: 'Convenient; recycle or terracycle programs where available.' },
    { title: 'Organic granola bars', subtitle: 'Compare added sugar — “organic” isn’t automatically low sugar.' },
    { title: 'Organic popcorn kernels', subtitle: 'Air-pop at home to control oil and salt.' },
    { title: 'Organic dried mango', subtitle: 'Check for added sugar in ingredient lists.' },
    { title: 'Organic roasted seaweed', subtitle: 'Iodine and crunch; watch sodium if you’re limiting salt.' },
    { title: 'Organic nut butter cups', subtitle: 'Treat swap; still portion-aware.' },
    { title: 'Organic veggie straws (critically)', subtitle: 'Often still starchy — read labels; not a vegetable replacement.' },
    { title: 'Organic baby puffs', subtitle: 'Early finger foods; verify iron and choking guidance.' },
    { title: 'Organic rice cakes', subtitle: 'Mild carrier for nut butter or avocado.' },
    { title: 'Organic dark chocolate', subtitle: 'Higher cacao options usually mean less sugar per square.' },
    { title: 'Organic jerky sticks', subtitle: 'Compare preservatives and sodium across brands.' },
    { title: 'Organic electrolyte drink mix', subtitle: 'Training days — still evaluate sweeteners used.' },
    { title: 'Organic instant oatmeal cups', subtitle: 'Travel breakfast; add nuts for staying power.' },
  ],
  bpaFreeStorage: [
    { title: 'Glass meal-prep set', subtitle: 'Square shapes stack well; avoid microwaving cold glass too fast.' },
    { title: 'Round glass nesting bowls', subtitle: 'Leftovers and mixing — lids with silicone seals vary by brand.' },
    { title: 'Bamboo-lid glass canisters', subtitle: 'Pantry beans and rice with less plastic exposure.' },
    { title: 'Crisper-friendly produce bins', subtitle: 'Washable inserts can help veggies last longer.' },
    { title: 'Silicone stretch lids', subtitle: 'Cover odd bowls instead of one-time plastic wrap.' },
    { title: 'Beeswax wraps kit', subtitle: 'Hand-wash and refresh; not for hot proteins straight from the stove.' },
    { title: 'Stainless bento box', subtitle: 'All-metal lunch for kids who rough-handle gear.' },
    { title: 'Glass baby-food cubes', subtitle: 'Freeze purées in small portions.' },
    { title: 'Oven-safe glass baking dish', subtitle: 'Cook and store in one vessel when size allows.' },
    { title: 'Mason jar wide-mouth bundle', subtitle: 'Salads, overnight oats, dry goods — lids may need separate seal buys.' },
    { title: 'Fridge pitcher with stainless filter', subtitle: 'Cold water station; replace filters on schedule.' },
    { title: 'Dry-goods scoop set', subtitle: 'Less messy pantry refills from bulk bins.' },
    { title: 'Reusable silicone bags', subtitle: 'Sous vide and freezer bags — verify temp ratings.' },
    { title: 'Compost bin countertop', subtitle: 'Divert scraps if your municipality supports composting.' },
    { title: 'Spice jar label kit', subtitle: 'Decant from plastic pouches into uniform glass.' },
  ],
  naturalFiberClothing: [
    { title: 'GOTS organic cotton tees', subtitle: 'Basics rotation; check shrinkage reviews before bulk buying.' },
    { title: 'Organic cotton towels', subtitle: 'Heavier GSM often feels plusher — compare weights.' },
    { title: 'Linen blend shirts', subtitle: 'Breathable summer layers; expect wrinkles.' },
    { title: 'Hemp-cotton socks', subtitle: 'Durable daily wear; read fiber percentages.' },
    { title: 'Organic cotton baby onesies', subtitle: 'Soft first layers; watch zipper vs snap preferences.' },
    { title: 'Organic cotton sheets', subtitle: 'Percale vs sateen feel — personal preference dominates.' },
    { title: 'Wool dryer balls', subtitle: 'Reduce dryer sheets; still separate delicates appropriately.' },
    { title: 'Organic cotton underwear', subtitle: 'Seam placement matters for comfort — scan reviews.' },
    { title: 'Canvas tote (cotton)', subtitle: 'Farmer’s market carry with less thin plastic bag use.' },
    { title: 'Organic cotton hoodie', subtitle: 'Layering piece; compare fleece vs french terry.' },
    { title: 'Linen napkins set', subtitle: 'Washable table swap vs paper.' },
    { title: 'Organic cotton robe', subtitle: 'Post-shower comfort without polyester plush.' },
    { title: 'Wool hiking base layer', subtitle: 'Cold weather — follow wash instructions to avoid shrink.' },
    { title: 'Organic cotton muslin swaddles', subtitle: 'Multi-use blankets for parents building a minimalist kit.' },
    { title: 'Natural fiber dish towels', subtitle: 'Kitchen workhorses; bleach carefully on cotton.' },
  ],
};

function buildExplorePicks(): ExplorePick[] {
  const picks: ExplorePick[] = [];
  for (let i = 0; i < 100; i++) {
    const category = ROTATION[i % ROTATION.length];
    const pool = SEEDS[category];
    const seed = pool[Math.floor(i / ROTATION.length) % pool.length];
    picks.push({
      id: `exp_${i}`,
      title: seed.title,
      subtitle: seed.subtitle,
      category,
    });
  }
  return picks;
}

export const EXPLORE_PICKS: ExplorePick[] = buildExplorePicks();

export function getExplorePickById(id: string): ExplorePick | undefined {
  return EXPLORE_PICKS.find((p) => p.id === id);
}
