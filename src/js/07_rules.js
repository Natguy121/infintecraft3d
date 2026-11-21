// ============================================================================
//  ELEMENTAL LAB — 07 · Layer B: tag-based recipe rules
//  Rules are written over TAGS, not item pairs, so thousands of combinations
//  resolve sensibly without being listed.  Each line:
//
//      tagA[&tagA2] | tagB[&tagB2] | outcome:weight, outcome:weight, ...
//
//  Outcomes:  Item Name        → that core item
//             mod:<id>@a|@b    → apply modifier <id> to the item on that side
//             comp             → named composite of both (head picked by type)
//             comp@a           → composite with side A as the adjective
//  "any" matches every item.  More specific rules (more tags) win; weaker
//  matches still contribute a little so results stay varied.
// ============================================================================

const RULE_TEXT = `
// ---- elemental physics
hot | wet | Steam:5, Hot Spring:2, Geyser:1, comp:2
hot | cold | Water:3, Steam:2, Mist:2, comp:1
hot | ice | Water:4, Puddle:2, Steam:2
fire | wood | Smoke:3, Charcoal:3, Ash:2, mod:burnt@b:4
fire | plant | Ash:3, Smoke:2, mod:burnt@b:4, Wildfire:2
fire | paper | Ash:4, mod:burnt@b:3, Smoke:1
fire | cloth | mod:burnt@b:3, Ash:2, Smoke:1
fire | animal | mod:cooked@b:4, mod:burnt@b:2, mod:burning@b:2, Dragon:1
fire | stone | Lava:3, Magma:1, mod:molten@b:3, comp:1
fire | metal | mod:molten@b:4, Forge:1, comp:1
hot | edible | mod:cooked@b:5, mod:burnt@b:1, mod:spicy@b:1
cold | edible | mod:frozen@b:4, Ice Cream:1
cold | living | mod:frozen@b:4, comp:1
cold | liquid | Ice:4, mod:frozen@b:3
cold | water | Ice:5, Snow:2, Frost:1
water | earth | Mud:3, Clay:2, Swamp:1, comp:2
water | stone | Sand:2, Pebble:2, comp:2, mod:soggy@b:1
water | metal | Rust:4, mod:rusty@b:4
water | plant | Tree:1, Flower:1, comp:2, mod:soggy@b:1, Algae:1
wet | dry | mod:soggy@b:3, Mud:1, comp:1
wet | paper | mod:soggy@b:4, comp:1
wet | electric | Spark:2, Explosion:1, mod:electric@a:3, comp:1
air | fire | Smoke:3, Energy:1, comp:2
air | liquid | Bubble:3, Mist:2, Foam:2
air | gas | Wind:3, Cloud:2, comp:1
air | earth | Dust:3, Sand:1, comp:2
earth | plant | Tree:2, Forest:1, Garden:2, comp:2
earth | human | Farmer:2, Miner:2, Golem:1, comp:2
light | water | Rainbow:3, Mirror:1, comp:1
light | dark | Shadow:3, Eclipse:2, Yin Yang:1, Evening:1
weather | weather | Storm:3, Hurricane:1, Tornado:1, Weather:2
weather | living | mod:soggy@b:2, Umbrella:1, comp:2
weather | building | Ruins:1, mod:frozen@b:1, comp:2

// ---- sky, sea & underground
sky | animal | Bird:2, mod:winged@b:4, comp:2
sky | building | Skyscraper:3, Tower:2, mod:winged@b:2, comp:3
sky | vehicle | Airplane:3, Hot Air Balloon:1, Rocket:1, mod:winged@b:3
sea | vehicle | Boat:3, Ship:2, Submarine:2, mod:aquatic@b:3
sea | animal | Fish:2, mod:aquatic@b:5, comp:2
sea | building | Atlantis:1, Aquarium:2, Lighthouse:2, mod:aquatic@b:3
sea | human | Sailor:3, Mermaid:2, Pirate:2, mod:aquatic@b:2
underground | building | Mine:2, Tunnel:2, comp:3
underground | human | Miner:3, Dwarf:2, comp:1

// ---- life
living | living | Family:1, Love:1, Egg:2, comp:4
animal | animal | comp:7, Egg:2
animal | human | Pet:2, Hunter:2, Farmer:1, comp:4
animal | plant | comp:3, Poop:1, mod:wild@a:2
animal | edible | Poop:2, Pet:1, comp:2, mod:giant@a:1
animal | magic | Unicorn:1, Dragon:1, Griffin:1, mod:enchanted@a:3, comp:2
animal | cold | Penguin:2, Polar Bear:2, Yeti:1, mod:frozen@a:3
animal | death | Skeleton:2, Bone:2, Fossil:2, mod:zombie@a:3
animal | huge | mod:giant@a:4, Monster:2
animal | tiny | mod:tiny@a:4, Insect:2
animal | mythical | comp:4, Dragon:1, mod:mythic@a:1
animal | machine | Robot Dog:1, mod:robotic@a:5, Cyborg:1
animal | building | Zoo:3, Barn:2, Farm:2, Nest:1
animal | tool | Hunter:1, Trap:2, comp:2
animal | weapon | mod:armored@a:2, Hunter:2, comp:2
human | tool | Builder:2, Carpenter:2, Engineer:1, comp:3
human | machine | Engineer:3, Cyborg:2, Pilot:1, mod:robotic@a:2
human | weapon | Warrior:3, Soldier:2, Hunter:2, Knight:1
human | metal | Blacksmith:3, Knight:1, Robot:1, comp:2
human | knowledge | Scientist:2, Teacher:2, Professor:1, mod:genius@a:4
human | magic | Wizard:3, Witch:2, mod:enchanted@a:3, Magician:1
human | music | Musician:3, Singer:2, mod:musical@a:3
human | money | Banker:2, Merchant:2, King:1, mod:golden@a:2
human | death | Ghost:3, Zombie:2, Skeleton:2, Corpse:1
human | holy | Angel:2, Priest:3, Monk:1, mod:holy@a:3
human | evil | Villain:3, Thief:2, Witch:1, mod:cursed@a:2
human | sport | Athlete:4, Champion:1, comp:2
human | cosmic | Astronaut:3, Alien:2, mod:cosmic@a:3
human | building | Builder:2, Family:1, comp:3
human | edible | Chef:3, Baker:1, comp:2
human | plant | Farmer:3, Gardener:3, Elf:1
human | fire | Firefighter:2, mod:burning@a:2, comp:2
human | cold | Snowman:2, mod:frozen@a:3
human | emotion | mod:jolly@a:2, mod:lovely@a:2, mod:sad@a:1, Friendship:1
plant | magic | Glowing Mushroom:1, Beanstalk:2, Treant:2, mod:enchanted@a:4
plant | poison | Toadstool:2, mod:toxic@a:4
plant | light | Flower:3, Sunflower:2, mod:radiant@a:2, Algae:1
plant | sweet | Fruit:3, Honey:1, comp:2
living | poison | Death:2, mod:toxic@a:3, mod:zombie@a:2, Disease:1
living | electric | Frankenstein's Monster:1, mod:electric@a:4
living | time | mod:ancient@a:3, mod:elder@a:2, Fossil:2, Death:1
living | cosmic | Alien:3, mod:cosmic@a:3
living | digital | mod:cyber@a:3, mod:pixel@a:2, Android:1
living | music | Dance:2, Song:2, mod:musical@a:3
living | emotion | Love:2, Heart:2, mod:jolly@a:2, mod:lovely@a:2
living | medicine | Health:3, Cure:2, Healing:1
living | stone | Fossil:3, Golem:2, mod:petrified@a:3

// ---- matter & tools
metal | metal | Alloy:4, Machine:2, Chain:1
metal | electric | Magnet:3, Circuit:3, Electricity:2, mod:magnetic@a:2
metal | tool | Hammer:1, Wrench:2, Machine:2, Sword:1, comp:2
metal | sharp | Sword:3, Knife:3, Blade:2, Spike:1
metal | living | Robot:3, Cyborg:2, mod:robotic@b:3
metal | wood | Axe:2, Hammer:2, Tool:2, comp:2
metal | stone | Ore:2, Anvil:2, Iron:2
metal | money | Coin:3, Gold:2, Treasure:1, mod:golden@a:2
stone | stone | Boulder:2, Wall:2, Mountain:1, Pressure:1
stone | tool | Hammer:2, Statue:2, Pickaxe:2
stone | wood | Axe:2, Hammer:1, Tool:2
stone | human | Statue:3, Caveman:2, mod:petrified@b:2
wood | tool | Plank:3, Chair:2, Table:2, Sawdust:1
wood | wood | Log:2, Cabin:1, Furniture:2
wood | sharp | Arrow:2, Spear:2, Sharp Stick:2
wood | water | Boat:3, Raft:3
glass | liquid | Bottle:3, Potion:2, Jar:2
glass | light | Prism:2, Lens:2, Lantern:2, Rainbow:1
glass | electric | Lightbulb:3, Screen:2
crystal | magic | Crystal Ball:2, Philosopher's Stone:1, comp:2
crystal | light | Prism:3, Rainbow:2, mod:radiant@a:2
cloth | cloth | Clothes:3, Blanket:2
cloth | human | Clothes:3, Dress:1, Shirt:1, comp:1
cloth | magic | Magic Carpet:2, Invisibility Cloak:2, Cape:1
paper | knowledge | Book:4, Map:2, Letter:2, Scroll:1
paper | magic | Spellbook:3, Scroll:2, Origami:1
explosive | fire | Explosion:6, Firework:2
explosive | sky | Firework:5, Explosion:2
explosive | building | Ruins:4, Explosion:2
explosive | stone | Gravel:3, Explosion:2
tool | tool | Machine:3, comp:2
tool | machine | Robot:2, Factory:2, Engine:1, comp:2
tool | edible | Kitchen:2, Chef:1, comp:2
tool | plant | Farmer:2, Garden:2, Rake:1, Plow:1
machine | machine | Factory:3, Robot:2, Computer:1, comp:2
machine | electric | Robot:2, Computer:2, Generator:2, mod:electric@a:2
machine | fire | Engine:3, Rocket:1, Furnace:2, Steam Engine:1
machine | water | Water Wheel:2, Steam Engine:1, Submarine:1, Boiler:1
machine | air | Fan:3, Airplane:2, Helicopter:1, Turbine:2
machine | digital | Computer:3, Robot:2, AI:1, mod:cyber@a:2
machine | living | Robot:3, Cyborg:3, mod:robotic@b:4
machine | knowledge | AI:3, Computer:3, Calculator:2
machine | time | Clock:3, Time Machine:1, Clockwork:2
machine | cosmic | Satellite:3, Rocket:2, Spaceship:2
machine | vehicle | Engine:2, comp:3
vehicle | vehicle | Train:2, comp:5
vehicle | fire | Rocket:2, Race Car:1, mod:burning@a:2
vehicle | fast | Race Car:3, Bullet Train:1, Rocket:1, comp:2
vehicle | cosmic | Spaceship:3, Rocket:3, UFO:2
vehicle | water | Boat:3, mod:aquatic@a:2
vehicle | animal | Wagon:2, Chariot:2, comp:3
vehicle | money | Yacht:2, comp:3, mod:golden@a:2
vehicle | weapon | Tank:4, comp:2, mod:armored@a:3

// ---- buildings
building | building | City:2, Town:2, Village:2, Castle:1, comp:2
building | money | Bank:3, Palace:2, Shop:2
building | knowledge | School:3, Library:3, Museum:2, Laboratory:1
building | holy | Church:3, Temple:3
building | evil | Haunted House:3, Prison:2
building | death | Tomb:3, Graveyard:2, Haunted House:2
building | edible | Restaurant:3, Kitchen:2, Shop:1
building | ancient | Ruins:4, Pyramid:1, Temple:1, mod:ancient@a:3
building | water | Fountain:2, Pool:2, Dam:1, Harbor:2, mod:aquatic@a:1
building | fire | Fireplace:2, Ruins:2, Furnace:2, mod:burning@a:2
building | plant | Garden:3, Treehouse:2, Park:2
building | cosmic | Space Station:3, Observatory:3, Moon Base:2
building | machine | Factory:4, Smart Home:1
building | sport | Stadium:3, Gym:3, Arena:2
building | music | Theater:2, Concert:2, mod:musical@a:2
building | cold | Igloo:3, mod:frozen@a:3
building | huge | Skyscraper:3, Castle:2, mod:giant@a:2
building | tiny | mod:tiny@a:4, comp:2

// ---- food
edible | edible | Feast:2, Food:1, comp:7
edible | sweet | Cake:2, Candy:2, mod:candy@a:3, comp:2
edible | liquid | Soup:3, Juice:2, Smoothie:2
edible | poison | mod:toxic@a:4, Garbage:2
edible | magic | mod:enchanted@a:4, Potion:2, Fortune Cookie:1
edible | machine | Toaster:2, Blender:2, Microwave:1, mod:robotic@a:1
edible | time | mod:ancient@a:2, Garbage:2, Cheese:1, Wine:1
sweet | sweet | Candy:3, Cake:2, mod:candy@a:3
liquid | liquid | comp:3, Potion:1, Smoothie:1, Water:1
liquid | magic | Potion:4, Elixir:1
liquid | poison | Acid:2, Venom:1, mod:toxic@a:3

// ---- energy, cosmos & magic
energy | energy | Power:3, Explosion:2, Lightning:1
electric | electric | Lightning:2, Power:2, comp:1
electric | water | comp:2, mod:electric@b:3
light | living | mod:radiant@b:3, Firefly:1, Angel:1
dark | living | mod:shadow@b:3, Ghost:1, Bat:1, Vampire:1
dark | building | Haunted House:3, Cave:1, mod:shadow@b:2
cosmic | cosmic | Galaxy:2, Universe:1, Nebula:2, comp:3
cosmic | living | Alien:4, mod:cosmic@b:3
cosmic | stone | Meteor:3, Asteroid:2, Moon Rock:2
cosmic | fire | Star:3, Sun:2, Supernova:1, Comet:1
cosmic | water | Comet:2, Nebula:1, comp:2
cosmic | time | Eternity:1, Wormhole:2, Black Hole:1
cosmic | magic | Destiny:1, Zodiac:2, Stardust:2, mod:cosmic@b:2
magic | magic | Spell:2, Wizard:1, Miracle:1, comp:2
magic | evil | Curse:4, Hex:2, Witch:2, Demon:1
magic | holy | Miracle:3, Blessing:3, Angel:1
magic | stone | Crystal:2, Golem:2, Philosopher's Stone:1, Lodestone:1
magic | tool | Wand:4, Scepter:2, mod:enchanted@b:4
magic | weapon | Excalibur:1, Trident:1, mod:enchanted@b:5
magic | knowledge | Spellbook:3, Spell:2, Alchemy:2
magic | time | Time Machine:1, Fate:2, Destiny:1
magic | death | Necromancer:2, Ghost:2, Zombie:2, Curse:1
mythical | mythical | comp:5, Legend:2, Myth:2
holy | evil | Yin Yang:2, Balance:2, Chaos:1, comp:1
holy | living | Angel:3, mod:holy@b:3, Soul:1
evil | living | Demon:2, Monster:3, mod:cursed@b:2, Villain:1
death | death | Underworld:2, Grim Reaper:1, Graveyard:2
death | time | Fossil:3, Ghost:1, Skeleton:2
death | holy | Heaven:3, Soul:2, Angel:2
death | evil | Hell:2, Underworld:2, Reaper:1
time | time | Eternity:1, Future:2, Past:2, History:1
time | knowledge | History:3, Wisdom:3, Past:1
time | stone | Fossil:3, mod:ancient@b:3
time | building | Ruins:4, mod:ancient@b:2
time | metal | Rust:3, mod:rusty@b:3, Clock:1
abstract | abstract | Philosophy:2, Idea:2, Chaos:1, comp:3
emotion | emotion | Love:2, Joy:1, Sadness:1, Emotion:2, comp:2
emotion | music | Song:3, Lullaby:1, Opera:1, Dance:2
knowledge | knowledge | Library:2, Science:2, Wisdom:2, Book:1
knowledge | digital | Data:3, AI:2, Internet:1, Website:1
digital | digital | Internet:2, Glitch:2, Cyberspace:1, comp:2
music | music | Song:2, Orchestra:2, Band:2, Concert:1
music | machine | Synthesizer:3, Radio:2, Speaker:2
music | holy | Choir:3, Harp:2
sport | sport | Olympics:2, comp:3
money | money | Treasure:2, Bank:2, Fortune:1, Gold:1
money | magic | Luck:2, Fortune:2, Leprechaun:1
weapon | weapon | Army:2, War:2, comp:3
weapon | fire | Gun:2, Cannon:2, mod:burning@a:3
weapon | cold | Freeze Ray:1, mod:frozen@a:3
weapon | electric | Laser Gun:2, mod:electric@a:3
weapon | light | Laser Sword:2, Laser:2, mod:radiant@a:2
huge | tiny | Scale:2, comp:2
fast | fast | Speed:3, Race:2, Lightning:1
soft | soft | Pillow:3, Cloud:2, Cotton:1
hard | hard | Diamond:1, Pressure:2, Wall:2

// ---- single-tag fallbacks: something X + anything
fire | any | mod:burning@b:4, Ash:1, comp:2
cold | any | mod:frozen@b:4, comp:1
ice | any | mod:frozen@b:4, comp:1
magic | any | mod:enchanted@b:4, comp:2
electric | any | mod:electric@b:3, comp:2
cosmic | any | mod:cosmic@b:3, comp:3
holy | any | mod:holy@b:3, comp:2
evil | any | mod:cursed@b:3, comp:2
death | any | mod:zombie@b:2, mod:haunted@b:2, comp:2
time | any | mod:ancient@b:3, comp:2
tiny | any | mod:tiny@b:2, comp:3
huge | any | mod:giant@b:2, comp:3
poison | any | mod:toxic@b:3, comp:2
digital | any | mod:pixel@b:2, mod:glitched@b:1, comp:2
money | any | mod:golden@b:2, comp:3
music | any | mod:musical@b:3, comp:2
emotion | any | mod:jolly@b:1, mod:lovely@b:1, mod:sad@b:1, comp:3
light | any | mod:radiant@b:2, comp:3
dark | any | mod:shadow@b:2, comp:3
sticky | any | mod:sticky@b:3, comp:2
soft | any | mod:fluffy@b:1, comp:3
sharp | any | mod:spiky@b:2, comp:3
machine | any | mod:robotic@b:2, comp:3
metal | any | mod:magnetic@b:1, comp:3
sea | any | mod:aquatic@b:2, comp:3
flying | any | mod:winged@b:2, comp:3
explosive | any | Explosion:4, mod:explosive@b:3
edible | any | comp:4
weapon | any | mod:armored@b:1, mod:ninja@b:1, comp:3
vehicle | any | comp:4
building | any | comp:4
human | any | comp:3
mythical | any | comp:3, mod:mythic@b:1
plant | any | comp:3, mod:wild@b:1
animal | any | comp:4
any | any | comp:6
`;

// High-tier fusions: a chance of legendary results.
const LEGENDARY_POOL = [
  ['Philosopher\'s Stone', 2], ['Excalibur', 2], ['Grail', 2], ['Elixir of Life', 2], ['Phoenix', 2],
  ['Leviathan', 1], ['Destiny', 2], ['Miracle', 2], ['Tree of Life', 1], ['Immortality', 1], ['Eternity', 1],
  ['Infinity', 1], ['God', 1], ['Singularity', 1], ['Creation', 1], ['Omniverse', 1], ['World Tree', 1],
  ['mod:divine@a', 3], ['mod:mythic@a', 3], ['mod:eternal@a', 3], ['mod:divine@b', 3], ['mod:mythic@b', 3], ['mod:eternal@b', 3],
];

// Multi-input secret-ish fusions for the Fusion Ring (3+ items, any order).
const MULTI_TEXT = `
Air+Earth+Fire+Water = Planet Earth
Air+Earth+Fire+Water+Life = Creation
Fire+Water+Earth = Life
Sun+Moon+Star = Universe
Human+Magic+Time = Wizard
Human+Fire+Ice = Balance
Metal+Wood+Fire = Forge
Gold+Gold+Gold = Treasure
Light+Darkness+Human = Yin Yang
Love+Love+Love = Heart
Egg+Egg+Egg = Nest
Seed+Seed+Seed = Garden
Star+Star+Star = Constellation
Brain+Brain+Brain = Genius
Dragon+Fire+Gold = King Midas
Rainbow+Cloud+Horse = Pegasus
Time+Time+Time = Eternity
Universe+Universe+Universe = Multiverse
Robot+Robot+Robot = Army
Music+Music+Music = Orchestra
`;
