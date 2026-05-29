import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Post as PostType } from '../types';
import { 
  Hash, 
  TrendingUp, 
  Search, 
  X, 
  Flame, 
  Eye, 
  Clock, 
  Newspaper, 
  Activity, 
  Share2, 
  Heart,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Trophy,
  Tv,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PostItem from '../components/PostItem';
import ShareButton from '../components/ShareButton';


// Interactive Cosmic, National, International & Indian News Articles Pool
const NEWS_ARTICLES_POOL = [
  {
    id: 'n1',
    category: 'Cosmology • LIVE FEED',
    region: 'international',
    title: 'Aurora Outbreak Observed on TRAPPIST-1e: Crimson Spectrums Light Up Polar Canopies',
    time: '45 mins ago',
    views: '162K',
    author: 'Commander Leo Thorne',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
    excerpt: 'Atmospheric sensors from orbiting relays register a massive plasma eruption from the red dwarf host star, causing spectacular glowing neon-crimson lights across the planet\'s twilight hemisphere.',
    body: `A spectacular coronal mass ejection (CME) from the red dwarf star TRAPPIST-1 has triggered unprecedented auroral displays on the habitable-zone exoplanet TRAPPIST-1e. Orbiting observatories reported that the planet's atmospheric helium-hydrogen canopy glowed with extraordinary brilliance, shifting across crimson and violet bands for several hours.

Scientists confirmed that the electromagnetic impact was successfully absorbed by the planet's induced magnetosphere, preventing radiation hazards while providing surface-bound monitoring instruments with raw data invaluable for magnetic field modeling. "It’s as if the entire northern ridge is draped in a liquid neon blanket," described telemetry team leader Leo Thorne.

MiniVerse explorers are encouraged to load their regional thermal telescopes and reference system coordinate Node 4-7C to witness the lingering ion sparks.`
  },
  {
    id: 'n2',
    category: 'International • Diplomacy',
    region: 'international',
    title: 'Historic Interstellar Peace Treaty Signed: Orion Sector Declared Open Trade Zone',
    time: '3 hours ago',
    views: '310K',
    author: 'Ambassador Kaelen Drake',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
    excerpt: 'Representatives of three multi-system coalitions ratify the non-aggression agreement designed to protect neutral mining belts and open commerce corridors.',
    body: `Following weeks of intensive, closed-door mediation under international oversight, the Grand Coalition of the Kepler Worlds and the Outer Rim League of Allied States came together to sign the Orion Space Peace Treaty today. All active border checkpoints have shifted to passive status, allowing unrestricted flow of essential mineral convoys and scientific research crafts.

The treaty marks a major diplomatic triumph, settling months-long disputes regarding hyper-lanes inside the dust-dense solar corridor. "This represents an unprecedented victory for mutual advancement," declared Ambassador Drake during his address to the General assembly. Subspace miners can now register their equipment with guaranteed security insurance, as multi-lateral observer vessels begin their surveillance patrols.`
  },
  {
    id: 'n3',
    category: 'International • Transit System',
    region: 'international',
    title: 'Federal Council Approves Phase-4 Gravity Tube Transport Network Expansion',
    time: '2 hours ago',
    views: '145K',
    author: 'Marcus Vance, Cabinet Correspondent',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
    excerpt: 'Inside the latest session, ministers voted overwhelmingly to secure funding for the trans-continental gravity rail system expansion, targeting key industrial hubs.',
    body: `The National Assembly confirmed today the allocation of a multi-billion credit reserve aimed at expediting Phase 4 of the Trans-Continental sub-vacuum hyper-loop. Following heated debates between the domestic conservation lobby and the metropolitan development agency, an agreement was signed guaranteeing strict seismic dampers near sensitive wildlife sectors.

The upgrade is designed to shrink inter-city transport intervals down to under eight minutes while creating tens of thousands of skilled positions across engineering and telemetry. Deputy Director Marcus Vance commented on the milestone: "We are casting the physical foundation for the next century of national cohesion. Clean, super-sonic transit is no longer a localized luxury; it is the fundamental infrastructure pipeline of our nation."`
  },
  {
    id: 'n4',
    category: 'International • Environment',
    region: 'international',
    title: 'Global Climate Summit Ratifies Strict Carbon Drawback Sanctions Pact',
    time: '4 hours ago',
    views: '287K',
    author: 'Sofia Lindqvist, UN Alliance Report',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800&auto=format&fit=crop',
    excerpt: 'Over 180 nations sign the landmark orbital carbon-scrubbing treaty to lock international target metrics into domestic laws.',
    body: `Delegates at the International Climate Summit in Zurich have successfully finalized the text for the Planetary Reclamation Protocol. The treaty introduces a progressive tariff scale that penalizes non-compliant global manufacturing hubs while subsidizing eco-synthetic processing plants in developing territories.

While several industrial conglomerates expressed reservations regarding short-term overhead surges, Lead Negotiator Sofia Lindqvist emphasized that rising sea temperatures and unstable micro-climatological events present an immediate, non-negotiable warning. "Either we construct a unified ecological defense line together, or we navigate catastrophic systemic failures in isolation. There is no second planet to default to."`
  },
  {
    id: 'n5',
    category: 'International • Economy',
    region: 'international',
    title: 'Treasury Secures Base Rate Freeze Following Automation Sector Surplus',
    time: '5 hours ago',
    views: '98K',
    author: 'Sarah Chen, Financial Columnist',
    readTime: '3 min read',
    image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=800&auto=format&fit=crop',
    excerpt: 'The national monetary board kept the benchmark rate unchanged, citing record-high domestic productivity in heavy-robotics manufacturing.',
    body: `Following three consecutive quarters of variable adjustments, the Central Bank has voted to hold baseline interest rates steady at 4.5%. According to treasury documents, this freeze is intentionally designed to support small-and-medium developers investing in sovereign semi-conductor foundries and automated deep-well desalination complexes.

National employment indices have shown exceptional resilience, comfortably balancing recent resource cost spikes while maintaining strong consumer purchasing confidence. Financial analysts expect the interest rate benchmark to remain unaltered until late winter, giving national producers ample runway to optimize their logistical capital grids.`
  },
  {
    id: 'n6',
    category: 'International • Commerce',
    region: 'international',
    title: 'Helium-3 Tariff Accord Stabilizes Long-Range Space Freight Corridor Prices',
    time: '6 hours ago',
    views: '112K',
    author: 'Nadia Thorne, Trade Commissioner',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop',
    excerpt: 'United space cargo carriers reach a unified pricing model to limit speculative cost swings on energy isotope imports.',
    body: `A joint statement released by the International Logistics League and outer orbital refinery hubs confirmed the creation of a standardized pricing floor for Helium-3 fuel harvests. Previously, volatile speculative bidding on regional energy markets triggered severe energy price spikes for terrestrial consumers.

The newly formed alliance establishes fixed transport quotas across major planetary nodes. Trade partners ignoring the framework will face restricted access to docking relays in key sectors. "This establishes predictable energy footprints for national grids across both worlds," stated Trade Commissioner Thorne during the press brief.`
  },
  {
    id: 'n7',
    category: 'International • Science Policy',
    region: 'international',
    title: 'Federal Labs Standardize Bio-Synthetic Gene Sequencing Safeguards',
    time: '7 hours ago',
    views: '84K',
    author: 'Dr. Alaina Croft, Board Chair',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?q=80&w=800&auto=format&fit=crop',
    excerpt: 'New regulatory frameworks require dual-step biometric verification for all gene editing research labs.',
    body: `To prevent non-intentional mutation feedback loops in domestic agricultural crops, the National Biosafety Bureau has mandated high-tier safety frameworks across all public and private genetics companies. Laboratories must implement real-time tracking of isolated cultures and secure secondary containment overrides.

"We must lead with responsibility," stated Dr. Croft. "By implementing these safeguards, our nation secures a highly competitive, fully certified bio-synthetic industry while preserving ecological integrity." The guidelines will take effect at the start of the next fiscal quarter.`
  },
  {
    id: 'n8',
    category: 'International • Science',
    region: 'international',
    title: 'Multi-Nation Team Activates Giant Deep Space Gravitational Sensor Matrix',
    time: '8 hours ago',
    views: '410K',
    author: 'Dr. Elena Rostova, Physics Alliance',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=800&auto=format&fit=crop',
    excerpt: 'Collaborative project between twelve nations breaks previous wave detection threshold, mapping galactic cores.',
    body: `A historic scientific milestone has been attained by the International Subspace Research Consortium. By networking forty-two deep-space satellites in synchronous orbital configurations, scientists have successfully mapped gravitational micro-waves emanating from core stellar anomalies.

The discovery bypasses old cosmic dust visual blockages, allowing researchers to peer directly into the core dynamics of neighboring star clusters with absolute clarity. "Our shared human intelligence is no longer restricted to local light horizons," exclaimed a celebratory Dr. Rostova. Data sets will be shared across all contributing national standard academic portals.`
  },
  {
    id: 'n9',
    category: 'India • Space Technology',
    region: 'indian',
    title: 'ISRO Activates Aditya-L2 Solar Dust Particle Analyzer at Lagrange Node',
    time: '15 mins ago',
    views: '220K',
    author: 'Dr. Rajesh Iyer, Indian Space Science Bureau',
    readTime: '3 min read',
    image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=800&auto=format&fit=crop',
    excerpt: 'In a phenomenal achievement for India\'s space tech program, the Indian Space Research Organisation has successfully locked orbit coordinates with Aditya-L2.',
    body: `The Indian Space Research Organisation (ISRO) has successfully activated the Aditya-L2 solar tracking probe at its designated Lagrange Node. This represents India\'s second major deep-space monitoring baseline station, designed to work in synergy with international networks to forecast high-energy solar storms.

Over three dozen tracking antenna installations across Karnataka and Maharashtra synchronized commands to lock telemetry with Aditya-L2. "We have attained zero-noise feedback on our heavy magnetic scanners," stated Director Iyer. The dataset is already assisting agricultural and telecommunication hubs nationwide in safeguarding vital orbital channels.`
  },
  {
    id: 'n10',
    category: 'India • Infrastructure',
    region: 'indian',
    title: 'Mumbai-Ahmedabad Bullet Train Project Integrates High-Speed Maglev Grid',
    time: '1 hour ago',
    views: '185K',
    author: 'Priya Sharma, Urban Transport Review',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1541410965313-d53b3c16ef17?q=80&w=800&auto=format&fit=crop',
    excerpt: 'Commence of state-of-the-art super-cooled magnetic levitation tracks achieves record speeds of 510 km/h in safety trials.',
    body: `India\'s ministry of transport confirmed the successful integration of localized super-cooled magnetic levitation tracks across the Mumbai-Ahmedabad transit corridor. Commercial trials clocked speeds of 510 km/h, cutting the historic transit time down to an unprecedented eighty-four minutes.

The expansion incorporates high-grade seismic safety dampeners and fully automated drone track monitors. Regional planning departments expect the corridor to service nearly four million passengers annually, setting a new global benchmark for high-speed eco-friendly transit for the nation.`
  },
  {
    id: 'n11',
    category: 'India • Technology',
    region: 'indian',
    title: 'Bengaluru Silicon Valley Unveils Sovereign Neuromorphic Quantum Processor',
    time: '2 hours ago',
    views: '295K',
    author: 'Aravind Swaminathan, Tech India Review',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop',
    excerpt: 'Premier IIT consortium releases "Tejas-V1", a state-of-the-art neuromorphic core built on advanced silicon synapses.',
    body: `A consortium of premier Indian research institutes and technology unicorns has unveiled "Tejas-V1", an advanced neuromorphic core utilizing artificial neural synapses built directly onto silicon. The processor will power real-time translation models and automated heavy manufacturing units across the Indian subcontinent.

Funded under the National Quantum Roadmap, Tejas-V1 consumes less than five percent of the power used by standard digital AI cards. "This is a monumental step for sovereign technology autonomy," declared Minister Swaminathan.`
  },
  {
    id: 'n12',
    category: 'India • E-Governance',
    region: 'indian',
    title: 'Unified Payment Network Launches Version 3.0 to Support Decentralized Trade',
    time: '4 hours ago',
    views: '343K',
    author: 'Nisha Pillai, FinTech India',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1601597111158-2fceff270190?q=80&w=800&auto=format&fit=crop',
    excerpt: 'The national payments board deploys real-time cryptographic transaction pipelines to bolster direct-to-consumer digital markets.',
    body: `India's National Payments Corporation deployed its high-performance UPI 3.0 protocol core database today. The core update allows high-volume merchant networks to process dual-signature micro-settlements instantly without intermediary processing delays.

Sovereign micro-shops and rural cooperatives in states like Kerala, Rajasthan, and Uttar Pradesh have reported seamless operations in early pilots, cutting financial transaction costs to absolute zero. Financial observers claim this sets a global gold standard for democratic digital public infrastructure, showing how modern technology can empower local communities directly.`
  }
];

// Interactive Sports Updates Pool
const SPORTS_UPDATES_POOL = [
  {
    id: 's1',
    category: 'Zero-G Racing • FINALS',
    region: 'international',
    title: 'Supersonic Sling Shot Decides Gravitational Prix Championship',
    time: '2 hours ago',
    views: '78K',
    author: 'Nexus Sports Network',
    readTime: '3 min read',
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
    excerpt: 'Pilot Sterling clinches Saturn Ring League Cup with a fraction-of-a-second maneuver inside Cassini orbit division.',
    body: `A historic finish in the Cassini Orbit Circuit saw rookie racer Zara Sterling bypass leader Jax Vano using a high-risk grav-slingshot maneuver. 

Entering Cassini\'s heavy dust threshold without automated thruster aids, Sterling utilized the gravitational field of Saturn\'s outer moonlet to generate a localized micro-slingshot, overtaking Vano with only three milliseconds to spare. Observers called it the most spectacular piece of manual piloting displayed this orbital cycle.`
  },
  {
    id: 's2',
    category: 'Orbit Athletics',
    region: 'international',
    title: 'Hoverboard Freestyle Trials Open Today in Low-G Dome Sector 9',
    time: '1 day ago',
    views: '54K',
    author: 'Dome Athletics board',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?q=80&w=800&auto=format&fit=crop',
    excerpt: 'Contenders demonstrate impossible aerial configurations under 0.1 Earth gravities.',
    body: `The freestyle board trials have commenced under low-gravity domes at Moon Station 9, drawing enthusiasts globally. 

Due to the dome\'s 0.1g pressure state, athletes are performing tricks with extended airtimes reaching twelve seconds per flight, integrating extreme twists and particle-discharge visuals. Safety regulations remain strict, with dampening energy fields active across the boundary floors.`
  },
  {
    id: 's3',
    category: 'Interstellar Yachting',
    region: 'international',
    title: 'National Vessel "Solar Winds" Clinches First Place in Stellar Cup',
    time: '2 days ago',
    views: '61K',
    author: 'Oceanic & Space Sports',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800&auto=format&fit=crop',
    excerpt: 'Team registers record speed riding heavy ion storms from Jovian atmospheric margins.',
    body: `Our national sailing squadron accomplished an unprecedented victory in the Jovian Starprix, navigating extremely high-turbulent hydrogen belts to reach the finish corridor ahead of thirty-one international sailing crews. Captain Linus Thorne praised his crew's precision under peak pressure.`
  },
  {
    id: 's4',
    category: 'Cricket • India',
    region: 'indian',
    title: 'India Triumphs in Spectacular Twenty20 World Series Grand Finale',
    time: '3 hours ago',
    views: '412K',
    author: 'Vikram Malhotra, Sports India Correspondent',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=800&auto=format&fit=crop',
    excerpt: 'Pinpoint death bowling and an outstanding unbeaten half-century trigger absolute euphoria across 1.4 billion cricket fanatics.',
    body: `In an unforgettable final thriller, India clinched the premier Twenty20 international series cup. With sixteen runs needed in the final over, India\'s lead pace bowlers executed perfect laser-guided yorkers to seal the victory.

The stadium in Ahmedabad erupted as the final ball was safely caught, initiating sweeping celebrations in national tech cities from Mumbai and Delhi to Chennai. "The team\'s mental resolve under peak pressure was outstanding," beamed head coach Rahul during the press briefing.`
  },
  {
    id: 's5',
    category: 'Athletics • India',
    region: 'indian',
    title: 'Neeraj Chopra Claims Historical Gold Medal at World Athletics Meet',
    time: '1 day ago',
    views: '245K',
    author: 'Ananya Sen, Athletic National Desk',
    readTime: '3 min read',
    image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=800&auto=format&fit=crop',
    excerpt: 'A sensational javelin throw of 89.44 meters on the first attempt secures top podium spot for India.',
    body: `India\'s athletic pioneer Neeraj Chopra secured another historic gold medal at the World Track & Field Championships. Launching an astounding 89.44-meter throwing arc on his very first attempt, Chopra immediately set a high standard that proved insurmountable for international competitors.

Speaking to reporters with the national flag draped across his shoulders, Chopra dedicated the win to aspiring track athletes across smaller towns and regions in India: "Sovereign talent is everywhere. We just need to give our youth proper tracks and support grids."`
  }
];

// Interactive Entertainment Headlines Pool
const ENTERTAINMENT_ARTICLES_POOL = [
  {
    id: 'e1',
    category: 'Metaverse Music • EXCLUSIVE',
    region: 'international',
    title: 'Synthwave Band "Neon Pulsar" Launches Infinite Generative Album',
    time: '5 hours ago',
    views: '122K',
    author: 'Vaporwave Chronicles',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
    excerpt: 'Each listener streams a custom algorithmic soundtrack generated from active solar winds and radiation monitors.',
    body: `Pioneering music collective "Neon Pulsar" has released their first infinite-stream generative LP, titled "Cosmic Static".

The album relies on live inputs fetched from solar array monitors near Jupiter. Changes in radiation waves influence tempo, chord voicings, and synthesizer modulations, providing each listener with an authentic, unique audio tapestry that changes with the solar clock.`
  },
  {
    id: 'e2',
    category: 'Holographic Art',
    region: 'international',
    title: 'Starlight Art Gala Unveils Giant Bioluminescent Nebula Projections',
    time: '1 day ago',
    views: '88K',
    author: 'Starlight Culture Core',
    readTime: '3 min read',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800&auto=format&fit=crop',
    excerpt: 'New installations use projection mapping to reshape the virtual city sky into custom galaxy structures.',
    body: `The annual Starlight Gala opened with a mind-binding sky projection crafted by neural art models.

Spanning over six blocks of orbital virtual dome space, the projection creates beautiful simulated dust clouds that interact with the physical movements of passing hover-crafts. "We wanted to blend architectural structures with stellar elements," commented the primary visual artist.`
  },
  {
    id: 'e3',
    category: 'Digital Sculpture',
    region: 'international',
    title: 'International Cyber Gala Awards First Prize to Quantum Fractal Wave',
    time: '3 days ago',
    views: '109K',
    author: 'Curation Desk',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-108739773434-c26b3d09e071?q=80&w=800&auto=format&fit=crop',
    excerpt: 'Dynamic math sculpture morphs based on real-time trade records of the global stock exchanges.',
    body: `A mesmerizing display combining raw mathematical structures with physical color-wave guides took home the sovereign gold medal at this year's digital art convention. Utilizing real-time values from the world indexes, the fractal changes dynamic states continuously.`
  },
  {
    id: 'e4',
    category: 'Indian Cinema • Box Office',
    region: 'indian',
    title: 'Epic Action Spectacle "Rudra: Dawn of Force" Shatters Box Office Records',
    time: '5 hours ago',
    views: '380K',
    author: 'Karan Gupta, Indian Cinema Review',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop',
    excerpt: 'The revolutionary Indian cinematic block-buster crosses 800 crores globally on its spectacular opening weekend.',
    body: `Rudra: Dawn of Force has delivered a historical box office opening, registering the highest-grossing opening weekend in modern Indian cinema. With state-of-the-art computer-aided graphics and a gripping narrative set in ancient and sci-fi timelines, theaters in Bengaluru, Hyderabad, and Delhi have reported continuous house-full boards.

"We wanted to build an immersive world that represents indigenous historical epics without sacrificing modern visual mastery," stated the leading director during the victory event close to Jaipur.`
  },
  {
    id: 'e5',
    category: 'Indian Music • Fusion',
    region: 'indian',
    title: 'Future Ragas: Classical Indie Collective Tops International Streaming Charts',
    time: '2 days ago',
    views: '165K',
    author: 'Meera Sen, Indian Soundscapes Daily',
    readTime: '3 min read',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
    excerpt: 'Blending traditional sitar ragas with modern synthwave, the new collective gathers millions of global streams.',
    body: `Sovereign indie collective "Tarana" has made waves by taking the #1 spot on multiple global ambient music lists. Integrating traditional Hindustani and Carnatic sitar ragas with space-ambient synthesizers and slow-tempo drum loops, the group has successfully modernised classical Indian arrangements.

"Music is a cosmic fluid," explained sitarist Aarav Pillai. "Traditional ragas are beautifully aligned with emotional and environmental clocks. Coupling them with ambient tech synth wave makes the experience highly accessible for the generation in digital spaces."`
  }
];

// In-Memory synchronous shuffling tools for refresh variation
const shuffle = (array: any[]) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const randomizeMetadata = (prefix: string, list: any[]) => {
  return list.map((item, idx) => {
    const minutes = Math.floor(Math.random() * 50) + 5;
    const hours = Math.floor(Math.random() * 22) + 1;
    const days = Math.floor(Math.random() * 4) + 1;
    
    let timeStr = `${minutes}m ago`;
    if (idx === 1) timeStr = `${hours}h ago`;
    else if (idx > 2) timeStr = `${days}d ago`;

    const viewsCount = `${Math.floor(Math.random() * 320) + 20}K`;
    
    return {
      ...item,
      id: `${prefix}-${item.id}`,
      time: timeStr,
      views: viewsCount
    };
  });
};

type CategoryType = 'for_you' | 'trending' | 'news' | 'sports' | 'entertainment';

export default function Explore() {
  const [trendingPosts, setTrendingPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchVal, setSearchVal] = useState('');
  
  // Dynamic shuffled state to support refreshing with brand new sets of news, sports, and entertainment
  const [shuffledNews, setShuffledNews] = useState<any[]>(() =>
    randomizeMetadata('news', shuffle(NEWS_ARTICLES_POOL))
  );
  const [shuffledSports, setShuffledSports] = useState<any[]>(() =>
    randomizeMetadata('sports', shuffle(SPORTS_UPDATES_POOL))
  );
  const [shuffledEntertainment, setShuffledEntertainment] = useState<any[]>(() =>
    randomizeMetadata('entertainment', shuffle(ENTERTAINMENT_ARTICLES_POOL))
  );
  const [spotlightArticle, setSpotlightArticle] = useState<any>(() => {
    const news = randomizeMetadata('news', shuffle(NEWS_ARTICLES_POOL));
    return news[0] || null;
  });

  // Region and Refresh filters
  const [selectedRegion, setSelectedRegion] = useState<'all' | 'indian' | 'international'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isFetchingLive, setIsFetchingLive] = useState(false);

  const fetchLiveNews = async (forceRefresh = false) => {
    setIsFetchingLive(true);
    try {
      const response = await fetch(`/api/explore/news${forceRefresh ? '?refresh=true' : ''}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      const data = await response.json();
      if (data && data.news && data.sports && data.entertainment) {
        setShuffledNews(data.news);
        setShuffledSports(data.sports);
        setShuffledEntertainment(data.entertainment);
        if (data.news.length > 0) {
          setSpotlightArticle(data.news[0]);
        }
      }
    } catch (err) {
      console.warn('Could not fetch live grounded news from Gemini API, falling back to static pool:', err);
    } finally {
      setIsFetchingLive(false);
    }
  };

  useEffect(() => {
    fetchLiveNews(false);
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchLiveNews(true);
    setRefreshing(false);
  };

  // Custom suggestion close state
  const [showCreativePresets, setShowCreativePresets] = useState<boolean>(() => {
    return localStorage.getItem('explore_creative_presets_show') !== 'false';
  });

  const [activeTab, setActiveTab] = useState<CategoryType>('for_you');

  useEffect(() => {
    setSelectedRegion('all');
  }, [activeTab]);
  
  // Active selected article modal state
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [articleLiked, setArticleLiked] = useState<boolean>(false);
  const [articleLikesCount, setArticleLikesCount] = useState<number>(142);

  const filterQuery = searchParams.get('q') || '';

  // Dynamically extract real hashtags & keywords from live database posts
  const realTrends = React.useMemo(() => {
    const hashtagMap: Record<string, { topic: string; count: number; category: string; postIds: Set<string> }> = {};

    trendingPosts.forEach((post) => {
      if (!post.text) return;
      // Find all hashtag matches: e.g. #SomeTag, #space_race
      const matches = post.text.match(/#[a-zA-Z0-9_\u0400-\u04FF]+/g);
      if (matches) {
        matches.forEach((match) => {
          const topic = match;
          const key = topic.toLowerCase();
          if (hashtagMap[key]) {
            hashtagMap[key].count += 1;
            hashtagMap[key].postIds.add(post.id);
          } else {
            hashtagMap[key] = {
              topic,
              count: 1,
              category: 'Active Topic • Live',
              postIds: new Set([post.id]),
            };
          }
        });
      }
    });

    let extracted = Object.values(hashtagMap).map((item, index) => ({
      id: `trend-${index}-${item.topic}`,
      category: item.category,
      topic: item.topic,
      postsCount: `${item.count} ${item.count === 1 ? 'post' : 'posts'}`
    }));

    // If there are fewer than 5 unique hashtags in active posts, extract popular high-quality keywords from posts text
    if (extracted.length < 5) {
      const stopwords = new Set([
        'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
        'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'could',
        'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
        'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
        'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
        'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'you', 'your', 'yours', 'yourself', 'yourselves', 'will', 'just', 'like', 'using', 'also', 'made', 'some', 'make', 'just', 'hello', 'good', 'interactive', 'orion'
      ]);

      const wordMap: Record<string, { word: string; count: number; postIds: Set<string> }> = {};
      
      trendingPosts.forEach((post) => {
        if (!post.text) return;
        // Strip punctuation and split on whitespace
        const words = post.text
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ')
          .split(/\s+/);
        
        words.forEach((w) => {
          const cleanWord = w.trim().toLowerCase();
          // Filter out words that are short, stopwords, or look like links, numbers, user tags
          if (
            cleanWord.length > 3 && 
            !stopwords.has(cleanWord) && 
            !cleanWord.startsWith('http') && 
            !cleanWord.startsWith('@') &&
            !cleanWord.startsWith('#') &&
            !/^\d+$/.test(cleanWord)
          ) {
            const capitalized = w.charAt(0).toUpperCase() + w.slice(1);
            if (wordMap[cleanWord]) {
              wordMap[cleanWord].count += 1;
              wordMap[cleanWord].postIds.add(post.id);
            } else {
              wordMap[cleanWord] = {
                word: capitalized,
                count: 1,
                postIds: new Set([post.id])
              };
            }
          }
        });
      });

      // Sort words by frequency
      const sortedWords = Object.values(wordMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10 - extracted.length);

      sortedWords.forEach((item, index) => {
        const hashTag = `#${item.word}`;
        // Ensure no duplicates in the trends
        if (!extracted.some(ex => ex.topic.toLowerCase() === hashTag.toLowerCase())) {
          extracted.push({
            id: `word-trend-${index}-${item.word}`,
            category: 'Trending Keyword • Live',
            topic: hashTag,
            postsCount: `${item.count} ${item.count === 1 ? 'mention' : 'mentions'}`
          });
        }
      });
    }

    // Secondary fallback to guarantee no empty slate
    if (extracted.length === 0) {
      extracted = [
        { id: 't1', category: 'General • Live', topic: '#MiniVerse', postsCount: '0 posts' },
        { id: 't2', category: 'AI • Live', topic: '#OrionAI', postsCount: '0 posts' },
      ];
    }

    return extracted;
  }, [trendingPosts]);

  useEffect(() => {
    setSearchVal(filterQuery);
  }, [filterQuery]);

  // Synchronize Firestore Posts
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PostType[];
      
      // Sort posts by engagement
      const sorted = [...posts].sort((a, b) => {
        const aEng = (a.likes?.length || 0) + (a.commentsCount || 0) + (a.reposts?.length || 0);
        const bEng = (b.likes?.length || 0) + (b.commentsCount || 0) + (b.reposts?.length || 0);
        return bEng - aEng;
      });
      
      setTrendingPosts(sorted);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      setSearchParams({ q: searchVal.trim() });
    } else {
      setSearchParams({});
    }
  };

  const clearFilter = () => {
    setSearchVal('');
    setSearchParams({});
  };

  const selectTrendQuery = (trend: string) => {
    setSearchVal(trend);
    setSearchParams({ q: trend });
  };

  const dismissCreativePresets = () => {
    setShowCreativePresets(false);
    localStorage.setItem('explore_creative_presets_show', 'false');
  };

  // Filter posts based on query
  const filteredPosts = trendingPosts.filter(post => {
    if (!filterQuery) return true;
    const queryLower = filterQuery.toLowerCase();
    const textLower = (post.text || '').toLowerCase();
    const displayNameLower = (post.displayName || '').toLowerCase();
    return textLower.includes(queryLower) || displayNameLower.includes(queryLower);
  });

  // Open particular news modal
  const openNewsDetails = (article: any) => {
    setSelectedArticle(article);
    setArticleLiked(false);
    setArticleLikesCount(Math.floor(Math.random() * 200) + 70);
  };

  const activeSpotlight = spotlightArticle || NEWS_ARTICLES_POOL[0];

  return (
    <div className="w-full flex flex-col min-h-full">
      
      {/* Sticky Top Header & Pill Search */}
      <div className="sticky top-0 z-35 bg-[#0f172a]/90 backdrop-blur-md border-b border-white/5 pb-2 pt-4 px-4 md:px-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          
          {/* Twitter Style Pill Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search cosmic trends, keyword or posts..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-[#1e293b]/60 border border-white/5 hover:border-white/10 hover:bg-[#1e293b]/90 focus:border-indigo-500/80 focus:bg-[#0f172a] outline-none text-white px-5 py-3 pl-11 pr-11 rounded-full text-xs transition-all shadow-inner placeholder-slate-500 font-medium"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            {searchVal && (
              <button
                type="button"
                onClick={clearFilter}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                title="Clear Search"
              >
                <X size={13} />
              </button>
            )}
          </form>

          {/* Sliding Navigation Tabs (Only visible when NOT showing active global filter query) */}
          {!filterQuery && (
            <div className="flex border-b border-white/5 overflow-x-auto scrollbar-hide -mx-4 px-4 select-none">
              <div className="flex space-x-6 min-w-max text-xs">
                {(['for_you', 'trending', 'news', 'sports', 'entertainment'] as CategoryType[]).map((tab) => {
                  const label = {
                    for_you: 'For you',
                    trending: 'Trending',
                    news: 'News',
                    sports: 'Sports',
                    entertainment: 'Entertainment'
                  }[tab];
                  const active = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-3.5 px-1 relative transition-colors focus:outline-none cursor-pointer font-bold ${
                        active ? 'text-[#00ffd5]' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{label}</span>
                      {active && (
                        <motion.div 
                          layoutId="activeExploreTab" 
                          className="absolute bottom-0 left-0 right-0 h-1 bg-[#00ffd5] rounded-full" 
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-Filters for Regions & Refresh Trigger */}
          {!filterQuery && ['news', 'sports', 'entertainment'].includes(activeTab) && (
            <div className="flex items-center justify-between pt-1 pb-1 gap-2 border-t border-white/5 select-none animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
                {(['all', 'indian', 'international'] as const).map((region) => {
                  const label = {
                    all: { news: 'All News', sports: 'All Sports', entertainment: 'All Feeds' }[activeTab as 'news' | 'sports' | 'entertainment'],
                    indian: '🇮🇳 India',
                    international: '🌐 International'
                  }[region];

                  const active = selectedRegion === region;
                  return (
                    <button
                      key={region}
                      type="button"
                      onClick={() => setSelectedRegion(region)}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                        active 
                          ? 'bg-[#00ffd5]/15 text-[#00ffd5] border-[#00ffd5]/40 shadow-xs' 
                          : 'bg-white/5 text-slate-400 border-white/5 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Refresh Trigger */}
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={refreshing || isFetchingLive}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-full text-slate-300 hover:text-white transition-all cursor-pointer shrink-0 disabled:opacity-40 flex items-center justify-center hover:scale-105 active:scale-95"
                title="Refresh Updates"
              >
                <RefreshCw size={11} className={refreshing || isFetchingLive ? 'animate-spin text-[#00ffd5]' : ''} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Explore Content Stream */}
      <div className="flex-1 p-4 md:p-6 w-full max-w-2xl mx-auto space-y-6">
        
        {/* Render Search Results View if Filtering */}
        {filterQuery ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-sm uppercase tracking-wide">
                <TrendingUp size={16} />
                <span>Search Results in MiniVerse</span>
              </div>
              <button 
                onClick={clearFilter} 
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5 hover:border-white/10 rounded-full transition-all"
              >
                <span>Clear search</span>
                <X size={12} />
              </button>
            </div>

            {/* Simulated matching trend widget for search feedback */}
            {filterQuery.startsWith('#') && (
              <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950/20 border border-indigo-500/10 rounded-3xl animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                      <Flame size={11} className="text-amber-400 animate-pulse" /> Popular Trend
                    </span>
                    <h4 className="text-base font-extrabold text-white">{filterQuery}</h4>
                    <p className="text-[11px] text-slate-400">
                      Exploring cosmic discussions about {filterQuery.slice(1)} under premium feeds.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs bg-indigo-500/20 text-[#00ffd5] border border-indigo-400/20 px-2.5 py-1 rounded-full font-bold">
                      {(Math.random() * 80 + 20).toFixed(1)}K posts
                    </span>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center p-16">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <PostItem key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
                <div className="text-3xl mb-3">🌌</div>
                <h4 className="font-bold text-white text-sm">No Cosmic Posts Found</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto p-2">
                  No post currently matches "{filterQuery}". Be the first to initiate a thread with this hashtag!
                </p>
              </div>
            )}
          </div>
        ) : (
          
          /* Render Active Sub-Tab View */
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              
              {/* TAB 1: FOR YOU */}
              {activeTab === 'for_you' && (
                <>
                  {/* Curated Spotlight Hero Banner */}
                  <div 
                    onClick={() => openNewsDetails(activeSpotlight)}
                    className="relative rounded-3xl overflow-hidden border border-white/5 bg-slate-900 group cursor-pointer aspect-video md:aspect-[2/1] shadow-xl shadow-slate-950/50"
                  >
                    <img 
                      src={activeSpotlight.image} 
                      alt="Spotlight" 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 brightness-75"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col justify-end p-5 md:p-6 text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] uppercase font-black bg-[#00ffd5]/20 text-[#00ffd5] px-2.5 py-0.5 rounded-full border border-[#00ffd5]/35 tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                          What's Happening • Live
                        </span>
                        <span className="text-[10px] text-white/50">{activeSpotlight.time}</span>
                      </div>
                      <h3 className="text-base md:text-xl font-extrabold leading-snug text-white tracking-tight group-hover:text-amber-200 transition-colors">
                        {activeSpotlight.title}
                      </h3>
                      <p className="text-xs text-white/60 line-clamp-2 mt-2 leading-relaxed font-sans font-medium">
                        {activeSpotlight.excerpt}
                      </p>
                    </div>
                  </div>

                  {/* Closable Prompt Presets Panel ("Suggested for Creative Lens") */}
                  {showCreativePresets && (
                    <div className="p-5 bg-gradient-to-r from-indigo-950/20 to-slate-900 border border-indigo-500/10 rounded-3xl relative overflow-hidden text-left">
                      <div className="absolute right-3 top-3">
                        <button 
                          onClick={dismissCreativePresets}
                          className="p-1 px-1.5 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Dismiss Suggestions"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center shrink-0">
                          <Sparkles className="text-indigo-400" size={16} />
                        </div>
                        <div className="space-y-2 max-w-md">
                          <h4 className="text-xs font-extrabold text-indigo-300 tracking-tight">Suggested Creative Lenses</h4>
                          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                            Introduce some interstellar topics straight to the MiniVerse searches! Select a prompt lens below:
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1.5">
                            <button 
                              onClick={() => selectTrendQuery('#TRAPPIST1e')}
                              className="text-[11px] font-bold bg-[#1e293b] hover:bg-indigo-600/20 hover:text-indigo-300 text-slate-300 px-3 py-1.5 rounded-xl border border-white/5 transition-all text-left"
                            >
                              🚀 Analyze #TRAPPIST1e
                            </button>
                            <button 
                              onClick={() => selectTrendQuery('#Gemini35Flash')}
                              className="text-[11px] font-bold bg-[#1e293b] hover:bg-indigo-600/20 hover:text-indigo-300 text-slate-300 px-3 py-1.5 rounded-xl border border-white/5 transition-all text-left"
                            >
                              🌌 Exploit #Gemini35Flash
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Curated Mini-Trends Section in For You */}
                  <div className="space-y-4 border-b border-white/5 pb-6 text-left">
                    <h3 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-1.5">
                      <TrendingUp size={16} className="text-[#00ffd5]" /> Trends For You
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {realTrends.slice(0, 4).map((trend) => (
                        <div 
                          key={trend.id}
                          onClick={() => selectTrendQuery(trend.topic)}
                          className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl cursor-pointer transition-all active:scale-98 group hover:border-[#00ffd5]/20 flex justify-between items-center"
                        >
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-500 font-bold">{trend.category}</span>
                            <h4 className="text-xs font-extrabold text-white group-hover:text-[#00ffd5] transition-colors">{trend.topic}</h4>
                            <span className="text-[10px] text-slate-400 block">{trend.postsCount}</span>
                          </div>
                          <ChevronRight size={14} className="text-slate-600 group-hover:text-white transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Live Feed Posts (Engaging posts from DB) */}
                  <div className="space-y-4 text-left">
                    <h3 className="text-sm font-black text-white tracking-widest uppercase mb-1 flex items-center gap-1.5">
                      <Activity size={16} className="text-indigo-400" /> Popular Cosmos Timeline
                    </h3>
                    
                    {loading ? (
                      <div className="flex justify-center p-12">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : trendingPosts.length > 0 ? (
                      <div className="space-y-4">
                        {trendingPosts.slice(0, 15).map((post) => (
                          <PostItem key={post.id} post={post} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 opacity-45 italic text-xs">
                        No active MiniVerse posts logged. Submit creative updates to fill this channel!
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* TAB 2: TRENDING */}
              {activeTab === 'trending' && (
                <div className="space-y-4 text-left">
                  <header>
                    <h3 className="text-base font-black text-white tracking-tight">Live Trending Topics</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Real-time hashtags and active keywords parsed from platform updates</p>
                  </header>

                  <div className="bg-white/5 border border-white/5 rounded-3xl divide-y divide-white/5 overflow-hidden">
                    {realTrends.map((trend, i) => (
                      <div 
                        key={trend.id}
                        onClick={() => selectTrendQuery(trend.topic)}
                        className="p-5 hover:bg-white/10 transition-all cursor-pointer group flex items-center justify-between"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#00ffd5]">#{i+1}</span>
                            <span className="text-[10px] text-slate-500 font-bold">{trend.category}</span>
                          </div>
                          <h4 className="text-sm font-extrabold text-white group-hover:text-[#00ffd5] transition-colors truncate">
                            {trend.topic}
                          </h4>
                          <span className="text-[10px] text-slate-400">{trend.postsCount}</span>
                        </div>
                        <div className="px-3.5 py-1.5 bg-white/5 group-hover:bg-[#00ffd5]/20 text-[#00ffd5] border border-white/5 group-hover:border-[#00ffd5]/30 rounded-xl transition-all text-xs font-bold shrink-0">
                          Explore
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: NEWS */}
              {activeTab === 'news' && (
                <div className="space-y-5 text-left">
                  <header>
                    <h3 className="text-base font-black text-white tracking-tight">Cosmos News Service</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Official releases and live feed reports from planetary systems</p>
                  </header>

                  <div className="space-y-4">
                    {(() => {
                      const filtered = shuffledNews.filter(article => selectedRegion === 'all' || article.region === selectedRegion);
                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-16 bg-white/5 border border-white/5 rounded-[32px] text-slate-400 text-xs italic animate-in fade-in duration-300">
                            No news articles available for the selected region. Browse other options or refresh!
                          </div>
                        );
                      }
                      return filtered.map((article) => (
                        <div 
                          key={article.id}
                          onClick={() => openNewsDetails(article)}
                          className="flex flex-col sm:flex-row gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-3xl cursor-pointer transition-all group hover:border-indigo-500/20 animate-in fade-in duration-300"
                        >
                          <div className="w-full sm:w-36 h-28 shrink-0 rounded-2xl overflow-hidden bg-slate-800 border border-white/5">
                            <img src={article.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                          <div className="flex-1 space-y-2 min-w-0 flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                                <span className="text-indigo-400 font-extrabold uppercase">{article.category}</span>
                                <span>· {article.time}</span>
                              </div>
                              <h4 className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors leading-snug line-clamp-2">
                                {article.title}
                              </h4>
                              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans">
                                {article.excerpt}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-white/5">
                              <span className="flex items-center gap-1 font-semibold"><Eye size={11} /> {article.views} views</span>
                              <span className="flex items-center gap-1"><Clock size={11} /> {article.readTime}</span>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* TAB 4: SPORTS */}
              {activeTab === 'sports' && (
                <div className="space-y-5 text-left">
                  <header className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-white tracking-tight">Gravity Games & Racing</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Orbital tournaments and velocity division updates</p>
                    </div>
                    <div className="p-2 bg-indigo-500/10 border border-indigo-400/20 text-[#00ffd5] rounded-xl">
                      <Trophy size={16} className="animate-bounce" />
                    </div>
                  </header>

                  <div className="space-y-4">
                    {(() => {
                      const filtered = shuffledSports.filter(article => selectedRegion === 'all' || article.region === selectedRegion);
                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-16 bg-white/5 border border-white/5 rounded-[32px] text-slate-400 text-xs italic animate-in fade-in duration-300">
                            No sports news available for the selected region. Browse other options or refresh!
                          </div>
                        );
                      }
                      return filtered.map((article) => (
                        <div 
                          key={article.id}
                          onClick={() => openNewsDetails(article)}
                          className="flex flex-col sm:flex-row gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-3xl cursor-pointer transition-all group hover:border-indigo-500/20 animate-in fade-in duration-300"
                        >
                          <div className="w-full sm:w-36 h-28 shrink-0 rounded-2xl overflow-hidden bg-slate-800 border border-white/5">
                            <img src={article.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                          <div className="flex-1 space-y-2 min-w-0 flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                                <span className="text-[#00ffd5] font-extrabold uppercase">{article.category}</span>
                                <span>· {article.time}</span>
                              </div>
                              <h4 className="text-sm font-black text-white group-hover:text-[#00ffd5] transition-colors leading-snug line-clamp-2">
                                {article.title}
                              </h4>
                              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans font-medium">
                                {article.excerpt}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-white/5">
                              <span className="flex items-center gap-1 font-semibold"><Eye size={11} /> {article.views} views</span>
                              <span className="flex items-center gap-1"><Clock size={11} /> {article.readTime}</span>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* TAB 5: ENTERTAINMENT */}
              {activeTab === 'entertainment' && (
                <div className="space-y-5 text-left">
                  <header className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-white tracking-tight">MiniVerse Culture & Art</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Synthwave releases, NFT galleries, and immersive events</p>
                    </div>
                    <div className="p-2 bg-indigo-500/10 border border-indigo-400/20 text-[#00ffd5] rounded-xl">
                      <Tv size={16} />
                    </div>
                  </header>

                  <div className="space-y-4">
                    {(() => {
                      const filtered = shuffledEntertainment.filter(article => selectedRegion === 'all' || article.region === selectedRegion);
                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-16 bg-white/5 border border-white/5 rounded-[32px] text-slate-400 text-xs italic animate-in fade-in duration-300">
                            No entertainment news available for the selected region. Browse other options or refresh!
                          </div>
                        );
                      }
                      return filtered.map((article) => (
                        <div 
                          key={article.id}
                          onClick={() => openNewsDetails(article)}
                          className="flex flex-col sm:flex-row gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-3xl cursor-pointer transition-all group hover:border-[#00ffd5]/20 animate-in fade-in duration-300"
                        >
                          <div className="w-full sm:w-36 h-28 shrink-0 rounded-2xl overflow-hidden bg-slate-800 border border-white/5">
                            <img src={article.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                          <div className="flex-1 space-y-2 min-w-0 flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                                <span className="text-purple-400 font-extrabold uppercase">{article.category}</span>
                                <span>· {article.time}</span>
                              </div>
                              <h4 className="text-sm font-black text-white group-hover:text-purple-300 transition-colors leading-snug line-clamp-2">
                                {article.title}
                              </h4>
                              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans font-medium">
                                {article.excerpt}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-white/5">
                              <span className="flex items-center gap-1 font-semibold"><Eye size={11} /> {article.views} views</span>
                              <span className="flex items-center gap-1"><Clock size={11} /> {article.readTime}</span>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* DYNAMIC ARTICLE DETAILED MODAL */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            
            {/* Dark Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedArticle(null)}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm cursor-pointer"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-full max-w-xl max-h-[85vh] bg-[#0f172a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col text-left z-50 text-white"
            >
              
              {/* Header Image Header */}
              <div className="relative h-48 md:h-56 shrink-0 bg-slate-900 border-b border-white/5">
                <img src={selectedArticle.image} alt="" className="w-full h-full object-cover brightness-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                
                {/* Close Button */}
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="absolute top-4 right-4 p-2 bg-slate-950/70 hover:bg-slate-900 text-white hover:scale-105 active:scale-95 border border-white/10 rounded-full transition-all cursor-pointer z-20"
                  title="Close Reader"
                >
                  <X size={16} />
                </button>
                
                {/* Category Pill Tag */}
                <div className="absolute bottom-4 left-5">
                  <span className="text-[10px] uppercase font-black bg-indigo-500 text-white px-3 py-1 rounded-full border border-indigo-400/30 tracking-widest">
                    {selectedArticle.category}
                  </span>
                </div>
              </div>

              {/* Scrollable Reader Pane */}
              <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4 scrollbar-hide">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-indigo-300">By {selectedArticle.author}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{selectedArticle.time}</span>
                    <span>·</span>
                    <span>{selectedArticle.readTime}</span>
                  </div>
                </div>

                <h3 className="text-lg md:text-xl font-black text-white leading-normal tracking-tight">
                  {selectedArticle.title}
                </h3>

                <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                  {selectedArticle.body}
                </p>

                {/* Simulated live community response actions */}
                <div className="pt-6 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 select-none">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        setArticleLiked(!articleLiked);
                        setArticleLikesCount(prev => articleLiked ? prev - 1 : prev + 1);
                      }}
                      className={`flex items-center gap-1.5 transition-colors focus:outline-none ${
                        articleLiked ? 'text-pink-500 font-bold' : 'hover:text-pink-500'
                      }`}
                    >
                      <Heart size={15} fill={articleLiked ? 'currentColor' : 'none'} />
                      <span>{articleLikesCount} loves</span>
                    </button>
                    <span className="flex items-center gap-1"><Eye size={15} /> {selectedArticle.views} views</span>
                  </div>

                  <div className="flex gap-2">
                    <ShareButton 
                      postId={selectedArticle.id}
                      postText={selectedArticle.excerpt || selectedArticle.title}
                      userId="cosmonews"
                      displayName={selectedArticle.category ? selectedArticle.category.split(' • ')[0] : 'Cosmic News'}
                      photoURL={selectedArticle.image}
                      isArticle={true}
                    />
                  </div>
                </div>

                {/* Live simulation interaction prompt */}
                <div className="bg-[#1e293b]/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-2">
                  <span className="text-[10px] uppercase text-[#00ffd5] font-black tracking-widest block">Cosmos News Desk Feedback</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    You are viewing a simulated news chronicle curated in the MiniVerse. Discuss or share thoughts directly on your personal profile timeline!
                  </p>
                  <button 
                    onClick={() => {
                      setSelectedArticle(null);
                      alert('Redirecting: Compose a post detailing your thoughts on your home timeline.');
                    }}
                    className="text-[10px] font-bold text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-500 px-3 py-1.5 rounded-lg border border-indigo-500/20 mt-1 self-start transition-all"
                  >
                    Discuss in timeline
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
