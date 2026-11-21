// ============================================================================
//  ELEMENTAL LAB — 03 · Core item data: people, materials, tools, weapons,
//  buildings, places, vehicles, household & clothing
// ============================================================================

CORE_DATA.push(`
// ---------------- people & professions ----------------
Human|🧍|human,@humanoid,#e8b090|Life+Clay;Monkey+Time;Clay+Life+Magic;Life+Mud+Magic;Monkey+Tool
Man|👨|human,@humanoid,#5a7ad8|Human+Beard;Human+Strength
Woman|👩|human,@humanoid,#e85a8a|Human+Flower;Human+Rose
Baby|👶|human,tiny,soft,@humanoid,#ffd8c0|Man+Woman;Human+Stork;Human+Egg;Family+Love
Child|🧒|human,tiny,@humanoid,#ffc08a|Baby+Time;Baby+School;Baby+Toy
Family|👪|human,emotion,@humanoid,#ff9a6a|Human+Love;Man+Woman+Baby;Human+House;Child+Love
Old Man|👴|human,ancient,@humanoid,#a8a8b0|Man+Time;Human+Time+Time;Man+Beard
Grandma|👵|human,ancient,@humanoid,#c8a8d8|Woman+Time;Old Man+Love
Crowd|👥|human,huge,@humanoid,#7a8aa8|Human+Human;Family+Family
Tribe|🛖|human,ancient,@humanoid,#a8703a|Crowd+Village;Family+Fire;Crowd+Hut
Village|🏘️|building,human,@building,#c89a6a|House+House;Hut+Hut;Tribe+House
Town|🏘️|building,human,@building,#b8a08a|Village+Village;Village+Road
City|🏙️|building,human,huge,@building,#9aa8b8|Town+Town;Town+Skyscraper;Village+Time+Road
Metropolis|🌆|building,human,huge,electric,@building,#7a8aa8|City+City;City+Skyscraper
Country|🗺️|human,huge,@landform,#6ab05a|City+Land;City+Flag;Land+Crowd
Civilization|🏛️|human,knowledge,huge,@building,#c8b89a|Country+Time;City+Knowledge;Tribe+Time+Knowledge
Society|🫂|human,abstract,@abstract,#8aa0c0|Civilization+Human;Crowd+Rules;Crowd+Law
Farmer|🧑‍🌾|human,plant,@humanoid,#6aa04a|Human+Field;Human+Plant;Human+Wheat
Farm|🚜|building,plant,animal,@building,#c84a3a|Farmer+Field;Field+Barn;House+Field
Barn|🏚️|building,wood,@building,#b0302a|House+Hay;Farm+House;Hay+Wood
Hunter|🏹|human,weapon,@humanoid,#5a6a3a|Human+Bow;Human+Spear;Human+Forest+Weapon
Lumberjack|🪓|human,wood,@humanoid,#c03a2a|Human+Axe;Human+Tree;Human+Forest
Carpenter|🧑‍🔧|human,wood,tool,@humanoid,#a8703a|Human+Wood;Human+Hammer+Wood;Lumberjack+House
Blacksmith|⚒️|human,metal,hot,@humanoid,#5a4a4a|Human+Metal;Human+Anvil;Human+Forge
Miner|⛏️|human,underground,@humanoid,#e8c040|Human+Pickaxe;Human+Mine;Human+Cave
Builder|👷|human,building,@humanoid,#f0a020|Human+Brick;Human+House+Tool;Human+Concrete
Engineer|👷|human,machine,knowledge,@humanoid,#3a7ad8|Builder+Knowledge;Human+Bridge;Scientist+Machine
Chef|🧑‍🍳|human,edible,@humanoid,#fbfbfb|Human+Food;Human+Kitchen
Baker|🧑‍🍳|human,edible,@humanoid,#f6e8d0|Human+Bread;Chef+Cake
Butcher|🔪|human,edible,@humanoid,#c84a4a|Human+Meat;Chef+Meat
Fisherman|🎣|human,sea,@humanoid,#3a7aa8|Human+Fish;Human+Fishing Rod;Human+Boat+Fish
Sailor|⚓|human,sea,@humanoid,#2a4a8a|Human+Boat;Human+Ship;Human+Sea
Pirate|🏴‍☠️|human,sea,evil,@humanoid,#2a2a2a|Sailor+Treasure;Sailor+Sword;Sailor+Thief;Human+Pirate Ship
Captain|👨‍✈️|human,sea,@humanoid,#1f3a6a|Sailor+Ship+Leader;Sailor+Hat;Pilot+Ship
Pilot|👨‍✈️|human,flying,@humanoid,#2a3a5a|Human+Airplane;Human+Sky+Machine;Bird+Human
Doctor|🧑‍⚕️|human,medicine,@humanoid,#f4f8ff|Human+Medicine;Human+Hospital;Human+Health
Nurse|🧑‍⚕️|human,medicine,@humanoid,#8ad0e8|Doctor+Woman;Doctor+Love;Human+Bandage
Scientist|🧑‍🔬|human,knowledge,@humanoid,#f8f8ff|Human+Science;Human+Laboratory;Human+Microscope
Professor|🧑‍🏫|human,knowledge,ancient,@humanoid,#6a5a8a|Scientist+School;Teacher+Knowledge;Scientist+Book
Teacher|🧑‍🏫|human,knowledge,@humanoid,#d87a3a|Human+School;Human+Book;Human+Knowledge+Child
Student|🧑‍🎓|human,knowledge,@humanoid,#3a5ad8|Child+School;Human+Book+School;Child+Book
Genius|🧠|human,knowledge,@humanoid,#ff7ad8,!rare|Scientist+Brain;Human+Brain+Brain;Professor+Idea
Artist|🧑‍🎨|human,emotion,@humanoid,#ff5a9a|Human+Paint;Human+Art;Human+Paintbrush
Sculptor|🗿|human,stone,@humanoid,#a8a8a8|Artist+Stone;Human+Chisel;Human+Statue
Musician|🧑‍🎤|human,music,@humanoid,#9a5ad8|Human+Music;Human+Guitar;Human+Piano
Singer|🎤|human,music,@humanoid,#ff5ab0|Human+Song;Human+Microphone;Musician+Voice
Dancer|💃|human,music,fast,@humanoid,#ff3a6a|Human+Dance;Human+Music+Fast;Human+Ballet
Athlete|🏃|human,sport,fast,@humanoid,#3ad08a|Human+Sport;Human+Exercise;Human+Marathon
Soldier|💂|human,weapon,@humanoid,#4a5a3a|Human+Gun;Human+War;Human+Army
Army|🪖|human,weapon,huge,@humanoid,#4a5a3a|Soldier+Soldier;Soldier+Crowd;Knight+Knight
Knight|🛡️|human,metal,weapon,@humanoid,#b8c0c8|Human+Armor;Human+Sword+Horse;Soldier+Horse;Human+Shield+Sword
Samurai|⚔️|human,weapon,ancient,@humanoid,#a82a2a|Knight+Japan;Human+Katana;Warrior+Japan
Ninja|🥷|human,dark,fast,weapon,@humanoid,#1a1a24|Human+Shadow;Samurai+Shadow;Human+Shuriken;Assassin+Japan
Viking|🪓|human,cold,weapon,@humanoid,#a8703a|Human+Boat+Axe;Warrior+Boat;Warrior+Snow
Warrior|⚔️|human,weapon,@humanoid,#8a3a2a|Human+Sword;Human+Weapon;Human+War+Sword
Gladiator|🛡️|human,weapon,sport,@humanoid,#c89a3a|Warrior+Colosseum;Warrior+Arena;Knight+Rome
Cowboy|🤠|human,@humanoid,#a8703a|Human+Horse;Human+Hat+Horse;Farmer+Horse
Caveman|🪨|human,ancient,@humanoid,#a8703a|Human+Cave;Human+Club;Human+Stone+Time
Explorer|🧭|human,@humanoid,#c8a060|Human+Map;Human+Compass;Human+Jungle+Map
Archaeologist|🏺|human,ancient,knowledge,@humanoid,#c8a060|Explorer+Fossil;Scientist+Ruins;Human+Fossil;Explorer+Ruins
Detective|🕵️|human,knowledge,@humanoid,#8a6a4a|Human+Magnifying Glass;Police+Mystery;Human+Mystery
Police|👮|human,@humanoid,#2a4aa8|Human+Law;Human+Thief;Soldier+City
Thief|🦹|human,evil,dark,@humanoid,#3a3a4a|Human+Mask+Money;Human+Night+Money;Human+Mask
Assassin|🗡️|human,dark,weapon,evil,@humanoid,#2a1a2a|Thief+Knife;Thief+Dagger;Ninja+Gold
Judge|⚖️|human,knowledge,@humanoid,#1a1a2a|Human+Law;Human+Justice;Lawyer+Time
Lawyer|💼|human,knowledge,@humanoid,#3a3a5a|Human+Law+Money;Human+Book+Law;Judge+Money
Banker|🏦|human,money,@humanoid,#3a6a3a|Human+Bank;Human+Money+Money;Human+Gold
Merchant|💰|human,money,@humanoid,#c89a3a|Human+Money;Human+Shop;Human+Market
King|🤴|human,money,@humanoid,#ffd23a|Human+Crown;Man+Crown;Human+Castle;Prince+Time
Queen|👸|human,money,@humanoid,#ff7ad8|Woman+Crown;King+Love;Princess+Time;Woman+Tiara
Prince|🤴|human,@humanoid,#5a8aff|King+Baby;King+Child;Man+Castle
Princess|👸|human,@humanoid,#ffa8d8|Queen+Baby;Queen+Child;Woman+Castle;Prince+Love
Pharaoh|🗿|human,ancient,money,@humanoid,#e8c040|King+Pyramid;King+Egypt;King+Desert
Emperor|👑|human,money,huge,@humanoid,#a83ad8|King+Empire;King+King;King+Country
Priest|🧑‍🦳|human,holy,@humanoid,#f4f0e8|Human+Church;Human+Holy Water;Human+Bible
Monk|🧘|human,holy,@humanoid,#e8902a|Human+Temple;Priest+Mountain;Human+Zen
Clown|🤡|human,emotion,@humanoid,#ff3a3a|Human+Circus;Human+Joke;Human+Laughter
Magician|🎩|human,magic,@humanoid,#3a2a5a|Human+Top Hat;Clown+Magic;Human+Rabbit+Hat
Superhero|🦸|human,flying,holy,@humanoid,#2a5aff|Human+Cape;Hero+Cape;Human+Super Power
Hero|🦸|human,holy,@humanoid,#3a6aff|Human+Courage;Knight+Dragon;Human+Sword+Dragon
Villain|🦹|human,evil,@humanoid,#5a2a5a|Human+Evil;Superhero+Evil;Thief+Power;Hero+Darkness
Hacker|🧑‍💻|human,digital,dark,@humanoid,#1aff6a|Human+Computer;Programmer+Thief;Human+Code;Thief+Internet
Programmer|🧑‍💻|human,digital,knowledge,@humanoid,#3a8aff|Human+Code;Engineer+Computer;Scientist+Computer
Gamer|🎮|human,digital,sport,@humanoid,#a83aff|Human+Video Game;Human+Game Console;Child+Video Game
Firefighter|🧑‍🚒|human,fire,@humanoid,#e83a2a|Human+Fire Truck;Human+Fire+Water;Hero+Fire
Gardener|🧑‍🌾|human,plant,@humanoid,#5ab04a|Human+Garden;Farmer+Flower;Human+Flower+Shovel
Leader|🧑‍💼|human,@humanoid,#3a4a8a|Human+Crowd;Human+Power;Captain+Crowd

// ---------------- metals & materials ----------------
Metal|🔩|metal,hard,@cube,#b8bec8,%metal|Ore+Fire;Ore+Heat;Stone+Fire+Ore;Ore+Lava
Iron|⛓️|metal,hard,@cube,#8a9098,%metal|Metal+Stone;Ore+Coal;Metal+Earth
Steel|🔩|metal,hard,@cube,#c0c8d0,%metal|Iron+Coal;Iron+Fire;Iron+Carbon
Carbon|⚫|tiny,stone,@rock,#1f1f1f|Coal+Science;Coal+Atom;Charcoal+Science
Copper|🟠|metal,electric,@cube,#d87a3a,%metal|Metal+Ore+Fire;Ore+Electricity;Metal+Orange
Bronze|🥉|metal,ancient,@cube,#c08a4a,%metal|Copper+Tin;Copper+Metal;Copper+Time
Tin|🥫|metal,@cube,#cfd4d8,%metal|Metal+Can;Metal+Tiny+Ore;Ore+Sand
Silver|🥈|metal,money,light,@cube,#e0e4ea,%metal|Metal+Moon;Metal+Moonlight;Metal+Light
Gold|🥇|metal,money,light,@cube,#ffcc33,%metal|Metal+Sun;Silver+Sun;Metal+Treasure;Metal+Yellow
Gold Bar|🪙|metal,money,@cube,#ffc61a,%metal|Gold+Brick;Gold+Bank;Gold+Gold
Platinum|💿|metal,money,@cube,#e8ecf0,%metal|Silver+Gold;Silver+Silver;Gold+Moon
Lead|🔘|metal,poison,heavy,@cube,#6a6e78,%metal|Metal+Poison;Iron+Poison;Metal+Pencil
Aluminum|🥫|metal,@cube,#d8dce0,%metal|Metal+Air;Metal+Light+Air;Tin+Air
Titanium|🛡️|metal,hard,@cube,#9aa4b0,%metal|Steel+Space;Metal+Titan;Steel+Steel
Uranium|☢️|metal,poison,energy,@rock,#7aff5a,%metal|Ore+Radiation;Metal+Radiation;Stone+Radiation
Alloy|🔩|metal,@cube,#a8b0c0,%metal|Metal+Metal;Iron+Copper;Steel+Copper
Magnet|🧲|metal,electric,@magnet,#e8303a,%metal|Iron+Electricity;Metal+Electricity;Iron+Lightning
Lodestone|🪨|stone,metal,magic,@rock,#3a3a4a|Magnet+Stone;Iron+Stone+Magic
Magnetism|🧲|energy,abstract,@abstract,#ff5a6a|Magnet+Energy;Magnet+Magnet
Wire|➰|metal,electric,@ring,#d88a4a,%metal|Copper+Rope;Metal+Rope;Copper+Thread
Chain|⛓️|metal,hard,@ring,#9aa0a8,%metal|Metal+Rope;Iron+Rope;Ring+Ring
Chainmail|🛡️|metal,cloth,@cloth,#a8b0b8,%metal|Chain+Cloth;Chain+Shirt;Chain+Chain
Nail|📍|metal,sharp,tiny,@spike,#a0a6b0,%metal|Metal+Spike;Iron+Spike;Metal+Hammer
Screw|🔩|metal,tiny,@spike,#b0b6c0,%metal|Nail+Spiral;Nail+Tornado;Nail+Screwdriver
Spike|📍|sharp,hard,@spike,#9a9aa8|Metal+Sharp Stick;Stone+Sharp Stick;Iron+Sharp Stick;Ice+Sharp Stick
Sharp Stick|🦯|wood,sharp,weapon,@blade,#8a5a2a|Stick+Stone;Stick+Knife;Stick+Sharpener
Coil|🌀|metal,@ring,#b0b6c0,%metal|Wire+Spiral;Metal+Spiral;Wire+Tornado
Spiral|🌀|abstract,@ring,#9a8aff|Wind+Tornado;Line+Circle;Shell+Line
Plastic|🧴|plastic,soft,@cube,#ff5a8a,%plastic|Oil+Heat;Oil+Factory;Oil+Science
Rubber|🛞|plastic,soft,@blob,#3a3a3a,%plastic|Tree+Sap;Plastic+Soft;Tree+Oil+Heat
Sap|🍯|plant,sticky,liquid,@potion,#e8a020|Tree+Knife;Tree+Water;Tree+Honey
Paper|📄|paper,wood,@book,#f6f2e8,%paper|Wood+Water+Pressure;Wood+Pressure;Tree+Machine;Papyrus+Time
Papyrus|📜|paper,plant,ancient,@book,#e8d8a8,%paper|Plant+Egypt;Reed+Pressure;Plant+River+Pressure;Grass+Stone+Water
Reed|🌾|plant,water,@plant,#a8b85a|Grass+River;Grass+Lake;Grass+Water
Cardboard|📦|paper,@cube,#c89a5a,%paper|Paper+Paper;Paper+Wood;Paper+Glue
Newspaper|📰|paper,knowledge,@book,#e8e4d8,%paper|Paper+Ink;Paper+News;Paper+Printing Press
Origami|🦢|paper,tiny,@star5,#ff8ab0,%paper|Paper+Bird;Paper+Japan
Cloth|🧵|cloth,soft,@cloth,#d87a7a|Thread+Thread;Wool+Thread;Cotton+Thread;Silk+Thread
Thread|🧵|cloth,tiny,@ring,#e85a6a,%cloth|Cotton+Spin;Wool+Spinning Wheel;Cotton+Stick;Plant+Spin
Cotton|☁️|plant,soft,cloth,@cloud,#fbfbf6|Plant+Cloud;Plant+Wool;Flower+Cloud
Leather|👜|cloth,hard,@cloth,#8a5a2a|Fur+Fire;Cow+Knife+Sun;Fur+Sun;Fur+Salt
Rope|🪢|cloth,@ring,#c8a060,%cloth|Thread+Thread+Thread;Hay+Hand;Vine+Hand;Thread+Pressure
Glue|🧴|sticky,liquid,@potion,#f8f8f8|Horse+Fire;Sap+Fire;Bone+Water+Fire;Sap+Pressure
Tape|🩹|sticky,plastic,@ring,#e8d8a8,%plastic|Glue+Paper;Glue+Plastic;Glue+Cloth
Paint|🎨|liquid,magic,@potion,#ff5a3a|Water+Color;Oil+Color;Dye+Water
Color|🌈|light,abstract,@abstract,#ff7ad9|Rainbow+Rainbow;Light+Prism;Rainbow+Paint+Light;Rainbow+Human
Dye|🧪|liquid,@potion,#7a3ad8|Plant+Color;Flower+Water;Berry+Water
Ink|🖋️|liquid,dark,@potion,#1a1a3a|Squid+Bottle;Dye+Darkness;Charcoal+Water;Soot+Water
Wax|🕯️|soft,@blob,#fff2c8,%food|Honey+Fire;Beehive+Fire;Oil+Cold
Candle|🕯️|fire,light,@lamp,#fff2c8|Wax+Fire;Wax+Thread;Wax+Light
Soap|🧼|wet,soft,@cube,#bfe8ff,%plastic|Oil+Ash;Fat+Ash;Oil+Water+Flower
Fat|🧈|edible,soft,@blob,#fff0c0,%food|Meat+Fire+Time;Meat+Butter;Pig+Heat
Ceramics|🏺|stone,hard,@potion,#e0c0a0|Clay+Oven;Clay+Fire+Art;Clay+Kiln
Porcelain|🍶|stone,hard,@potion,#f8fbff|Ceramics+China;Clay+Snow+Fire;Ceramics+Fire
Kiln|🔥|building,hot,stone,@building,#a8603a|Oven+Clay;Brick+Fire+House;Furnace+Clay
Gunpowder|💥|explosive,dry,tiny,@gas,#3a3a3a|Charcoal+Sulfur;Coal+Sulfur;Sulfur+Fire+Dust
Explosion|💥|explosive,fire,energy,hot,@celestial,#ffb03a|Gunpowder+Fire;Bomb+Fire;Energy+Energy+Fire;Fire+Pressure
Dynamite|🧨|explosive,weapon,@bomb,#e8302a|Gunpowder+Paper;Gunpowder+Stick;Explosion+Stick
TNT|🧨|explosive,weapon,@cube,#e8302a,%paper|Dynamite+Dynamite;Gunpowder+Box;Dynamite+Box
Bomb|💣|explosive,weapon,@bomb,#2a2a2a|Gunpowder+Metal;Explosion+Metal;Dynamite+Metal;Explosion+Ball
Firework|🎆|explosive,light,emotion,@rocket,#ff3a9a|Gunpowder+Sky;Explosion+Sky;Rocket+Explosion;Gunpowder+Color

// ---------------- tools ----------------
Tool|🛠️|tool,@tool,#6a7a8a|Metal+Human;Stone+Stick;Stick+Human
Hammer|🔨|tool,metal,hard,@tool,#7a6a5a|Tool+Stone;Stick+Stone+Tool;Metal+Stick;Stone+Wood
Axe|🪓|tool,sharp,weapon,@tool,#8a5a3a|Stone+Stick+Sharp;Sharp Stick+Stone;Tool+Tree;Blade+Stick
Saw|🪚|tool,sharp,metal,@tool,#a0a8b0|Tool+Wood;Metal+Teeth;Axe+Teeth
Shovel|🪏|tool,metal,@tool,#7a8a9a|Tool+Earth;Tool+Sand;Metal+Stick+Earth
Pickaxe|⛏️|tool,metal,sharp,@tool,#7a7a8a|Tool+Stone;Tool+Mountain;Tool+Ore
Drill|🔩|tool,machine,electric,@tool,#e8b020|Tool+Electricity;Screw+Motor;Tool+Tornado
Wrench|🔧|tool,metal,@tool,#9aa0a8|Tool+Screw;Metal+Hand+Tool
Screwdriver|🪛|tool,metal,@tool,#e83a3a|Tool+Screw;Metal+Stick+Screw
Scissors|✂️|tool,sharp,metal,@blade,#c0c4cc|Knife+Knife;Blade+Blade;Metal+Sharp+Two
Knife|🔪|tool,sharp,metal,weapon,@blade,#c8ccd4|Metal+Sharp Stick;Blade+Stick;Steel+Sharp Stick
Blade|🗡️|sharp,metal,weapon,@blade,#d0d4dc|Metal+Sharpener;Steel+Stone;Metal+Sharp;Iron+Grindstone
Sharp|🔪|sharp,abstract,@spike,#c8ccd4|Stone+Stone+Stone;Knife+Abstract;Blade+Idea
Sharpener|🪨|tool,stone,@rock,#8a8a98|Stone+Knife;Stone+Blade;Stone+Metal+Tool
Grindstone|🪨|tool,stone,@rock,#9a948a|Stone+Wheel;Wheel+Sharpener
Sandpaper|📄|tool,paper,@book,#d8b880|Sand+Paper;Sand+Glue+Paper
Needle|🪡|tool,metal,sharp,tiny,@spike,#d8dce4,%metal|Nail+Thread;Metal+Thread;Pin+Thread
Pin|📌|metal,sharp,tiny,@spike,#e83a3a,%metal|Nail+Tiny;Needle+Plastic;Metal+Tiny+Sharp
Brush|🖌️|tool,soft,@tool,#c8a060|Stick+Hair;Stick+Fur;Stick+Feather
Paintbrush|🖌️|tool,soft,@tool,#e85a3a|Brush+Paint;Brush+Art;Brush+Color
Broom|🧹|tool,wood,@tool,#c8a050|Stick+Hay;Brush+Stick;Stick+Grass+Rope
Rake|🧹|tool,@tool,#8a7a5a|Tool+Leaf;Tool+Hay;Broom+Spike
Plow|🚜|tool,metal,@tool,#7a6a5a|Tool+Field;Tool+Farm;Ox+Tool
Sickle|🌙|tool,sharp,@blade,#b0b4bc|Tool+Wheat;Blade+Moon;Knife+Wheat
Scythe|⚰️|tool,sharp,death,@blade,#8a8a94|Sickle+Stick;Sickle+Death;Blade+Stick+Wheat
Ladder|🪜|tool,wood,@tool,#c8903a|Wood+Wood+Wood;Plank+Plank;Stick+Rope+Wood
Bucket|🪣|tool,metal,@potion,#9aa8b8|Metal+Water;Wood+Water+Tool;Tin+Water
Net|🥅|tool,cloth,@cloth,#d8d8c0|Rope+Rope;Thread+Grid;Web+Rope
Fishing Rod|🎣|tool,sea,@tool,#8a6a3a|Stick+Thread+Fish;Stick+Fish;Stick+Hook
Hook|🪝|metal,sharp,tiny,@spike,#a0a6b0,%metal|Metal+Question;Metal+Fish
Trap|🪤|tool,@cube,#a8703a,%wood|Box+Stick;Net+Animal;Wood+Spring+Metal
Lock|🔒|metal,tool,@cube,#e8c040,%metal|Metal+Key;Door+Metal;Metal+Secret
Key|🔑|metal,tool,tiny,@key,#ffd23a,%metal|Lock+Metal;Metal+Door;Metal+Secret+Tiny
Magnifying Glass|🔍|tool,glass,knowledge,@tool,#8aa8c8|Lens+Stick;Lens+Metal;Glass+Detective
Compass|🧭|tool,metal,knowledge,@clock,#d84a3a|Magnet+Map;Magnet+Needle;Magnet+Arrow
Map|🗺️|paper,knowledge,@book,#e8d8a0,%paper|Paper+Land;Paper+Earth;Paper+Country;Paper+Explorer
Treasure Map|🗺️|paper,money,@book,#d8b870,%paper|Map+Treasure;Map+Pirate
Clock|🕰️|tool,time,machine,@clock,#c8a060|Time+Machine;Time+Gear;Hourglass+Gear;Sundial+Machine
Alarm Clock|⏰|tool,time,sound,@clock,#e83a3a|Clock+Sound;Clock+Bell;Clock+Morning
Watch|⌚|tool,time,tiny,@clock,#3a3a4a|Clock+Tiny;Clock+Hand;Clock+Wrist
Hourglass|⏳|time,glass,sand,@potion,#e8d8a8,%glass|Sand+Glass;Glass+Time;Sand+Bottle
Time|⏳|time,abstract,@abstract,#c8b8ff|Hourglass+Energy;Clock+Energy;Hourglass+Life
Sundial|🕰️|time,stone,ancient,@disc,#c8c0b0|Sun+Clock;Sun+Stone+Time;Sun+Stick
Calendar|📅|paper,time,knowledge,@book,#f8f4ea,%paper|Paper+Time;Clock+Paper;Year+Paper
Year|🗓️|time,abstract,@abstract,#a8c8ff|Season+Season;Day+Time+Time;Calendar+Time
Torch|🔦|fire,light,wood,@tool,#e8903a|Stick+Fire;Wood+Fire+Stick;Stick+Flame
Lantern|🏮|fire,light,glass,@lamp,#ff9a3a|Candle+Glass;Torch+Glass;Fire+Glass+Metal
Lightbulb|💡|light,electric,glass,@lamp,#fff27a|Electricity+Glass;Glass+Light+Electricity;Lantern+Electricity
Flashlight|🔦|light,electric,tool,@tool,#3a3a3a|Lightbulb+Battery;Torch+Electricity;Lightbulb+Tube
Match|🧯|fire,wood,tiny,@tool,#e8c07a|Stick+Fire+Tiny;Stick+Sulfur;Wood+Sulfur
Lighter|🔥|fire,plastic,tool,@device,#e83a3a|Match+Plastic;Fire+Metal+Gas;Match+Metal
Umbrella|☂️|cloth,tool,@umbrella,#3a5ad8|Rain+Stick;Rain+Cloth;Cloth+Stick
Wheel|🛞|tool,round,@ring,#3a3a3a,%wood|Stone+Circle;Wood+Circle;Log+Saw+Circle
Circle|⭕|abstract,@ring,#ff5a5a|Ring+Abstract;Line+Spiral;Wheel+Idea
Line|➖|abstract,@abstract,#3a3a3a|Pencil+Paper;Stick+Sand;Stick+Dust
Pencil|✏️|tool,wood,paper,@tool,#ffcf3a|Wood+Carbon;Wood+Charcoal;Stick+Coal
Pen|🖊️|tool,plastic,@tool,#2a4aa8|Ink+Feather;Ink+Stick;Pencil+Ink
Book|📕|paper,knowledge,@book,#c8302a|Paper+Paper+Knowledge;Paper+Story;Paper+Pen;Paper+Leather
Glasses|👓|glass,tool,@ring,#3a3a3a,%glass|Lens+Lens;Glass+Eye+Metal;Lens+Wire
Scroll|📜|paper,ancient,knowledge,@book,#e8d8a8,%paper|Papyrus+Ink;Paper+Rope;Paper+Ancient
Abacus|🧮|tool,knowledge,ancient,@cube,#a8703a,%wood|Wood+Math;Stick+Pebble+Math
Anvil|🔨|metal,hard,@cube,#4a4e58,%metal|Iron+Stone;Metal+Hammer+Stone;Steel+Stone+Hammer
Forge|🔥|building,fire,hot,metal,@building,#5a3a2a|Anvil+Fire;Blacksmith+House;Furnace+Anvil
Furnace|🔥|building,fire,hot,@building,#6a4a3a|Stone+Fire+House;Brick+Fire;Oven+Metal;Fire+Brick+Metal
Mine|⛏️|underground,building,@landform,#6a5a4a|Cave+Pickaxe;Mountain+Pickaxe;Cave+Miner
Well|🪣|water,building,stone,@building,#8a8a8a|Water+Hole+Stone;Water+Bucket;Stone+Water+Rope
Spinning Wheel|🎡|tool,wood,@ring,#a8703a,%wood|Wheel+Thread;Wheel+Wool;Wheel+Cotton
Spin|🌀|abstract,fast,@ring,#9ad8ff|Wheel+Energy;Tornado+Abstract;Wind+Spiral
Loom|🧶|tool,wood,machine,@machine,#a8703a|Thread+Machine;Thread+Wood+Grid;Spinning Wheel+Grid
Grid|#️⃣|abstract,@abstract,#5a6a8a|Line+Line;Net+Line;Line+Map
Box|📦|paper,wood,@cube,#c89a5a,%paper|Cardboard+Tape;Wood+Square;Cardboard+Cardboard;Plank+Nail
Square|🟥|abstract,@cube,#ff5a5a|Line+Line+Line;Circle+Box;Line+Grid
Gift|🎁|emotion,@cube,#e83a5a,%paper|Box+Love;Box+Ribbon;Box+Birthday;Box+Christmas
Ribbon|🎀|cloth,@cloth,#ff5aa8|Cloth+Gift;Thread+Bow;Cloth+Pink
Bow|🏹|weapon,wood,@tool,#8a5a2a|Stick+Rope+Arrow;Stick+String;Wood+Rope;Wood+Thread
Arrow|🏹|weapon,sharp,wood,@blade,#8a5a2a|Stick+Feather+Spike;Sharp Stick+Feather;Stick+Feather;Bow+Stick
String|🧶|cloth,tiny,@ring,#f0e8d0,%cloth|Thread+Stick;Thread+Tiny;Rope+Tiny

// ---------------- weapons ----------------
Weapon|⚔️|weapon,sharp,metal,@blade,#9aa0aa|Tool+Blood;Tool+War;Knife+Human;Sword+Idea
Sword|🗡️|weapon,sharp,metal,@blade,#d0d6de|Blade+Metal;Metal+Knife;Steel+Blade;Blade+Blacksmith
Dagger|🗡️|weapon,sharp,tiny,@blade,#c0c6ce|Knife+Sword;Sword+Tiny;Blade+Tiny
Spear|🔱|weapon,sharp,wood,@blade,#8a6a3a|Sharp Stick+Stick;Stick+Knife+Stick;Stick+Blade
Trident|🔱|weapon,sea,magic,@blade,#ffd23a|Spear+Ocean;Spear+Three;Spear+Poseidon;Spear+Sea
Mace|🔨|weapon,metal,hard,@tool,#7a7a84|Club+Spike;Hammer+Spike;Club+Metal
Club|🏏|weapon,wood,@tool,#7a5a3a|Wood+Stick;Log+Hand;Stick+Stick+Stone
Slingshot|🪃|weapon,@tool,#a8703a|Stick+Rubber;Rubber+Stone;Stick+Rubber+Pebble
Boomerang|🪃|weapon,wood,@blade,#c8903a|Stick+Wind;Wood+Australia
Catapult|🏹|weapon,wood,machine,@vehicle,#8a6a3a|Slingshot+Huge;Slingshot+Wood;Wood+Rope+Boulder
Cannon|💣|weapon,metal,explosive,@vehicle,#3a3a3a|Gunpowder+Tube;Metal+Explosion+Tube;Bomb+Tube
Gun|🔫|weapon,metal,explosive,@tool,#3a3a44|Metal+Gunpowder;Bullet+Metal;Cannon+Tiny
Bullet|🔘|weapon,metal,tiny,fast,@egg,#c8a040,%metal|Gun+Metal;Metal+Gunpowder+Tiny;Gunpowder+Pebble
Tube|🧪|glass,@potion,#d8f0ff,%glass|Glass+Pipe;Pipe+Glass;Glass+Hole;Plastic+Hole
Pipe|🚰|metal,@tool,#9aa4ae|Metal+Tube;Metal+Hole;Metal+Water+Tube;Iron+Hole
Shield|🛡️|metal,hard,weapon,@shield,#9ab0c8|Wood+Armor;Metal+Disc;Armor+Hand
Armor|🛡️|metal,hard,weapon,@humanoid,#a8b0b8,%metal|Metal+Cloth;Iron+Shirt;Steel+Cloth;Chainmail+Steel
Helmet|⛑️|metal,hard,@bowl,#c8d0d8,%metal|Metal+Head;Armor+Head;Metal+Hat
Katana|🗡️|weapon,sharp,metal,@blade,#e0e4ea|Sword+Japan;Sword+Samurai;Blade+Japan
Shuriken|⭐|weapon,sharp,metal,tiny,@star5,#9aa0aa,%metal|Star+Blade;Star+Knife;Ninja+Star
Grenade|💣|weapon,explosive,@bomb,#4a5a3a|Bomb+Tiny;Bomb+Hand;Bomb+Fruit
Laser|🔴|light,energy,weapon,@bolt,#ff2a3a,%energy|Light+Electricity;Light+Lens+Energy;Light+Crystal+Energy
Laser Gun|🔫|weapon,light,machine,@tool,#ff3a5a|Laser+Gun;Laser+Weapon;Gun+Electricity
Laser Sword|🗡️|weapon,light,energy,@blade,#5af0ff|Laser+Sword;Laser+Blade;Sword+Electricity

// ---------------- buildings & places ----------------
House|🏠|building,@building,#e8a07a|Brick+Brick;Wood+Wood+Roof;Wall+Roof;Brick+Wall
Wall|🧱|building,stone,hard,@cube,#c8b8a8|Brick+Brick+Brick;Stone+Stone+Brick;Brick+Concrete;Stone+Mud+Stone
Roof|🛖|building,@building,#b0402a|Wood+Rain;Brick+Rain;Wall+Rain;Plank+Rain
Door|🚪|building,wood,@cube,#a8703a,%wood|Wood+Wall;Plank+Wall;House+Plank
Window|🪟|building,glass,@cube,#cfeeff,%glass|Glass+Wall;Glass+House;Glass+Door
Chimney|🏭|building,stone,@building,#a85a3a|Brick+Smoke;House+Smoke;Fireplace+Roof
Fireplace|🔥|building,fire,hot,@building,#a85a3a|Brick+Fire+House;House+Fire;Wall+Fire
Fence|🚧|building,wood,@cube,#c8a070,%wood|Wood+Wall+Field;Stick+Stick+Field;Plank+Field;Wall+Field
Hut|🛖|building,wood,@building,#c8a060|Mud+Hay;Stick+Hay;Wood+Hay
Cabin|🛖|building,wood,@building,#8a5a2a|Log+House;Wood+House;Log+Log
Treehouse|🏡|building,wood,plant,@building,#8a6a3a|Tree+House;House+Tree+Ladder;Cabin+Tree
Tent|⛺|building,cloth,@building,#3ad06a|Cloth+Stick;Cloth+House;Rope+Cloth+Stick
Castle|🏰|building,stone,huge,@building,#c8c0b8|House+Wall+Wall;Wall+Tower;King+House;House+Moat
Tower|🗼|building,stone,huge,@building,#b8b0a8|Wall+Wall;House+House+Sky;Brick+Sky
Lighthouse|🗼|building,light,sea,@building,#f4f4f4|Tower+Light;Tower+Sea;Tower+Lantern;Tower+Ocean
Bridge|🌉|building,stone,@building,#a8a8a8|Wall+River;Wood+River;Road+River;Stone+River+Road
Road|🛣️|building,stone,@landform,#4a4a4a|Stone+Stone+Line;Concrete+Line;Stone+Car;Asphalt+Line
Asphalt|⬛|stone,dark,@cube,#2a2a2a|Oil+Stone;Oil+Gravel;Tar+Gravel
Tar|⬛|liquid,sticky,dark,@liquid,#1a1a1a|Oil+Fire;Coal+Heat;Oil+Smoke
Dam|🌊|building,water,stone,@building,#9a9aa0|Wall+River;Beaver+River;Concrete+River;Beaver+Wood
Moat|🏰|water,building,@landform,#3a7aa8|Castle+Water;Wall+Water+Hole;River+Castle
Fountain|⛲|water,building,stone,@building,#8ad0ff|Water+Statue;Water+Pressure+Stone;Geyser+City
Statue|🗽|stone,building,@humanoid,#c8c4b8,%stone|Stone+Human;Stone+Sculptor;Marble+Human;Human+Medusa
Monument|🗿|stone,building,huge,ancient,@building,#c8c0b0|Statue+Huge;Statue+History;Stone+Memory
Temple|🛕|building,holy,ancient,@building,#e8c07a|Church+Ancient;Stone+Holy;House+God;Marble+Holy
Church|⛪|building,holy,@building,#f4f0e8|House+Holy;House+God;House+Priest;House+Angel
Pyramid|🛕|building,stone,ancient,huge,@building,#e8c87a|Stone+Desert+Triangle;Sand+Stone+Pharaoh;Desert+Tomb;Brick+Desert
Triangle|🔺|abstract,@abstract,#ff8a3a|Line+Mountain;Line+Three;Pyramid+Line
Tomb|⚰️|building,death,stone,@building,#7a7a7a|Grave+House;Stone+Death+House;Grave+Stone
Grave|🪦|death,stone,@cube,#9a9aa0,%stone|Death+Earth;Death+Stone;Skeleton+Earth
Graveyard|⚰️|death,dark,@landform,#5a5a6a|Grave+Grave;Grave+Field;Death+Field
Ruins|🏛️|building,stone,ancient,@building,#b8b0a0|Castle+Time;Temple+Time;City+Time;House+Earthquake
Relic|🏺|ancient,magic,money,@potion,#c8a060|Ruins+Treasure;Ruins+Archaeologist;Temple+Treasure;Ancient+Treasure
Colosseum|🏟️|building,stone,ancient,sport,@building,#d8c0a0|Stadium+Rome;Gladiator+Building;Arena+Ancient;Arena+Rome
Arena|🏟️|building,sport,@building,#c8b0a0|Stadium+Fight;Sport+Building;Gladiator+Sand
Stadium|🏟️|building,sport,huge,@building,#8aa8c8|Sport+House;Field+Crowd;Arena+City;Sport+Crowd
School|🏫|building,knowledge,@building,#e8b04a|House+Knowledge;House+Teacher;House+Book;House+Child
Library|📚|building,knowledge,@building,#a8703a|Book+Book;House+Book+Book;Book+Building;School+Book
Museum|🏛️|building,knowledge,ancient,@building,#e8e0d0|History+House;Fossil+House;Art+House;Relic+House
Hospital|🏥|building,medicine,@building,#f4f8ff|House+Doctor;House+Medicine;House+Nurse
Laboratory|🧪|building,knowledge,machine,@building,#e8f4ff|House+Science;House+Scientist;Science+Building
Observatory|🔭|building,cosmic,knowledge,@building,#c8d0e0|Telescope+House;Telescope+Tower;Telescope+Mountain
Factory|🏭|building,machine,@building,#8a8a9a|Machine+House;House+Engine;House+Steam Engine;Machine+Building
Skyscraper|🏙️|building,huge,glass,@building,#8ab0d8|Tower+Glass;Tower+City;House+Sky+Sky;Tower+Steel
Bank|🏦|building,money,@building,#e8e0c8|House+Money;Money+Building;House+Gold
Shop|🏪|building,money,@building,#ff8a5a|House+Money+Food;House+Merchant;Market+House
Market|🛒|building,money,human,@building,#e8a05a|Shop+Shop;Merchant+Merchant;Crowd+Money
Restaurant|🍽️|building,edible,@building,#e85a4a|House+Food;House+Chef;Food+Building
Kitchen|🍳|building,edible,hot,@building,#f0e0c8|House+Food+Fire;House+Stove;House+Oven;Chef+House
Prison|⛓️|building,evil,@building,#7a7a84|House+Thief;House+Chain;Police+House
Palace|🏯|building,money,huge,@building,#ffe08a|Castle+Gold;House+King;Castle+Queen;Castle+Money
Throne|🪑|money,holy,@cube,#ffd23a,%metal|Chair+King;Chair+Gold;Chair+Crown;Chair+Power
Zoo|🦁|building,animal,@building,#7ad05a|Animal+House;Animal+Cage;Animal+City;Lion+Fence
Aquarium|🐠|building,sea,glass,@building,#5ab8e8|Fish+Glass;Fish+House;Glass+Water+Fish;Fish+Box
Circus|🎪|building,emotion,@building,#ff3a5a|Tent+Clown;Tent+Animal;Tent+Lion;Clown+Clown
Park|🏞️|plant,building,@landform,#5ac05a|City+Tree;Garden+City;Tree+Bench;Grass+City
Bench|🪑|wood,@cube,#a8703a,%wood|Chair+Chair;Wood+Park;Plank+Chair
Airport|🛫|building,flying,@building,#c8d8e8|Airplane+House;Airplane+City;Airplane+Road
Harbor|⚓|building,sea,@building,#5a8ab0|Boat+House;Ship+City;Boat+City;Ship+Beach
Train Station|🚉|building,@building,#a8a0b0|Train+House;Train+City
Haunted House|🏚️|building,dark,evil,@building,#4a3a5a|House+Ghost;House+Spirit;House+Night+Death;House+Curse
Sandcastle|🏰|building,earth,sand,@building,#f0d8a0,%soil|Sand+Castle;Beach+Castle;Sand+House;Sand+Bucket
Lighthouse Keeper|🧑‍✈️|human,sea,light,@humanoid,#3a5a8a|Human+Lighthouse;Sailor+Lighthouse
Hole|🕳️|earth,dark,underground,@ring,#2a2420|Earth+Shovel;Shovel+Sand;Earth+Drill+Shovel;Sand+Shovel
Sewer|🚰|underground,water,poison,@landform,#5a6a4a|Pipe+City;Pipe+Poop;Tunnel+Water+City
Garbage|🗑️|poison,plastic,@cube,#6a7a5a,%plastic|Plastic+Death;Food+Time+Time;Paper+Time+Food;City+Waste
Waste|♻️|poison,@blob,#6a7a4a,%organic|Garbage+Garbage;Poop+Poop;Factory+Water
Junk|🗑️|metal,@cube,#7a7570,%metal|Metal+Garbage;Machine+Garbage;Car+Garbage;Robot+Garbage
Scrapyard|🚗|metal,building,@landform,#8a7a6a|Junk+Junk;Car+Junk;Junk+Field
Pollution|🏭|poison,gas,dark,@gas,#6a6a4a|Smoke+Factory;Factory+Air;Car+Smoke;Garbage+Water
Toxic Waste|☢️|poison,liquid,@potion,#7aff3a|Waste+Radiation;Pollution+Water;Garbage+Radiation;Waste+Factory

// ---------------- countries & regions (for flavour) ----------------
Egypt|🇪🇬|human,ancient,hot,@landform,#e8c060|Pyramid+Country;Desert+Country;Pharaoh+Land;Desert+River+Civilization
Japan|🇯🇵|human,@landform,#ff4a5a|Island+Country;Sushi+Country;Samurai+Country;Island+Sun+Country
China|🇨🇳|human,@landform,#e8302a|Wall+Country+Huge;Panda+Country;Rice+Country;Dragon+Country
India|🇮🇳|human,@landform,#ff9a3a|Curry+Country;Tea+Country;Elephant+Country
France|🇫🇷|human,@landform,#3a5ad8|Baguette+Country;Wine+Country;Croissant+Country
Italy|🇮🇹|human,@landform,#3ac05a|Pizza+Country;Pasta+Country;Rome+Country
Rome|🏛️|human,ancient,@building,#d8a060|Colosseum+City;Italy+City;Empire+City;Gladiator+City
Greece|🏛️|human,ancient,@landform,#3a8ad8|Olive+Country;Temple+Country;Philosophy+Country;Olympics+Country
America|🇺🇸|human,@landform,#3a4ad8|Eagle+Country;Freedom+Country;Burger+Country;Cowboy+Country
Canada|🇨🇦|human,cold,@landform,#e83a3a|Maple+Country;Moose+Country;Syrup+Country;Snow+America
Australia|🇦🇺|human,hot,@landform,#ffcf3a|Kangaroo+Country;Island+Desert+Country;Koala+Country;Continent+Island
Africa|🌍|huge,hot,@landform,#d8a04a|Savanna+Continent;Lion+Continent;Desert+Continent
South America|🌎|huge,plant,@landform,#5ab05a|Jungle+Continent;Llama+Continent
New Zealand|🇳🇿|human,@landform,#3a6a3a|Island+Island+Sheep;Kiwi+Country;Sheep+Island
Netherlands|🇳🇱|human,@landform,#ff8a1a|Windmill+Country;Tulip+Country
Prairie|🌾|plant,huge,@landform,#c8b050|Grass+Field;Field+Wind;Field+Bison
Empire|🏯|human,huge,money,@building,#a83a3a|Country+Country;Country+Army;Kingdom+Kingdom;Emperor+Land
Kingdom|🏰|human,money,@building,#c8a03a|King+Country;Castle+Country;King+Land
Atlantis|🔱|mythical,sea,ancient,building,@building,#3ad8d0,!epic|City+Ocean;City+Sea+Time;Civilization+Ocean

// ---------------- vehicles ----------------
Cart|🛒|vehicle,wood,@vehicle,#a8703a|Wheel+Wood;Wheel+Box;Wheel+Plank
Wagon|🛻|vehicle,wood,@vehicle,#8a5a2a|Cart+Horse;Cart+Cart;Cart+Wheel
Chariot|🛞|vehicle,ancient,fast,@vehicle,#d8a040|Cart+Horse+War;Wagon+Warrior;Horse+Wheel;Cart+Gladiator
Bicycle|🚲|vehicle,metal,sport,@vehicle,#3ac0e8|Wheel+Wheel;Wheel+Human
Motorcycle|🏍️|vehicle,fast,machine,@vehicle,#e83a3a|Bicycle+Engine;Bicycle+Motor;Bicycle+Fire
Car|🚗|vehicle,machine,metal,fast,@vehicle,#e8402a|Wagon+Engine;Cart+Engine;Wheel+Engine;Metal+Wheel+Engine
Truck|🚚|vehicle,machine,huge,@vehicle,#3a7ad8|Car+Huge;Car+Box;Car+Cargo
Bus|🚌|vehicle,machine,huge,@vehicle,#ffc61a|Car+Crowd;Car+School;Car+Bus Stop
Train|🚆|vehicle,machine,fast,@vehicle,#3a5a8a|Steam Engine+Wagon;Car+Rail;Wagon+Wagon+Engine;Steam Engine+Rail
Rail|🛤️|metal,building,@landform,#6a6a6a|Metal+Road;Iron+Road;Steel+Road
Locomotive|🚂|vehicle,machine,@vehicle,#2a2a2a|Train+Steam;Steam Engine+Cart;Train+Coal
Tractor|🚜|vehicle,machine,@vehicle,#3aa83a|Car+Farm;Car+Field;Car+Farmer;Plow+Engine
Tank|🪖|vehicle,weapon,metal,huge,@vehicle,#5a6a3a|Car+Cannon;Car+Armor;Truck+Cannon;Car+Army
Ambulance|🚑|vehicle,medicine,@vehicle,#f8f8f8|Car+Hospital;Car+Doctor;Car+Medicine
Fire Truck|🚒|vehicle,fire,@vehicle,#e8201a|Truck+Fire;Car+Firefighter;Truck+Water+Fire
Police Car|🚓|vehicle,@vehicle,#2a3a8a|Car+Police;Car+Siren
Race Car|🏎️|vehicle,fast,sport,@vehicle,#ff2a2a|Car+Race;Car+Speed;Car+Fast;Car+Sport
Electric Car|🚗|vehicle,electric,@vehicle,#3ae0a8|Car+Electricity;Car+Battery
Skateboard|🛹|vehicle,sport,wood,@vehicle,#ff7a3a|Plank+Wheel;Wood+Wheel+Sport;Surfboard+Wheel
Sled|🛷|vehicle,cold,wood,@vehicle,#c83a2a|Wood+Snow;Plank+Snow;Snow+Cart
Snowmobile|🛷|vehicle,cold,machine,@vehicle,#3a8ad8|Sled+Engine;Sled+Motor;Car+Snow
Boat|🛶|vehicle,sea,wood,@boat,#c89a5a|Wood+Water;Log+Water;Raft+Paddle;Wood+River
Raft|🛶|vehicle,sea,wood,@boat,#b0884a|Log+Log+Water;Log+Rope;Wood+Rope+Water;Wood+Lake
Canoe|🛶|vehicle,sea,wood,@boat,#c86a3a|Boat+Paddle;Log+Knife+Water;Boat+River
Paddle|🏓|wood,tool,@tool,#a8703a|Wood+Water+Hand;Plank+Hand;Stick+Plank
Sailboat|⛵|vehicle,sea,@boat,#f4f4f4|Boat+Wind;Boat+Cloth;Boat+Sail
Sail|⛵|cloth,air,@cloth,#f8f8f8|Cloth+Wind;Cloth+Boat;Cloth+Air
Ship|🚢|vehicle,sea,huge,@boat,#3a5a8a|Boat+Boat;Boat+Huge;Sailboat+Huge;Boat+Steel
Pirate Ship|🏴‍☠️|vehicle,sea,evil,@boat,#3a2a2a|Ship+Pirate;Boat+Pirate;Ship+Skull;Ship+Cannon
Submarine|🚢|vehicle,sea,machine,underground,@boat,#e8c020|Boat+Fish+Metal;Ship+Fish
Yacht|🛥️|vehicle,sea,money,@boat,#fbfbff|Ship+Money;Boat+Gold;Sailboat+Money
Airplane|✈️|vehicle,flying,machine,sky,fast,@plane,#e8eef4|Bird+Metal;Car+Wing;Bird+Machine;Car+Sky
Helicopter|🚁|vehicle,flying,machine,@plane,#3a8ad8|Airplane+Spin;Airplane+Tornado;Car+Propeller;Airplane+Fan
Propeller|🌀|machine,metal,@gear,#9aa0a8|Fan+Engine;Wind+Metal+Spin;Windmill+Tiny
Hot Air Balloon|🎈|vehicle,flying,sky,@plane,#ff5a3a|Balloon+Fire;Balloon+Basket;Balloon+Cloth+Fire
Balloon|🎈|plastic,air,soft,flying,@orb,#ff3a5a,%plastic|Air+Rubber;Rubber+Helium;Air+Plastic+Party
Helium|🎈|gas,air,flying,@gas,#ffe8f0|Balloon+Gas;Gas+Sky;Air+Sun+Gas;Gas+Science
Air Pump|🎈|tool,air,machine,@tool,#3a8ad8|Air+Machine;Air+Pressure+Tube;Air+Tube
Kite|🪁|cloth,flying,sky,@star5,#ff5ab0,%cloth|Paper+Wind;Cloth+Wind+String;Paper+Bird+String;Cloth+String
Parachute|🪂|cloth,flying,@umbrella,#ff7a3a|Umbrella+Airplane;Cloth+Sky+Human;Umbrella+Sky
Jetpack|🚀|machine,flying,fire,@machine,#9aa0aa|Rocket+Backpack;Rocket+Human;Engine+Backpack
Spaceship|🚀|vehicle,cosmic,machine,flying,@rocket,#c8d0e8|Rocket+Alien;Rocket+Galaxy;Airplane+Space+Machine;Rocket+Future
Cargo|📦|tool,@cube,#a8703a,%paper|Box+Box;Box+Ship;Box+Truck
Siren|🚨|sound,electric,@lamp,#e8301a|Sound+Light;Police+Sound
Bus Stop|🚏|building,@tool,#3a6ad8|Bench+Road;Sign+Road
Sign|🪧|wood,knowledge,@tool,#e8c07a|Wood+Word;Plank+Paint;Plank+Arrow
Engine|⚙️|machine,metal,hot,@gear,#7a7a84,%metal|Metal+Fire+Machine;Steam Engine+Oil;Machine+Oil;Metal+Explosion+Machine
Motor|⚙️|machine,electric,@gear,#8a8a94,%metal|Electricity+Machine;Engine+Electricity;Magnet+Wire+Machine
Steam Engine|🚂|machine,metal,hot,@machine,#5a4a3a|Steam+Machine;Steam+Metal;Steam+Pressure+Metal;Boiler+Gear
Boiler|♨️|machine,hot,metal,@potion,#8a5a3a,%metal|Metal+Steam;Metal+Hot Water;Kettle+Huge

// ---------------- household & clothing ----------------
Chair|🪑|wood,@cube,#a8703a,%wood|Wood+Wood;Plank+Plank+Wood;Plank+Stick
Table|🪵|wood,@cube,#b0804a,%wood|Wood+Plank;Plank+Plank+Plank;Chair+Chair+Wood;Plank+Stick+Stick
Bed|🛏️|soft,cloth,@cube,#7a9ad8,%cloth|Wood+Pillow;Table+Pillow;Pillow+Blanket;Wood+Sleep
Pillow|🛌|soft,cloth,@cloth,#f4f4fb|Cloth+Feather;Cloth+Cotton;Feather+Feather+Cloth;Cloth+Wool
Blanket|🧣|soft,cloth,@cloth,#d86a6a|Cloth+Cloth;Wool+Cloth;Cotton+Cloth
Sofa|🛋️|soft,cloth,@cube,#8a5ad8,%cloth|Chair+Pillow;Bed+Chair;Chair+Blanket
Lamp|🛋️|light,electric,@lamp,#ffe08a|Lightbulb+Table;Lightbulb+Stick;Candle+Electricity
Bowl|🥣|stone,@bowl,#e8d0b0,%stone|Clay+Water;Ceramics+Round;Clay+Hole;Wood+Hole
Plate|🍽️|stone,@disc,#f8f8f8,%stone|Ceramics+Flat;Clay+Flat;Bowl+Flat;Porcelain+Food
Cup|🥤|stone,@drink,#f4f0ea,%stone|Clay+Water+Hand;Bowl+Handle;Ceramics+Water;Glass+Water+Hand
Mug|☕|stone,@drink,#e85a3a,%stone|Cup+Handle;Cup+Coffee;Cup+Huge
Bottle|🍾|glass,@potion,#7ad0a8,%glass|Glass+Water;Glass+Juice;Glass+Liquid;Glass+Wine
Jar|🫙|glass,@potion,#d8f4ff,%glass|Glass+Jam;Bottle+Huge;Glass+Honey
Pot|🍲|metal,@bowl,#5a5a64,%metal|Metal+Bowl;Metal+Water+Fire;Iron+Bowl;Clay+Plant
Frying Pan|🍳|metal,tool,hot,@disc,#3a3a44,%metal|Metal+Flat+Fire;Iron+Plate;Pot+Flat;Metal+Plate
Kettle|🫖|metal,hot,@potion,#c8c8d0,%metal|Pot+Steam;Pot+Hot Water;Metal+Tea
Oven|♨️|machine,hot,@machine,#5a5a64|Stone+Fire+Box;Brick+Fire+Box;Metal+Fire+Box;Box+Fire
Stove|🔥|machine,hot,@machine,#e8e8e8|Oven+Fire;Oven+Pot;Metal+Fire+Kitchen;Kitchen+Fire
Grill|🍖|tool,metal,hot,@cube,#3a3a3a,%metal|Metal+Fire+Grid;Fire+Grid;Metal+Grid
Barbecue|🍖|tool,hot,fire,@machine,#4a3a3a|Grill+Meat;Grill+Charcoal;Grill+Party
Toaster|🍞|machine,hot,electric,@machine,#c8ccd4|Bread+Machine;Bread+Electricity;Oven+Tiny
Microwave|📟|machine,hot,electric,@machine,#e8e8ec|Oven+Electricity;Oven+Radiation;Oven+Future
Fridge|🧊|machine,cold,electric,@machine,#f4f8ff|Cold+Box;Ice+Box;Ice+Machine;Cold+Machine
Freezer|❄️|machine,cold,ice,@machine,#d8f0ff|Fridge+Ice;Fridge+Snow;Fridge+Cold
Blender|🌀|machine,tool,electric,@machine,#3ad0e8|Motor+Bowl;Spin+Bowl;Motor+Knife;Tornado+Cup
Sponge|🧽|soft,wet,@cube,#ffe03a,%plastic|Water+Foam;Foam+Soft;Coral+Soft;Soap+Foam
Towel|🧺|cloth,soft,dry,@cloth,#5ad0e8|Cloth+Water;Cloth+Bath;Cloth+Dry
Bath|🛁|water,wet,@bowl,#f4fbff,%stone|Water+Tub;Water+Soap;Bowl+Huge+Water;Water+Bowl+Huge
Tub|🛁|stone,@bowl,#f8fbff,%stone|Bowl+Bowl;Barrel+Saw
Barrel|🛢️|wood,@potion,#8a5a2a,%wood|Wood+Ring;Plank+Ring;Wood+Wine
Toilet|🚽|stone,@bowl,#f8f8f8,%stone|Poop+Bowl;Poop+Chair;Water+Chair
Soap Bubble|🫧|air,water,@orb,#e8f8ff,%glass|Soap+Air;Soap+Bubble;Soap+Wind
Mop|🧹|tool,wet,@tool,#c8c0b0|Broom+Water;Stick+Sponge;Stick+Cloth+Water
Vacuum|🌀|machine,electric,@machine,#e83a5a|Broom+Electricity;Air+Motor;Broom+Machine
Basket|🧺|wood,plant,@bowl,#c8a060,%wood|Hay+Bowl;Reed+Bowl;Stick+Bowl
Bag|👜|cloth,@cube,#c86a3a,%cloth|Cloth+Box;Leather+Box;Cloth+Rope;Plastic+Box
Backpack|🎒|cloth,@cube,#e85a3a,%cloth|Bag+Back;Bag+School;Bag+Rope;Bag+Explorer
Clothes|👕|cloth,@cloth,#5a8ad8|Cloth+Human;Cloth+Body;Cloth+Thread+Human
Shirt|👕|cloth,@cloth,#5a9ae8|Clothes+Arm;Cloth+Arm;Clothes+Button
Pants|👖|cloth,@cloth,#3a5a8a|Clothes+Leg;Cloth+Leg;Clothes+Two
Dress|👗|cloth,@cloth,#e85aa8|Clothes+Woman;Cloth+Woman;Clothes+Princess
Hat|🎩|cloth,@crown,#2a2a2a|Cloth+Head;Clothes+Head;Leather+Head
Top Hat|🎩|cloth,money,@crown,#1a1a1a|Hat+Magician;Hat+Money
Crown|👑|metal,money,holy,@crown,#ffd23a,%metal|Gold+Hat;Gold+King;Gold+Head;Diamond+Hat
Tiara|👑|metal,money,tiny,@crown,#ff9ad8,%metal|Crown+Princess;Crown+Tiny;Diamond+Hair
Scepter|🪄|metal,money,magic,@tool,#ffd23a|Gold+Stick;Crown+Stick;King+Stick
Shoe|👟|cloth,@cube,#e8e8e8,%cloth|Leather+Foot;Clothes+Foot;Rubber+Leather
Boot|👢|cloth,@cube,#6a4a2a,%cloth|Shoe+Leather;Shoe+Mud;Shoe+Rain;Shoe+Cowboy
Sock|🧦|cloth,soft,@cloth,#ff5a5a|Wool+Foot;Cloth+Foot;Shoe+Wool
Glove|🧤|cloth,soft,@cloth,#3a8ad8|Wool+Hand;Cloth+Hand;Leather+Hand
Scarf|🧣|cloth,soft,cold,@cloth,#e83a3a|Wool+Cold;Cloth+Cold;Wool+Neck;Blanket+Snow
Coat|🧥|cloth,cold,@cloth,#6a5a3a|Clothes+Cold;Clothes+Snow;Fur+Clothes;Wool+Clothes
Cape|🦸|cloth,flying,@cloth,#e8201a|Cloth+Superhero;Blanket+Hero;Cloth+Wind+Hero;Cloth+Hero
Mask|🎭|cloth,emotion,dark,@disc,#f8f8f8|Cloth+Face;Paper+Face;Clay+Face;Clothes+Face
Face|🙂|human,emotion,@orb,#ffcf7a|Head+Eye;Human+Eye;Head+Smile
Eyepatch|🏴‍☠️|cloth,dark,@disc,#1a1a1a|Pirate+Eye;Cloth+Eye;Mask+Eye
Ring|💍|metal,money,@ring,#ffd23a,%metal|Gold+Circle;Gold+Diamond;Metal+Circle;Silver+Circle
Necklace|📿|metal,money,@ring,#ffd8a8,%metal|Chain+Gold;Ring+Chain;Pearl+String;Gold+String
Pearl|⚪|sea,money,@orb,#fbf8f0,%crystal|Shell+Sand;Oyster+Sand;Shell+Time
Oyster|🦪|animal,sea,@egg,#c8c0b0|Shell+Animal;Shell+Fish;Shell+Life
Jewelry|💎|money,crystal,@ring,#c8f0ff,%crystal|Ring+Necklace;Gold+Gem;Diamond+Gold;Gem+Metal
Treasure|💰|money,metal,@cube,#ffcf3a,%metal|Gold+Box;Gold+Chest;Jewelry+Box;Gold+Pirate
Chest|🧰|wood,@cube,#a8703a,%wood|Box+Wood;Box+Lock;Box+Treasure
Money|💵|money,paper,@book,#5ac05a,%paper|Gold+Paper;Paper+Bank;Coin+Paper;Coin+Coin
Coin|🪙|money,metal,@coin,#ffcf3a|Gold+Circle+Tiny;Metal+Circle+Tiny;Gold+Money;Gold+Disc
Disc|💿|abstract,@coin,#c8ccd4|Circle+Flat;Circle+Plate;Plate+Abstract
Flat|▭|abstract,@abstract,#d8d8d8|Pressure+Line;Pressure+Paper;Hammer+Square
Wig|💇|cloth,soft,@cloth,#e8c07a|Hair+Cloth;Hair+Hat;Hair+Glue
Hair|💇|soft,living,@cloth,#7a4a2a|Human+Fur;Fur+Head;Head+Grass
Beard|🧔|soft,living,human,@cloth,#7a5a3a|Hair+Man;Man+Time;Hair+Face
Mustache|🥸|soft,human,@cloth,#4a3a2a|Beard+Tiny;Hair+Mouth;Beard+Scissors
Mouth|👄|living,@orb,#e85a6a,%organic|Face+Food;Human+Food;Face+Hole
Arm|💪|living,human,@blob,#e8b090,%organic|Human+Hand;Hand+Muscle;Human+Stick
Leg|🦵|living,human,@blob,#e8b090,%organic|Human+Foot;Arm+Foot
Foot|🦶|living,human,@blob,#e8b090,%organic|Leg+Earth;Human+Earth
Body|🧍|living,human,@humanoid,#e8b090|Human+Muscle;Arm+Leg;Head+Arm+Leg
Neck|🦒|living,@blob,#e8b090,%organic|Head+Body;Giraffe+Human;Head+Stick
Back|🔙|living,@blob,#e8b090,%organic|Body+Wall;Human+Back+Wall;Body+Flat
Wrist|⌚|living,tiny,@blob,#e8b090,%organic|Hand+Arm;Arm+Ring;Hand+Bracelet
Toy|🧸|soft,emotion,@cube,#ff9a3a,%plastic|Child+Box;Plastic+Child;Baby+Gift;Child+Gift
Teddy Bear|🧸|soft,emotion,@creature,#c8803a|Bear+Toy;Bear+Cotton;Bear+Pillow;Toy+Bear
Doll|🪆|soft,emotion,@humanoid,#ffa8c8|Toy+Human;Human+Tiny+Toy;Toy+Princess
Ball|⚽|sport,round,@orb,#f8f8f8,%plastic|Rubber+Circle;Toy+Circle;Leather+Circle;Sport+Circle
Yo-yo|🪀|toy,@ring,#ff3a5a,%plastic|Toy+String;Disc+String;Wheel+String
Puzzle|🧩|knowledge,@cube,#3ac0e8,%paper|Toy+Knowledge;Paper+Mystery;Box+Riddle;Picture+Scissors
Dice|🎲|luck,@cube,#f8f8f8,%plastic|Cube+Luck;Square+Luck;Bone+Luck;Cube+Dot
Cube|🧊|abstract,@cube,#8aa8ff|Square+Square;Box+Abstract;Square+Pressure
Dot|⚫|abstract,tiny,@orb,#1a1a1a|Ink+Pencil;Ink+Pebble;Pencil+Pebble
Cards|🃏|paper,luck,@book,#f8f8f8,%paper|Paper+Luck;Paper+Game;Paper+Number
Chess|♟️|knowledge,sport,@cube,#2a2a2a,%wood|Game+Knowledge;King+Queen+Game;Board+King;Board+Knight
Board|⬛|wood,@cube,#c89a5a,%wood|Plank+Square;Wood+Flat;Plank+Grid
Game|🎲|emotion,sport,@abstract,#5ad08a|Toy+Rules;Fun+Rules;Dice+Dice;Toy+Child+Fun
`);
