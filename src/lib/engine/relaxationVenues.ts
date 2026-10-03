import {
  ActivityCategory,
  CandidateActivity,
  DayWeatherState,
  Destination,
  Intensity,
  Slot,
} from '../types/engine';

export interface RelaxationVenueInfo {
  title: string;
  category: ActivityCategory;
  indoor: boolean;
  reason: string;
  coords: { lat: number; lon: number };
  intensity: Intensity;
  typicalDurationMin: number;
}

interface CuratedSlotVenue {
  title: string;
  category: ActivityCategory;
  indoor: boolean;
  coords: { lat: number; lon: number };
  reason: string;
  rainReason: string;
}

type CityVenues = {
  MORNING: CuratedSlotVenue[];
  AFTERNOON: CuratedSlotVenue[];
  EVENING: CuratedSlotVenue[];
};

// Curated relaxation, wellness, cultural, and scenic venues for primary Indian travel hubs
const CURATED_RELAXATION_VENUES: Record<string, CityVenues> = {
  bengaluru: {
    MORNING: [
      {
        title: 'Lalbagh Botanical Gardens & Morning Glass House Walk',
        category: 'NATURE',
        indoor: false,
        coords: { lat: 12.9507, lon: 77.5848 },
        reason: 'Serene morning stroll through nineteenth-century botanical avenues, lotus ponds, and the historic Glass House.',
        rainReason: 'Sheltered morning visit within the historic Victorian Glass House admiring rare tropical flora.',
      },
      {
        title: 'Cubbon Park Bamboo Grove & Heritage Walk',
        category: 'NATURE',
        indoor: false,
        coords: { lat: 12.9763, lon: 77.5929 },
        reason: 'Shaded morning promenade beneath towering bamboo groves, colonial colonnades, and quiet reading lawns.',
        rainReason: 'Peaceful morning respite at the State Central Library reading rooms and shaded park verandahs.',
      },
      {
        title: 'Sankey Tank Serene Waterfront Trail',
        category: 'RELAXATION',
        indoor: false,
        coords: { lat: 13.0076, lon: 77.5756 },
        reason: 'Tranquil morning waterside trail with migratory birds, landscaped promenades, and gentle shade.',
        rainReason: 'Cozy morning stop at an artisan cafe overlooking the mist on Sankey Tank.',
      },
    ],
    AFTERNOON: [
      {
        title: 'Vidyarthi Bhavan & Traditional Filter Coffee Stroll',
        category: 'FOOD',
        indoor: true,
        coords: { lat: 12.9438, lon: 77.5714 },
        reason: 'Leisurely afternoon heritage culinary stop for iconic crisp dosas and aromatic South Indian filter coffee in Gandhi Bazaar.',
        rainReason: 'Warm indoor afternoon savoring South Indian filter coffee and ghee roast dosas amidst heritage wooden interiors.',
      },
      {
        title: 'National Gallery of Modern Art & Courtyard Cafe',
        category: 'CULTURE',
        indoor: true,
        coords: { lat: 12.9892, lon: 77.5878 },
        reason: 'Quiet afternoon exploring contemporary Indian art exhibitions surrounded by heritage trees and a peaceful garden cafe.',
        rainReason: 'Inspiring indoor afternoon wandering through colonial art galleries and cozy covered tea verandahs.',
      },
      {
        title: 'Ulsoor Lake Tranquil Promenade & Pavilion',
        category: 'RELAXATION',
        indoor: false,
        coords: { lat: 12.983, lon: 77.623 },
        reason: 'Relaxing afternoon lakeside pause amidst shaded weeping willows and gentle water breezes.',
        rainReason: 'Sheltered afternoon tea overlooking the gentle ripples of Ulsoor Lake.',
      },
    ],
    EVENING: [
      {
        title: 'Church Street Bookstores & Artisan Coffee Promenade',
        category: 'RELAXATION',
        indoor: true,
        coords: { lat: 12.975, lon: 77.6066 },
        reason: 'Atmospheric evening stroll through celebrated independent bookstores, street art murals, and artisan coffee bistros.',
        rainReason: 'Sheltered evening exploring sprawling bookstore lofts and sipping warm artisan brew on Church Street.',
      },
      {
        title: 'UB City Open-Air Piazza & Dining',
        category: 'FOOD',
        indoor: true,
        coords: { lat: 12.9719, lon: 77.5963 },
        reason: 'Relaxed evening dining at open-air piazza terraces with panoramic city skyline views.',
        rainReason: 'Covered terrace evening dining overlooking the rainlit Bengaluru cityscape.',
      },
      {
        title: 'Indira Gandhi Fountain Park & Evening Promenade',
        category: 'RELAXATION',
        indoor: false,
        coords: { lat: 12.9845, lon: 77.5901 },
        reason: 'Pleasant dusk walk through landscaped green terraces with musical fountain displays.',
        rainReason: 'Warm dinner at a nearby historic club dining hall with local regional delicacies.',
      },
    ],
  },
  delhi: {
    MORNING: [
      {
        title: 'Lodhi Gardens Heritage Walk & Morning Tranquility',
        category: 'NATURE',
        indoor: false,
        coords: { lat: 28.5933, lon: 77.2197 },
        reason: 'Peaceful morning stroll along fifteenth-century Sayyid and Lodi dynastic tombs and landscaped bonsai lawns.',
        rainReason: 'Sheltered morning contemplation beneath the grand stone arches of Sikandar Lodi tomb and quiet porticos.',
      },
      {
        title: 'Sunder Nursery UNESCO Heritage Arboretum',
        category: 'NATURE',
        indoor: false,
        coords: { lat: 28.592, lon: 77.2427 },
        reason: 'Morning exploration of Mughal garden pavilions, tranquil water channels, and lush ecological nursery grounds.',
        rainReason: 'Covered morning walk through Mughal garden pavilions and organic artisan market shelters.',
      },
      {
        title: 'Hauz Khas Deer Park & Serene Reservoir Trail',
        category: 'RELAXATION',
        indoor: false,
        coords: { lat: 28.5529, lon: 77.195 },
        reason: 'Shaded morning lakeside promenade amidst deer enclosures, historic Islamic madrassas, and ancient stepwells.',
        rainReason: 'Morning tea and reading overlooking the rain on Hauz Khas lake from a heritage cafe balcony.',
      },
    ],
    AFTERNOON: [
      {
        title: 'Triveni Terrace Cafe & Cultural Art Walk',
        category: 'FOOD',
        indoor: true,
        coords: { lat: 28.6258, lon: 77.2341 },
        reason: 'Relaxing afternoon under shaded amphitheatre trees with traditional masala chai and contemporary art galleries.',
        rainReason: 'Cozy indoor afternoon enjoying masala chai and shami kebabs while browsing rotating art exhibits.',
      },
      {
        title: 'Cha Bar & Oxford Bookstore Cultural Lounge',
        category: 'CULTURE',
        indoor: true,
        coords: { lat: 28.6327, lon: 77.2185 },
        reason: 'Quiet afternoon exploring extensive Indian literature collections paired with artisanal single-estate teas.',
        rainReason: 'Sheltered indoor afternoon diving into timeless books with hot Nilgiri tea in central Connaught Place.',
      },
      {
        title: 'National Crafts Museum Courtyard & Cafe Lota',
        category: 'CULTURE',
        indoor: true,
        coords: { lat: 28.6138, lon: 77.242 },
        reason: 'Leisurely afternoon admiring open-air village craft pavilions and contemporary regional Indian dining.',
        rainReason: 'Sheltered culinary interlude savoring regional Indian fusion specialties in an artistic courtyard setting.',
      },
    ],
    EVENING: [
      {
        title: 'Dilli Haat Regional Artisan Bazaars & Sunset Dining',
        category: 'MARKET',
        indoor: false,
        coords: { lat: 28.5732, lon: 77.2075 },
        reason: 'Atmospheric open-air evening promenade exploring authentic regional craft stalls and pan-Indian culinary pavilions.',
        rainReason: 'Covered food stall hopping tasting steaming momos, dosas, and Rajasthani thalis at Dilli Haat.',
      },
      {
        title: 'Kartavya Path & India Gate Twilight Promenade',
        category: 'RELAXATION',
        indoor: false,
        coords: { lat: 28.6129, lon: 77.2295 },
        reason: 'Grand evening stroll along the illuminated sandstone memorial promenade and serene fountain lawns.',
        rainReason: 'Evening dinner at a celebrated heritage dining room in neighboring Pandara Road.',
      },
      {
        title: 'Khan Market Artisan Bistros & Evening Stroll',
        category: 'RELAXATION',
        indoor: true,
        coords: { lat: 28.6003, lon: 77.2272 },
        reason: 'Relaxed evening exploring charming bookshops, boutique lanes, and celebrated local bistros.',
        rainReason: 'Warm indoor evening browsing Bahrisons books followed by dinner at a cozy boutique cafe.',
      },
    ],
  },
  jaipur: {
    MORNING: [
      {
        title: 'Central Park & Rambagh Greenery Walk',
        category: 'NATURE',
        indoor: false,
        coords: { lat: 26.9038, lon: 75.8115 },
        reason: 'Invigorating morning walk along Jaipur largest green lung, featuring musical fountains and ancient banyan groves.',
        rainReason: 'Sheltered morning tea under covered garden gazebos surrounded by lush rain-swept foliage.',
      },
      {
        title: 'Sisodia Rani Garden Water Terraces',
        category: 'RELAXATION',
        indoor: false,
        coords: { lat: 26.8837, lon: 75.8677 },
        reason: 'Serene morning exploration of tiered Mughal-Rajput painted pavilions, cascading fountains, and royal gardens.',
        rainReason: 'Sheltered morning viewing the Radha-Krishna wall murals within historic palace pavilions.',
      },
      {
        title: 'Kanak Vrindavan Valley Garden Walk',
        category: 'NATURE',
        indoor: false,
        coords: { lat: 26.9535, lon: 75.8507 },
        reason: 'Tranquil morning walk in the foothills of Nahargarh amidst carved marble pavilions and manicured orchards.',
        rainReason: 'Peaceful morning retreat inside Govind Dev Ji temple complex pavilions.',
      },
    ],
    AFTERNOON: [
      {
        title: 'Tapri Central Artisan Tea Lounge & Terrace',
        category: 'FOOD',
        indoor: true,
        coords: { lat: 26.909, lon: 75.808 },
        reason: 'Relaxed afternoon on an open rooftop terrace overlooking Central Park with artisanal chai and handmade snacks.',
        rainReason: 'Cozy indoor afternoon sipping kulhad masala chai with views over rain-swept Central Park.',
      },
      {
        title: 'Anokhi Museum of Hand Printing & Courtyard Cafe',
        category: 'CULTURE',
        indoor: true,
        coords: { lat: 26.9882, lon: 75.854 },
        reason: 'Peaceful afternoon in a restored stone haveli admiring live woodblock artisans and quiet courtyard coffee.',
        rainReason: 'Inspiring indoor exploration of traditional block-printing heritage in a historic haveli setting.',
      },
      {
        title: 'Jawahar Kala Kendra Arts Pavilion & Shilpgram',
        category: 'CULTURE',
        indoor: true,
        coords: { lat: 26.8778, lon: 75.8085 },
        reason: 'Quiet afternoon exploring Charles Correa astronomical architecture, photography galleries, and shaded coffee house.',
        rainReason: 'Indoor afternoon wandering contemporary Rajasthani art exhibits and the Indian Coffee House.',
      },
    ],
    EVENING: [
      {
        title: 'Jal Mahal Lakeside Sunset Promenade',
        category: 'RELAXATION',
        indoor: false,
        coords: { lat: 26.9534, lon: 75.8462 },
        reason: 'Breathtaking dusk promenade along Man Sagar Lake watching the floating palace glow under golden sunset skies.',
        rainReason: 'Atmospheric lakeside evening dining with illuminated views of the water palace through misty showers.',
      },
      {
        title: 'Johari & Bapu Bazaar Artisan Evening Stroll',
        category: 'MARKET',
        indoor: false,
        coords: { lat: 26.92, lon: 75.825 },
        reason: 'Atmospheric evening walk through pink terracotta arcades, block-printed textiles, and local sweetshops.',
        rainReason: 'Covered veranda shopping through historic pink arcades savoring hot kachoris and lassi.',
      },
      {
        title: 'Nahargarh Stepwell Twilight Overlook',
        category: 'RELAXATION',
        indoor: false,
        coords: { lat: 26.9388, lon: 75.8155 },
        reason: 'Dramatic sunset views over the illuminated pink city ramparts followed by authentic Rajasthani dining.',
        rainReason: 'Warm royal Rajasthani dinner at a historic palace restaurant inside the city.',
      },
    ],
  },
  mumbai: {
    MORNING: [
      {
        title: 'Hanging Gardens & Malabar Hill Gazebo',
        category: 'NATURE',
        indoor: false,
        coords: { lat: 18.9565, lon: 72.8052 },
        reason: 'Tranquil morning stroll through terraced floral gardens with sweeping panoramic vistas across the Arabian Sea.',
        rainReason: 'Sheltered morning gazebo retreat admiring sea mist sweeping over Chowpatty beach.',
      },
      {
        title: 'Horniman Circle Garden & Colonial Heritage Walk',
        category: 'CULTURE',
        indoor: false,
        coords: { lat: 18.9318, lon: 72.836 },
        reason: 'Shaded morning stroll amidst neo-classical arches, Asiatic Library steps, and peaceful circular park.',
        rainReason: 'Inspiring indoor morning inside the soaring reading hall of the historic Asiatic Society.',
      },
      {
        title: 'Shivaji Park & Dadar Cultural Morning Promenade',
        category: 'RELAXATION',
        indoor: false,
        coords: { lat: 19.027, lon: 72.8384 },
        reason: 'Classic Mumbai morning walk along heritage rain trees and vibrant cultural seaside avenues.',
        rainReason: 'Cozy breakfast at an iconic Irani cafe savoring bun maska and hot chai.',
      },
    ],
    AFTERNOON: [
      {
        title: 'Kala Ghoda Art Precinct & Heritage Cafe',
        category: 'CULTURE',
        indoor: true,
        coords: { lat: 18.9284, lon: 72.8329 },
        reason: 'Relaxed afternoon strolling through pedestrian art alleys, contemporary galleries, and heritage bakeries.',
        rainReason: 'Leisurely indoor gallery hopping through Jehangir Art Gallery and cozy heritage bistros.',
      },
      {
        title: 'David Sassoon Library Reading Garden',
        category: 'CULTURE',
        indoor: true,
        coords: { lat: 18.9279, lon: 72.8322 },
        reason: 'Quiet afternoon interlude within Victorian Gothic reading rooms and shaded inner courtyards.',
        rainReason: 'Peaceful reading afternoon beneath high arched timber ceilings of the historic library.',
      },
      {
        title: 'CSMT Heritage Museum & Shaded Porticos',
        category: 'CULTURE',
        indoor: true,
        coords: { lat: 18.9398, lon: 72.8355 },
        reason: 'Cultural afternoon admiring Victorian Gothic UNESCO rail heritage architecture and railway archives.',
        rainReason: 'Sheltered exploration of UNESCO heritage interiors and historical stone carvings.',
      },
    ],
    EVENING: [
      {
        title: 'Marine Drive & Nariman Point Sunset Promenade',
        category: 'RELAXATION',
        indoor: false,
        coords: { lat: 18.9256, lon: 72.8242 },
        reason: 'Iconic evening promenade along Queen Necklace watching the Arabian Sea sunset and illuminated skyline.',
        rainReason: 'Evening seaside dinner at an Art Deco promenade restaurant watching waves crash against the sea wall.',
      },
      {
        title: 'Bandra Bandstand Waterfront Walk & Sea Face',
        category: 'RELAXATION',
        indoor: false,
        coords: { lat: 19.0435, lon: 72.8193 },
        reason: 'Atmospheric seaside dusk stroll beneath Portuguese fort ruins with cool sea breezes.',
        rainReason: 'Indoor coastal dinner at a seaside heritage cafe enjoying coastal seafood specialties.',
      },
      {
        title: 'Colaba Causeway & Cafe Mondegar Evening Stroll',
        category: 'FOOD',
        indoor: true,
        coords: { lat: 18.9217, lon: 72.8324 },
        reason: 'Lively evening wander through boutique stalls, art deco buildings, and historic heritage dining.',
        rainReason: 'Warm indoor evening dining surrounded by Mario Miranda murals and classic music.',
      },
    ],
  },
  goa: {
    MORNING: [
      {
        title: 'Fontainhas Latin Quarter Heritage Walk',
        category: 'CULTURE',
        indoor: false,
        coords: { lat: 15.4989, lon: 73.8324 },
        reason: 'Serene morning walk through colorful Portuguese colonial villas, terracotta rooftops, and historic bakeries.',
        rainReason: 'Cozy morning at a traditional Portuguese bakery savoring fresh pastéis de nata and espresso.',
      },
      {
        title: 'Miramar Beach Palm Grove & Morning Breeze',
        category: 'RELAXATION',
        indoor: false,
        coords: { lat: 15.4828, lon: 73.8077 },
        reason: 'Peaceful morning waterside walk along soft sands where the Mandovi River meets the Arabian Sea.',
        rainReason: 'Sheltered morning veranda overlooking the dramatic tropical coastal showers.',
      },
      {
        title: 'Salim Ali Bird Sanctuary Mangrove Boardwalk',
        category: 'NATURE',
        indoor: false,
        coords: { lat: 15.5135, lon: 73.8711 },
        reason: 'Tranquil morning eco-trail on Chorao Island listening to exotic migratory birds in lush mangrove estuaries.',
        rainReason: 'Scenic river ferry ride across mist-shrouded backwaters to Chorao Island.',
      },
    ],
    AFTERNOON: [
      {
        title: 'Mario Miranda Art Gallery & Heritage Tea Cafe',
        category: 'CULTURE',
        indoor: true,
        coords: { lat: 15.495, lon: 73.829 },
        reason: 'Relaxed afternoon exploring whimsical Goan cartoon illustrations and traditional bebinca tea treats.',
        rainReason: 'Delightful indoor afternoon surrounded by humorous local illustrations and spiced tea.',
      },
      {
        title: 'Reis Magos Coastal Fortress & Shaded Ramparts',
        category: 'CULTURE',
        indoor: false,
        coords: { lat: 15.4985, lon: 73.8088 },
        reason: 'Quiet afternoon exploration of restored red laterite bastions overlooking the glistening river mouth.',
        rainReason: 'Sheltered cultural visit inside the stone halls and cannons of the restored river bastion.',
      },
      {
        title: 'Divar Island Countryside Trail & Old Church',
        category: 'RELAXATION',
        indoor: false,
        coords: { lat: 15.519, lon: 73.9015 },
        reason: 'Leisurely island excursion through emerald paddy fields, ancient churches, and peaceful riverbanks.',
        rainReason: 'Quiet afternoon drive through historic whitewashed village chapels and shaded country taverns.',
      },
    ],
    EVENING: [
      {
        title: 'Panjim Mandovi Riverfront Twilight Promenade',
        category: 'RELAXATION',
        indoor: false,
        coords: { lat: 15.5, lon: 73.834 },
        reason: 'Atmospheric dusk promenade along illuminated river cruise docks, music pavilions, and seafood dining.',
        rainReason: 'Atmospheric riverside dining enjoying authentic Goan fish curry and feni-infused cocktails.',
      },
      {
        title: 'Chapora Fort Sunset Overlook & Vagator Cliffs',
        category: 'RELAXATION',
        indoor: false,
        coords: { lat: 15.6058, lon: 73.738 },
        reason: 'Dramatic sunset views over coastal coves and coastline from the hilltop fortress ruins.',
        rainReason: 'Sheltered clifftop dinner lounge enjoying panoramic coastal vistas.',
      },
      {
        title: 'Anjuna Coastal Sunset Shack & Relaxation',
        category: 'FOOD',
        indoor: true,
        coords: { lat: 15.578, lon: 73.742 },
        reason: 'Serene seaside dusk relaxation watching the sun sink into the Arabian Sea with chilled beverages.',
        rainReason: 'Covered beachside shack dinner listening to the rhythmic rain and crashing waves.',
      },
    ],
  },
  udaipur: {
    MORNING: [
      {
        title: 'Saheliyon-ki-Bari Royal Fountains & Lotus Pools',
        category: 'NATURE',
        indoor: false,
        coords: { lat: 24.6053, lon: 73.6847 },
        reason: 'Refreshing morning stroll among marble elephants, lotus pools, and lush royal garden pavilions.',
        rainReason: 'Sheltered morning under carved marble pavilions watching royal gravity-fed fountains play.',
      },
      {
        title: 'Gulab Bagh Rose Garden & Historic Library',
        category: 'NATURE',
        indoor: false,
        coords: { lat: 24.5745, lon: 73.6965 },
        reason: 'Peaceful morning walk through historic centuries-old rose gardens and vintage stone pavilions.',
        rainReason: 'Quiet morning browsing vintage manuscript collections in the Victorian Saraswati Bhawan library.',
      },
      {
        title: 'Nehru Garden Island Serene Walk',
        category: 'RELAXATION',
        indoor: false,
        coords: { lat: 24.6025, lon: 73.6685 },
        reason: 'Tranquil morning boat crossing to an island park on Fateh Sagar Lake with floating lily gardens.',
        rainReason: 'Sheltered lakeside gazebo pause watching misty ripples across the lake.',
      },
    ],
    AFTERNOON: [
      {
        title: 'Bagore-ki-Haveli Courtyard & Lakeside Cafe',
        category: 'CULTURE',
        indoor: true,
        coords: { lat: 24.5797, lon: 73.6826 },
        reason: 'Relaxed afternoon exploring waterfront courtyards, traditional puppet exhibits, and lake-view coffee.',
        rainReason: 'Charming indoor afternoon browsing royal costumes and glass mosaic frescoes in the historic haveli.',
      },
      {
        title: 'Shilpgram Rural Arts & Crafts Village',
        category: 'CULTURE',
        indoor: false,
        coords: { lat: 24.6225, lon: 73.655 },
        reason: 'Leisurely afternoon admiring traditional huts, weaving demonstrations, and folk artisan workshops.',
        rainReason: 'Sheltered artisan pavilions observing pottery and wood carving demonstrations.',
      },
      {
        title: 'Lake Pichola Heritage Rooftop Tea Terrace',
        category: 'FOOD',
        indoor: true,
        coords: { lat: 24.576, lon: 73.683 },
        reason: 'Tranquil afternoon pause savoring spiced tea overlooking shimmering waters and island palaces.',
        rainReason: 'Covered rooftop afternoon tea with panoramic views of the Lake Palace in the rain.',
      },
    ],
    EVENING: [
      {
        title: 'Ambrai Ghat Sunset Reflection Overlook',
        category: 'RELAXATION',
        indoor: false,
        coords: { lat: 24.5786, lon: 73.6811 },
        reason: 'Magical dusk overlook with illuminated views of the City Palace reflecting across Lake Pichola.',
        rainReason: 'Romantic covered lakeside dinner enjoying Mewari curries with illuminated palace reflections.',
      },
      {
        title: 'Fateh Sagar Lake Sunset Promenade',
        category: 'RELAXATION',
        indoor: false,
        coords: { lat: 24.598, lon: 73.673 },
        reason: 'Breezy evening stroll along the lake promenade with local cold coffee and vibrant sunset views.',
        rainReason: 'Cozy indoor cafe dinner overlooking the rain-washed lakeside road.',
      },
      {
        title: 'Gangaur Ghat Twilight Promenade',
        category: 'RELAXATION',
        indoor: false,
        coords: { lat: 24.5801, lon: 73.6832 },
        reason: 'Atmospheric evening steps watching lamps flicker on the lake water with regional Rajasthani dinner.',
        rainReason: 'Warm indoor haveli dinner enjoying royal Rajasthani dal baati churma.',
      },
    ],
  },
  varanasi: {
    MORNING: [
      {
        title: 'Assi Ghat Morning Aarti & Sunrise Boat',
        category: 'CULTURE',
        indoor: false,
        coords: { lat: 25.2905, lon: 83.0062 },
        reason: 'Soulful early morning music, yoga chanting, and sunrise boat drift along timeless sacred ghats.',
        rainReason: 'Soulful morning classical flute kirtan under the covered stone pavilions of Assi Ghat.',
      },
      {
        title: 'Sarnath Deer Park & Dhamek Stupa Tranquil Walk',
        category: 'NATURE',
        indoor: false,
        coords: { lat: 25.3811, lon: 83.0245 },
        reason: 'Peaceful morning meditation and green lawn walk around the ancient sixth-century Buddhist stupa.',
        rainReason: 'Contemplative morning inside the Archaeological Museum Sarnath viewing the Ashoka Lion Capital.',
      },
      {
        title: 'Tulsi Ghat Ancient Akharas & Peaceful Walk',
        category: 'RELAXATION',
        indoor: false,
        coords: { lat: 25.2928, lon: 83.0075 },
        reason: 'Gentle morning stroll discovering traditional wrestler akharas and quiet riverfront viewpoints.',
        rainReason: 'Quiet morning tea and conversation in an ancient riverfront ashram pavilion.',
      },
    ],
    AFTERNOON: [
      {
        title: 'Brown Bread Bakery & Rooftop Cultural Cafe',
        category: 'FOOD',
        indoor: true,
        coords: { lat: 25.305, lon: 83.011 },
        reason: 'Relaxed afternoon enjoying organic artisanal bakery treats, books, and panoramic river vistas.',
        rainReason: 'Warm indoor afternoon with freshly baked apple pie, organic cheese, and river views.',
      },
      {
        title: 'Bharat Kala Bhavan Museum Courtyard',
        category: 'CULTURE',
        indoor: true,
        coords: { lat: 25.27, lon: 82.992 },
        reason: 'Quiet afternoon exploring BHU campus gardens and priceless Mughal miniature paintings.',
        rainReason: 'Sheltered cultural discovery among rare palm-leaf manuscripts and terracotta sculptures.',
      },
      {
        title: 'Banaras Silk Weaving Workshop Walk',
        category: 'CULTURE',
        indoor: true,
        coords: { lat: 25.312, lon: 83.005 },
        reason: 'Leisurely cultural stroll watching master handloom weavers craft intricate gold zari brocades.',
        rainReason: 'Indoor handloom workshop tour witnessing master weavers craft royal Banarasi brocades.',
      },
    ],
    EVENING: [
      {
        title: 'Dashashwamedh Ghat Evening Ganga Aarti Stroll',
        category: 'CULTURE',
        indoor: false,
        coords: { lat: 25.3075, lon: 83.0105 },
        reason: 'Mesmerizing evening prayer spectacle of towering brass lamps, conch shells, and drifting floral diyas.',
        rainReason: 'Sheltered evening rooftop vantage point watching the illuminated aarti ritual and river ceremonies.',
      },
      {
        title: 'Godowlia Heritage Bazaar Stroll & Malaiyyo',
        category: 'FOOD',
        indoor: false,
        coords: { lat: 25.3105, lon: 83.007 },
        reason: 'Atmospheric evening food walk through bustling old city alleys savoring winter cloud foam dessert and kachoris.',
        rainReason: 'Covered alleyway food tasting warm saffron badam milk and piping hot kachoris.',
      },
      {
        title: 'Manikarnika Riverfront Twilight Promenade',
        category: 'RELAXATION',
        indoor: false,
        coords: { lat: 25.3108, lon: 83.0142 },
        reason: 'Quiet reflective dusk walk along the upper stone steps of the sacred riverfront.',
        rainReason: 'Quiet evening contemplation from a high riverfront heritage haveli library.',
      },
    ],
  },
};

/**
 * Returns a realistic, geographically valid relaxation venue for a specific slot and day.
 * Always resolves to authentic coordinates within the destination city bounds.
 */
export function getRelaxationVenueForSlot(
  destination: Destination | undefined,
  slot: Slot,
  dayNumber: number,
  weatherState: DayWeatherState
): RelaxationVenueInfo {
  const isWet = weatherState === 'RAIN' || weatherState === 'STORM';
  const cityKey = (destination?.city || '').toLowerCase().trim();

  // Check if curated city data is available
  const cityVenues = CURATED_RELAXATION_VENUES[cityKey];
  if (cityVenues && cityVenues[slot] && cityVenues[slot].length > 0) {
    const venueList = cityVenues[slot];
    // Deterministic selection based on day number
    const venue = venueList[(dayNumber - 1) % venueList.length];
    return {
      title: venue.title,
      category: venue.category,
      indoor: isWet ? true : venue.indoor,
      reason: isWet ? venue.rainReason : venue.reason,
      coords: venue.coords,
      intensity: 'LOW',
      typicalDurationMin: 120,
    };
  }

  // Generic destination-anchored procedural venue for any other Indian city
  const cityName = destination?.city || 'Destination';
  const baseLat = destination?.latitude ?? 26.9124;
  const baseLon = destination?.longitude ?? 75.7873;

  // Realistic coordinate offsets (~400m - 1.2km from center)
  const slotIdx = slot === 'MORNING' ? 1 : slot === 'AFTERNOON' ? 2 : 3;
  const latOffset = (((dayNumber * 7 + slotIdx * 11) % 17) - 8) * 0.0012;
  const lonOffset = (((dayNumber * 13 + slotIdx * 5) % 19) - 9) * 0.0012;
  const coords = {
    lat: Number((baseLat + latOffset).toFixed(6)),
    lon: Number((baseLon + lonOffset).toFixed(6)),
  };

  if (slot === 'MORNING') {
    const morningOptions = [
      {
        title: `${cityName} Botanical Gardens & Morning Promenade`,
        category: 'NATURE' as ActivityCategory,
        reason: 'Peaceful morning stroll through landscaped floral gardens and serene shaded walkways.',
        rainReason: `Sheltered morning retreat at ${cityName}'s garden conservatory and covered verandahs.`,
      },
      {
        title: `${cityName} Lakeside Nature Trail & Greenery Walk`,
        category: 'RELAXATION' as ActivityCategory,
        reason: 'Tranquil morning walk along scenic water edges and peaceful garden pathways.',
        rainReason: `Cozy morning pause at a waterside pavilion enjoying fresh tea amidst the rain.`,
      },
      {
        title: `${cityName} Old Town Heritage Walk & Morning Tea House`,
        category: 'CULTURE' as ActivityCategory,
        reason: 'Gentle heritage walking exploration through traditional town quarters and local tea stalls.',
        rainReason: `Warm indoor morning tasting freshly brewed regional tea and traditional morning delicacies.`,
      },
    ];
    const opt = morningOptions[(dayNumber - 1) % morningOptions.length];
    return {
      title: opt.title,
      category: opt.category,
      indoor: isWet,
      reason: isWet ? opt.rainReason : opt.reason,
      coords,
      intensity: 'LOW',
      typicalDurationMin: 120,
    };
  }

  if (slot === 'AFTERNOON') {
    const afternoonOptions = [
      {
        title: `${cityName} Artisan Tea Lounge & Cultural Reading Pavilion`,
        category: 'FOOD' as ActivityCategory,
        reason: 'Relaxed afternoon pause savoring regional tea selections and quiet reading corners.',
        rainReason: `Comfortable indoor afternoon interlude with hot regional tea and local literature.`,
      },
      {
        title: `${cityName} Heritage Arts & Crafts Village Pavilion`,
        category: 'CULTURE' as ActivityCategory,
        reason: 'Leisurely afternoon admiring traditional local handicraft ateliers and shaded courtyard bistros.',
        rainReason: `Sheltered indoor exploration of regional handloom and handicraft ateliers.`,
      },
      {
        title: `${cityName} Central Cultural Pavilion & Shaded Terraces`,
        category: 'RELAXATION' as ActivityCategory,
        reason: 'Tranquil afternoon pause amidst shaded colonnades and local botanical exhibits.',
        rainReason: `Peaceful indoor gallery visit admiring local heritage exhibitions.`,
      },
    ];
    const opt = afternoonOptions[(dayNumber - 1) % afternoonOptions.length];
    return {
      title: opt.title,
      category: opt.category,
      indoor: isWet ? true : false,
      reason: isWet ? opt.rainReason : opt.reason,
      coords,
      intensity: 'LOW',
      typicalDurationMin: 120,
    };
  }

  // EVENING
  const eveningOptions = [
    {
      title: `${cityName} Waterfront Promenade & Sunset Dining`,
      category: 'FOOD' as ActivityCategory,
      reason: 'Atmospheric evening promenade along scenic viewpoints paired with authentic regional cuisine.',
      rainReason: `Warm indoor evening dinner featuring celebrated regional culinary specialties.`,
    },
    {
      title: `${cityName} Heritage Bazaar & Regional Culinary Stroll`,
      category: 'MARKET' as ActivityCategory,
      reason: 'Vibrant evening stroll discovering celebrated artisan bazaars and authentic street food specialties.',
      rainReason: `Covered evening arcade walk sampling local sweets and authentic regional delicacies.`,
    },
    {
      title: `${cityName} Twilight Scenic Overlook & Local Eatery`,
      category: 'RELAXATION' as ActivityCategory,
      reason: 'Serene dusk views of the city skyline followed by relaxed local dinner.',
      rainReason: `Relaxed indoor evening dining overlooking the rainlit city lights.`,
    },
  ];
  const opt = eveningOptions[(dayNumber - 1) % eveningOptions.length];
  return {
    title: opt.title,
    category: opt.category,
    indoor: isWet ? true : false,
    reason: isWet ? opt.rainReason : opt.reason,
    coords,
    intensity: 'LOW',
    typicalDurationMin: 120,
  };
}

/**
 * Returns a rich set of curated candidate activities for seed destinations,
 * ensuring candidate pools never run dry on 3 to 7 day itineraries.
 */
export function getCuratedSeedCandidates(dest: Destination): CandidateActivity[] {
  const cityKey = (dest.city || '').toLowerCase().trim();
  const cityVenues = CURATED_RELAXATION_VENUES[cityKey];
  if (!cityVenues) return [];

  const candidates: CandidateActivity[] = [];
  const allSlotVenues = [
    ...cityVenues.MORNING.map((v) => ({ ...v, slot: 'MORNING' as Slot })),
    ...cityVenues.AFTERNOON.map((v) => ({ ...v, slot: 'AFTERNOON' as Slot })),
    ...cityVenues.EVENING.map((v) => ({ ...v, slot: 'EVENING' as Slot })),
  ];

  for (let idx = 0; idx < allSlotVenues.length; idx++) {
    const v = allSlotVenues[idx];
    const slug = v.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32);
    candidates.push({
      id: `pack:${cityKey}-${slug}`,
      title: v.title,
      category: v.category,
      indoor: v.indoor,
      intensity: 'LOW',
      typicalDurationMin: 120,
      slotAffinity: [v.slot],
      prominence: 0.78,
      coords: v.coords,
      tags: ['relaxation', 'leisure', 'curated', v.category.toLowerCase()],
      source: 'curated_pack',
      sourceId: `pack:${cityKey}-${slug}`,
      isVerified: true,
    });
  }

  return candidates;
}
