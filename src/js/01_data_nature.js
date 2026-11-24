// ============================================================================
//  ELEMENTAL LAB — 01 · Core item data: elements, earth, water, weather, space
//  Format per line:  Name | emoji | tags & tokens | canonical recipes (A+B;C+D)
//  Tokens: @shape  #colour  %material  !rarity  ^secretEffect  =Adjective
// ============================================================================

const CORE_DATA = [];

CORE_DATA.push(`
// ---------------- the four elements ----------------
Air|💨|air,gas,sky,soft,@orb,#d6ecff,%gas|
Fire|🔥|fire,hot,energy,light,@flame,#ff6a1a,%fire|
Earth|🌍|earth,hard,dry,@rock,#8a6a45,%soil|
Water|💧|water,wet,liquid,@liquid,#2f8cff,%liquid|

// ---------------- first reactions ----------------
Wind|🌬️|air,gas,fast,weather,@gas,#e3f2ff|Air+Air
Smoke|🌫️|gas,dry,hot,dark,@gas,#8f8f95|Air+Fire;Fire+Wood
Dust|🟫|earth,dry,tiny,air,@gas,#c2a679|Air+Earth
Mist|🌁|water,wet,gas,air,@gas,#dfeaf2|Air+Water
Energy|⚡|energy,hot,light,electric,@abstract,#ffe14d|Fire+Fire;Fire+Wind
Lava|🌋|fire,hot,liquid,earth,@liquid,#ff4d00,%fire|Earth+Fire
Steam|♨️|gas,hot,wet,water,@gas,#e8eef2|Water+Fire;Fire+Ice;Cloud+Sun
Mud|🟤|earth,wet,soft,sticky,@blob,#6b4a2b,%soil|Dust+Water;Soil+Water
Pressure|🗜️|earth,abstract,hard,@abstract,#9aa0aa|Earth+Earth;Air+Stone
Puddle|💦|water,wet,liquid,tiny,@liquid,#4a9cff|Water+Water;Rain+Stone
Heat|🌡️|hot,energy,abstract,@abstract,#ff8a3d|Fire+Energy;Sun+Air
Light|✨|light,energy,@abstract,#fff6c0|Energy+Air;Sun+Glass;Fire+Glass
Cold|🥶|cold,air,weather,abstract,@abstract,#bfe6ff|Wind+Mist;Wind+Wind

// ---------------- rocks & earth ----------------
Stone|🪨|stone,hard,earth,@rock,#8d8d8d|Lava+Water;Lava+Air;Lava+Wind
Sand|🏖️|earth,dry,tiny,stone,@blob,#e6c98a,%soil|Stone+Wind;Stone+Water;Dust+Stone
Pebble|🪨|stone,tiny,hard,@rock,#a3a3a3|Stone+Wave;Stone+River
Boulder|🪨|stone,huge,hard,@rock,#7d7d7d|Stone+Stone;Stone+Mountain
Gravel|🪨|stone,tiny,dry,@rock,#9c9a94|Pebble+Pebble;Stone+Hammer
Clay|🏺|earth,soft,wet,@blob,#c46d3e,%soil|Mud+Sand;Mud+Stone
Brick|🧱|stone,hard,building,@cube,#b5502f|Clay+Fire;Mud+Fire;Clay+Sun
Hill|🌄|earth,huge,@landform,#7bbf5a|Earth+Pressure;Earth+Mud
Mountain|⛰️|stone,earth,huge,hard,@landform,#8f8f9a|Hill+Stone;Hill+Hill;Stone+Pressure
Volcano|🌋|fire,hot,earth,huge,explosive,@landform,#6e4b3a|Lava+Mountain;Fire+Mountain;Lava+Hill
Magma|🌋|fire,hot,liquid,underground,earth,@liquid,#ff3a00,%fire|Lava+Earth;Lava+Pressure
Obsidian|🖤|stone,hard,dark,glass,sharp,@crystal,#1a1420|Lava+Cold;Lava+Ice
Ore|⛏️|stone,metal,hard,underground,@rock,#7a6d63|Stone+Earth;Stone+Cave
Coal|⚫|stone,dark,fire,dry,@rock,#2a2a2a|Wood+Fire;Tree+Pressure;Stone+Fire
Charcoal|⚫|dark,dry,wood,fire,@rock,#262626|Wood+Smoke;Coal+Wood
Ash|🩶|dry,dark,tiny,death,@gas,#9a9a9a|Fire+Paper;Smoke+Stone;Fire+Leaf
Soot|🌑|dark,dry,tiny,@gas,#3a3a3a|Smoke+Brick;Smoke+Chimney
Diamond|💎|crystal,hard,money,light,@crystal,#bff4ff,%crystal|Coal+Pressure;Coal+Time
Crystal|🔮|crystal,magic,hard,light,@crystal,#c49bff,%crystal|Stone+Magic;Quartz+Magic;Glass+Stone
Quartz|🤍|crystal,stone,hard,@crystal,#f2e8ff,%crystal|Sand+Pressure;Stone+Glass
Amethyst|💜|crystal,magic,@crystal,#9b59d0,%crystal|Quartz+Wine;Crystal+Grape
Gem|💠|crystal,money,hard,@crystal,#38d6b5,%crystal|Crystal+Pressure;Diamond+Stone
Ruby|♦️|crystal,money,hot,@crystal,#e0115f,%crystal|Gem+Fire;Crystal+Blood
Emerald|💚|crystal,money,@crystal,#2ecc71,%crystal|Gem+Plant;Crystal+Forest
Sapphire|💙|crystal,money,cold,@crystal,#2457c5,%crystal|Gem+Water;Crystal+Ocean
Fossil|🦴|stone,ancient,death,@bone,#d8c8a8|Bone+Stone;Dinosaur+Time;Shell+Time
Marble|🏛️|stone,hard,building,@cube,#f0f0f0|Stone+Art;Stone+Sculptor
Granite|🪨|stone,hard,@rock,#a08f88|Stone+Magma;Stone+Lava
Salt|🧂|tiny,dry,edible,crystal,@cube,#fafafa|Sea+Sun;Ocean+Sun;Ocean+Fire
Sulfur|🟡|stone,poison,hot,@rock,#e8d82c|Volcano+Smoke;Lava+Egg
Cement|🩶|stone,hard,building,@blob,#b0b0b0|Sand+Stone;Stone+Water;Dust+Lime
Concrete|🧱|stone,hard,building,@cube,#a9a9a9|Cement+Water;Cement+Gravel
Lime|🍋|plant,edible,@fruit,#9be34a|Lemon+Plant;Lemon+Grass
Cave|🕳️|stone,underground,dark,@landform,#5a5560|Hill+Air;Mountain+Darkness;Mountain+Tunnel
Tunnel|🚇|underground,dark,building,@landform,#555|Mountain+Shovel;Cave+Worm;Earth+Drill
Canyon|🏜️|stone,earth,huge,@landform,#c46a3a|River+Desert;Mountain+Earthquake
Earthquake|🫨|earth,energy,huge,explosive,@abstract,#8a6a45|Earth+Energy;Mountain+Energy;Pressure+Energy
Desert|🏜️|earth,dry,hot,huge,@landform,#e9c27a|Sand+Sand;Sand+Sun;Sand+Heat
Dune|🏜️|earth,dry,huge,@landform,#e8c071|Sand+Wind;Desert+Wind
Oasis|🏝️|water,plant,earth,@landform,#56c27a|Desert+Water;Desert+Pond;Desert+Tree
Island|🏝️|earth,sea,@landform,#e4cf8a|Sea+Earth;Ocean+Volcano;Ocean+Land
Land|🗺️|earth,huge,@landform,#8fbf5a|Earth+Hill;Earth+Field
Beach|🏖️|earth,sea,dry,@landform,#f1d9a0|Sand+Sea;Sand+Ocean;Sand+Wave
Cliff|🧗|stone,huge,@landform,#9a9aa0|Mountain+Sea;Mountain+Wave
Valley|🏞️|earth,huge,plant,@landform,#6fb15b|Mountain+River;Hill+River
Plateau|🏔️|earth,huge,@landform,#b89b7a|Mountain+Wind;Mountain+Field
Swamp|🐊|water,earth,wet,plant,@landform,#4f6b3a|Mud+Plant;Mud+Pond
Marsh|🌾|water,wet,plant,@landform,#6e8b4a|Swamp+Grass;Mud+Grass
Quicksand|⏳|earth,wet,sticky,@blob,#cfae6a,%soil|Sand+Swamp;Sand+Mud
Geyser|⛲|water,hot,gas,earth,@landform,#cde4ef|Steam+Earth;Steam+Stone
Hot Spring|♨️|water,hot,wet,liquid,@liquid,#7ec8d8|Pond+Fire;Puddle+Lava;Pond+Lava
Glacier|🏔️|ice,cold,huge,water,@landform,#cdeeff|Ice+Mountain;Ice+Time;Ice+Ice
Iceberg|🧊|ice,cold,huge,sea,@crystal,#d4f1ff,%ice|Ice+Ocean;Glacier+Sea;Ice+Sea
Tundra|🏔️|cold,earth,ice,huge,@landform,#dfe9ea|Snow+Land;Snow+Field;Cold+Land
Arctic|🧊|cold,ice,huge,@landform,#e6f6ff|Snow+Ocean;Ice+Land
Antarctica|🐧|cold,ice,huge,@landform,#f0faff|Arctic+Penguin;Ice+Continent
Continent|🗺️|earth,huge,@landform,#7fb35a|Land+Land;Island+Island
Planet Earth|🌏|earth,cosmic,huge,living,@planet,#3b7fd9|Continent+Ocean;Planet+Life
Soil|🟫|earth,soft,plant,@blob,#5c3d23,%soil|Earth+Worm;Dust+Rain;Mud+Leaf
Fertilizer|💩|earth,plant,@blob,#6a4b2a,%soil|Soil+Bacteria;Soil+Poop;Plant+Poop
Poop|💩|earth,soft,@blob,#7a4a1f,%soil|Animal+Food;Food+Time
Rust|🟠|metal,dry,ancient,@blob,#b7410e|Metal+Water;Iron+Water;Metal+Rain
Corrosion|🧪|metal,poison,@blob,#8a6a2a|Rust+Acid;Metal+Acid

// ---------------- water ----------------
Pond|🪷|water,wet,liquid,@landform,#4fa3e0|Puddle+Water;Puddle+Puddle
Lake|🏞️|water,wet,liquid,huge,@landform,#3c8ed8|Pond+Water;Pond+Pond
Sea|🌊|water,wet,liquid,sea,huge,@liquid,#1f6fbf|Lake+Water;Lake+Lake
Ocean|🌊|water,wet,sea,huge,liquid,@liquid,#155a9c|Sea+Water;Sea+Sea
Wave|🌊|water,wet,fast,sea,@liquid,#3a8fe0|Sea+Wind;Ocean+Wind;Water+Wind
Tsunami|🌊|water,sea,huge,fast,explosive,@liquid,#1a5ca8|Wave+Earthquake;Ocean+Earthquake;Wave+Wave
River|🏞️|water,liquid,fast,@liquid,#3b94e6|Water+Mountain;Rain+Hill
Stream|💧|water,liquid,tiny,@liquid,#5aaaf0|River+Pebble;Water+Hill
Waterfall|🏞️|water,fast,huge,@landform,#4ea6ee|River+Mountain;River+Cliff
Delta|🏞️|water,earth,@landform,#5ca37a|River+Sea;River+Ocean
Coral|🪸|sea,living,animal,hard,@plant,#ff7f7f|Sea+Stone;Ocean+Stone;Sea+Life
Coral Reef|🪸|sea,living,huge,@landform,#ff8f8f|Coral+Coral;Coral+Ocean;Coral+Island
Tide|🌊|water,sea,time,@liquid,#2c78c9|Ocean+Moon;Sea+Moon
Whirlpool|🌀|water,sea,fast,@liquid,#2267b0|Ocean+Tornado;Wave+Wind
Bubble|🫧|air,water,soft,tiny,@orb,#d9f3ff,%glass|Air+Soap;Water+Air
Foam|🫧|water,soft,air,@cloud,#f3fbff|Wave+Air;Bubble+Bubble;Soap+Water
Salt Water|🧂|water,liquid,sea,@liquid,#3e88c9|Salt+Water;Sea+Puddle
Ice|🧊|ice,cold,hard,water,@crystal,#bfeaff,%ice|Water+Cold;Puddle+Cold
Snow|❄️|ice,cold,soft,weather,@blob,#f6fbff,%ice|Rain+Cold;Cloud+Cold
Frost|🌨️|ice,cold,tiny,crystal,@crystal,#d8f3ff,%ice|Ice+Mist;Cold+Glass
Snowflake|❄️|ice,cold,tiny,crystal,@star5,#e9f7ff,%ice|Snow+Crystal;Snow+Microscope
Snowball|⚪|ice,cold,sport,@orb,#f4faff,%ice|Snow+Human;Snow+Hand
Snowman|⛄|ice,cold,human,@humanoid,#fbfdff,%ice|Snowball+Snowball;Snow+Human;Snowball+Carrot
Igloo|🛖|ice,cold,building,@building,#eaf6ff,%ice|Ice+House;Snow+House;Ice+Brick
Icicle|🧊|ice,cold,sharp,@spike,#cdeeff,%ice|Ice+Spike;Ice+Roof
Hail|🌨️|ice,cold,hard,weather,tiny,@rock,#dff3ff,%ice|Rain+Ice;Storm+Ice
Blizzard|🌨️|ice,cold,weather,fast,@cloud,#e8f4ff|Snow+Wind;Snow+Storm
Avalanche|🏔️|ice,cold,huge,fast,@landform,#f2f9ff|Snow+Mountain;Snow+Earthquake
Glass|🥛|glass,hard,sharp,@cube,#d8f4ff,%glass|Sand+Fire;Sand+Heat;Sand+Lightning
Mirror|🪞|glass,light,metal,@disc,#e8f6ff,%glass|Glass+Metal;Glass+Silver
Lens|🔍|glass,light,tiny,@disc,#cfeeff,%glass|Glass+Water;Glass+Eye
Prism|🔺|glass,light,crystal,@crystal,#f3f0ff,%glass|Glass+Rainbow;Glass+Light
Rainbow|🌈|light,sky,weather,magic,@ring,#ff7ad9|Rain+Sun;Light+Rain;Light+Prism

// ---------------- weather & sky ----------------
Cloud|☁️|water,air,sky,soft,weather,@cloud,#ffffff|Steam+Air;Mist+Air;Mist+Wind
Sky|🌤️|sky,air,light,@gas,#8fd0ff|Air+Cloud;Cloud+Wind
Atmosphere|🌐|air,gas,sky,huge,@gas,#bfe3ff|Sky+Air;Air+Pressure
Rain|🌧️|water,wet,weather,sky,@cloud,#7fb2e0|Cloud+Water;Mist+Cloud
Drizzle|🌦️|water,wet,weather,tiny,@cloud,#a8cbe8|Rain+Mist;Rain+Air
Storm|⛈️|weather,electric,wet,sky,air,@cloud,#5b6577|Cloud+Cloud;Rain+Wind
Thunderstorm|⛈️|weather,electric,energy,sky,@cloud,#4a5263|Storm+Lightning;Storm+Storm
Thunder|🔊|sound,weather,energy,sky,@bolt,#c8c8ff|Lightning+Air;Lightning+Sound
Lightning|🌩️|electric,energy,sky,hot,fast,weather,@bolt,#fff36b,%energy|Storm+Energy;Cloud+Energy
Tornado|🌪️|air,weather,fast,huge,@gas,#9aa3ad|Wind+Storm;Wind+Wind+Storm;Storm+Air
Hurricane|🌀|air,water,weather,huge,fast,@cloud,#7c8a99|Storm+Ocean;Tornado+Ocean;Tornado+Sea
Fog|🌁|water,gas,weather,@gas,#e6e9ec|Mist+Mist;Cloud+Earth;Mist+Land
Dew|💧|water,tiny,wet,@liquid,#9fd6ff|Mist+Grass;Water+Grass;Mist+Morning
Smog|🌫️|gas,poison,dark,@gas,#8e8a6f|Smoke+Fog;Smoke+City;Fog+Pollution
Sandstorm|🌪️|earth,air,weather,dry,@gas,#d9b26a|Sand+Storm;Desert+Wind+Storm;Desert+Storm;Sand+Tornado
Heatwave|🥵|hot,weather,@abstract,#ff9a3d|Heat+Wind;Sun+Wind;Heat+Summer
Weather|🌦️|weather,sky,abstract,@cloud,#a6c8e8|Cloud+Wind+Rain;Rain+Wind+Sun;Sky+Rain
Sun|☀️|cosmic,hot,light,fire,sky,huge,@celestial,#ffd23f,=Solar|Fire+Sky;Energy+Sky;Light+Sky
Sunbeam|🌞|light,hot,sky,@bolt,#fff2a6|Sun+Glass;Sun+Cloud;Sun+Light
Sunset|🌅|sky,light,time,@landform,#ff8a5c|Sun+Ocean;Sun+Evening;Sun+Horizon
Sunrise|🌄|sky,light,time,@landform,#ffb26b|Sun+Morning;Sun+Hill
Horizon|🌅|sky,earth,abstract,@abstract,#9ac6f2|Sky+Ocean;Sky+Land;Sky+Earth
Day|🌞|time,light,abstract,@abstract,#ffe58a|Sun+Time;Sun+Morning
Night|🌙|time,dark,sky,@abstract,#1d2347|Moon+Sky;Day+Time;Moon+Darkness
Morning|🌅|time,light,@abstract,#ffd9a8|Day+Sunrise;Night+Sun;Night+Time
Evening|🌆|time,dark,@abstract,#ff9e7a|Day+Night;Day+Sunset
Moon|🌙|cosmic,stone,sky,dark,@moon,#d5d5d0,=Lunar|Stone+Sky;Stone+Night
Moonlight|🌕|light,sky,magic,@abstract,#e8ecff|Moon+Light;Moon+Lake;Moon+Glass
Darkness|🌑|dark,abstract,evil,@abstract,#16131f|Night+Smoke;Night+Cave;Light+Void
Shadow|👤|dark,abstract,@abstract,#2b2b3a|Light+Tree;Sun+Human;Light+Darkness;Light+Human
Eclipse|🌘|cosmic,dark,sky,@moon,#2a2a3a|Sun+Moon;Moon+Shadow
Aurora|🌌|light,sky,cold,magic,@gas,#5dffb3|Sky+Electricity;Arctic+Light;Sky+Magnetism

// ---------------- space ----------------
Space|🌌|cosmic,dark,huge,@abstract,#241a4a|Sky+Darkness;Atmosphere+Darkness;Night+Atmosphere
Star|⭐|cosmic,light,hot,@star5,#ffe95c|Space+Sun;Space+Light;Night+Light
Shooting Star|🌠|cosmic,light,fast,sky,@star5,#fff1a0|Star+Sky;Star+Wind;Meteor+Night
Galaxy|🌌|cosmic,huge,light,@galaxy,#7a5cff|Star+Star;Star+Space
Milky Way|🌌|cosmic,huge,sweet,@galaxy,#e8ddff|Galaxy+Milk;Galaxy+Earth
Universe|🌌|cosmic,huge,abstract,@galaxy,#3b2a7a|Galaxy+Galaxy;Galaxy+Space
Multiverse|🌀|cosmic,huge,abstract,magic,@galaxy,#b05cff|Universe+Universe;Universe+Portal;Universe+Mirror
Planet|🪐|cosmic,huge,@planet,#6c8ed8|Earth+Space;Stone+Space;Earth+Sun
Moon Rock|🪨|cosmic,stone,@rock,#bdbdb6|Moon+Stone;Moon+Pebble
Comet|☄️|cosmic,ice,fast,@celestial,#c9f0ff|Ice+Space;Snow+Space
Meteor|☄️|cosmic,stone,hot,fast,@rock,#8a6150|Stone+Fire+Space;Comet+Sky;Fire+Space
Asteroid|🪨|cosmic,stone,huge,@rock,#6b6560|Meteor+Space;Stone+Galaxy
Black Hole|🕳️|cosmic,dark,huge,death,@blackhole,#090612|Star+Gravity;Gravity+Space
Gravity|🍎|abstract,huge,cosmic,@abstract,#7d6cff|Planet+Earth;Planet+Pressure;Apple+Scientist
Nebula|🌫️|cosmic,gas,light,@gas,#c06bff|Space+Cloud;Space+Dust
Supernova|💥|cosmic,explosive,light,hot,huge,@celestial,#ffd5ff|Star+Explosion;Star+Bomb
Neutron Star|⚪|cosmic,huge,hard,@celestial,#e8f0ff|Supernova+Pressure;Star+Pressure
Pulsar|💫|cosmic,energy,light,@celestial,#a0e8ff|Neutron Star+Energy;Neutron Star+Lighthouse
Quasar|✴️|cosmic,energy,light,huge,@celestial,#ffe0ff|Black Hole+Light;Black Hole+Energy
Wormhole|🌀|cosmic,time,magic,@ring,#8a5cff|Black Hole+Time;Black Hole+Portal
Solar System|🪐|cosmic,huge,@planet,#ffcf4a|Sun+Planet;Planet+Planet
Mars|🔴|cosmic,dry,@planet,#d6542c|Planet+Desert;Planet+Rust
Saturn|🪐|cosmic,huge,@planet,#e8c87a|Planet+Ring;Planet+Halo
Jupiter|🟠|cosmic,huge,gas,@planet,#d9a066|Planet+Storm;Planet+Gas Cloud
Venus|🟡|cosmic,hot,@planet,#f2c46a|Planet+Love;Planet+Heat
Gas Cloud|☁️|gas,cosmic,@gas,#b7a8d9|Nebula+Gas;Space+Smoke;Nebula+Air
Gas|🫧|gas,air,@gas,#cdd6c4|Air+Pressure+Smoke;Swamp+Air;Smoke+Air;Air+Bacteria
Stardust|✨|cosmic,tiny,magic,light,@gas,#fff1c4|Star+Dust;Star+Sand
Constellation|✨|cosmic,knowledge,light,@star5,#e9e3ff|Star+Line;Star+Map;Star+Pattern
Orbit|🛰️|cosmic,abstract,@ring,#a8b8ff|Planet+Gravity;Moon+Gravity
Void|⬛|cosmic,dark,abstract,death,@abstract,#050308|Darkness+Space;Darkness+Darkness
Nothing|⬜|abstract,@abstract,#f8f8f8|Void+Void;Void+Time
Big Bang|💥|cosmic,explosive,huge,energy,@celestial,#ffffff,!mythic,^bigbang|Universe+Nothing;Nothing+Energy;Nothing+Explosion
Alien|👽|cosmic,living,human,@humanoid,#7ee06a|Life+Space;Life+Mars
UFO|🛸|cosmic,vehicle,flying,machine,metal,@plane,#b0c4cc|Alien+Airplane;Alien+Rocket
Astronaut|🧑‍🚀|human,cosmic,@humanoid,#f4f4f4|Human+Space;Human+Rocket;Human+Moon
Satellite|🛰️|cosmic,machine,metal,electric,@machine,#c8ccd4|Metal+Space;Robot+Space
Space Station|🛰️|cosmic,building,machine,metal,huge,@building,#d8dde4|Satellite+Human;Satellite+House;House+Space
Rocket|🚀|vehicle,fast,cosmic,flying,metal,@rocket,#f04a3a|Airplane+Space;Engine+Space
Telescope|🔭|tool,glass,cosmic,knowledge,@tool,#5d6b8a|Lens+Star;Lens+Sky;Glass+Star
Microscope|🔬|tool,glass,tiny,knowledge,@tool,#6e7f9a|Lens+Bacteria;Glass+Bacteria
Moon Base|🏗️|cosmic,building,@building,#dcdcdc|Moon+House;Moon+Space Station
Cosmic Egg|🥚|cosmic,living,magic,@egg,#b89cff,!legendary|Egg+Universe;Egg+Galaxy
Starfish|⭐|animal,sea,@star5,#ff8a5c,%organic|Star+Ocean;Star+Sea;Star+Fish
Zodiac|♈|cosmic,magic,knowledge,abstract,@abstract,#d0b8ff|Constellation+Time;Star+Calendar
Gamma Ray|☢️|cosmic,energy,poison,light,@bolt,#7dff5c|Supernova+Energy;Radiation+Light
Dark Matter|🌑|cosmic,dark,abstract,huge,@abstract,#1a0f2e|Gravity+Void;Galaxy+Darkness
Antimatter|⚛️|cosmic,energy,explosive,@orb,#ff5cd6|Atom+Mirror;Matter+Void
Matter|⚛️|abstract,cosmic,@orb,#b8c4d8|Atom+Atom;Earth+Atom;Universe+Atom
`);
