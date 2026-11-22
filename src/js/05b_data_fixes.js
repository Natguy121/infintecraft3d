// ============================================================================
//  ELEMENTAL LAB — 05b · Common-sense recipes
//  These pairs WIN over everything else (authored lists, substitution,
//  modifiers and tag rules), so the obvious combos always do the obvious
//  thing: Life + Tree = Bird, Monster + Ice = Yeti, Fire + Snow = Water…
//  Format:  A + B = Result      (Result may be a modified id like fish~cooked)
// ============================================================================

CORE_DATA.push(`
Ice Skater|⛸️|human,sport,cold,@humanoid,#7ac8f0|Human+Ice;Skater+Ice
Husky|🐕|animal,cold,furry,@creature,#9aa4b4|Dog+Snow;Dog+Ice;Wolf+Snow
Venus Flytrap|🪴|plant,sharp,@plant,#5aa83a|Plant+Monster;Plant+Fly;Plant+Insect
Sandworm|🪱|animal,mythical,huge,dry,@snake,#c8a060,!rare|Worm+Desert;Monster+Sand;Worm+Huge+Sand
Monster Truck|🛻|vehicle,machine,metal,huge,@vehicle,#3aa84a|Car+Monster;Truck+Monster;Car+Giant
Scarecrow|🧍|plant,dark,@humanoid,#c8a050|Hay+Human;Hay+Life;Straw+Human
Flying Fish|🐟|animal,sea,flying,@fish,#5ab8e8|Fish+Air;Fish+Wing;Fish+Bird
Wyvern|🐉|animal,mythical,flying,@creature,#5a7a3a,!rare|Dragon+Air;Dragon+Wind;Lizard+Wing
`);

const FIX_RECIPES = `
// ---- Life brings things to life
Life + Tree = Bird
Life + Fire = Phoenix
Life + Ice = Penguin
Life + Snow = Snowman
Life + Plant = Tree
Life + Stone = Golem
Life + Sky = Bird
Life + Sun = Flower
Life + Moon = Owl
Life + Rain = Frog
Life + Human = Baby
Life + Animal = Baby
Life + Monster = Zombie
Life + Dog = Puppy
Life + Cat = Kitten
Life + Bird = Nest
Life + Fish = Frog
Life + Sand = Worm
Life + Mountain = Goat
Life + Electricity = Frankenstein's Monster
Life + Love = Baby
Life + House = Family
Life + Dragon = Dragon Egg
Life + Cloud = Angel
Life + Life = Family
Life + Egg = Chicken
Life + Death = Ghost
Life + Hay = Scarecrow
// ---- Water
Water + Monster = Kraken
Water + Dragon = Sea Serpent
Water + Cat = cat~soggy
Water + Dog = dog~soggy
Water + Snow = Ice
Water + Ice = Iceberg
Water + Tree = Sap
Water + Forest = Swamp
Water + Sun = Rainbow
Water + Earth = Mud
// ---- Fire
Fire + Snow = Water
Fire + Ice = Water
Fire + Human = Firefighter
Fire + Monster = Demon
Fire + Dog = Hot Dog
Fire + Fish = fish~cooked
Fire + Egg = Omelette
Fire + Plant = Ash
Fire + Love = Heart
Fire + Life = Phoenix
Fire + Steam = Engine
Steam + Coal = Steam Engine
Steam + Engine = Locomotive
// ---- Earth
Earth + Ice = Tundra
Earth + Snow = Tundra
Earth + Human = Farmer
Earth + Animal = Mole
Earth + Monster = Golem
Earth + Bird = Ostrich
Earth + Fish = Fossil
Earth + House = Village
Earth + Dragon = Dinosaur
Earth + Dog = Bone
Earth + Moon = Eclipse
Earth + Earth = Mountain
// ---- Air
Air + Tree = Leaf
Air + Plant = Seed
Air + Ice = Snow
Air + Snow = Blizzard
Air + Human = Pilot
Air + Monster = Ghost
Air + Fish = Flying Fish
Air + Car = Airplane
Air + House = Windmill
Air + Dragon = Wyvern
Air + Dog = Kite
Air + Forest = Leaf
// ---- Ice & Snow
Ice + Monster = Yeti
Ice + Human = Ice Skater
Ice + Animal = Polar Bear
Ice + Dog = Husky
Ice + Cat = Snow Leopard
Ice + Tree = Pine Tree
Ice + Sky = Hail
Ice + Sun = Water
Ice + Snow = Glacier
Ice + Life = Penguin
Ice + Air = Snow
Ice + Earth = Tundra
Snow + Human = Snowman
Snow + Snow = Snowman
Snow + Animal = Polar Bear
Snow + Dog = Husky
Snow + Cat = Snow Leopard
Snow + Sun = Water
Snow + Sky = Blizzard
Snow + Fire = Water
// ---- Monsters
Monster + Stone = Gargoyle
Monster + Moon = Werewolf
Monster + Dog = Cerberus
Monster + Bird = Griffin
Monster + Fish = Shark
Monster + Ocean = Kraken
Monster + Sand = Sandworm
Monster + Metal = Robot
Monster + Mountain = Troll
Monster + House = Haunted House
Monster + Car = Monster Truck
Monster + Plant = Venus Flytrap
Monster + Sky = Dragon
Monster + Egg = Dragon
Monster + Animal = Werewolf
Monster + Tree = Treant
Monster + Snow = Yeti
// ---- People & animals
Human + Fire = Firefighter
Human + Life = Baby
Human + Cloud = Angel
Human + Rain = Umbrella
Human + Dog = Pet
Human + Cat = Pet
Human + Sky = Pilot
Human + Air = Pilot
Human + Dragon = Knight
Human + Sand = Sandcastle
Human + Earth = Farmer
Human + Ice = Ice Skater
Human + Snow = Snowman
Dog + Cat = Pet
Animal + Earth = Mole
Animal + Sun = Lizard
Animal + Rain = Frog
Animal + Egg = Chicken
Animal + Sand = Camel
Animal + Cat = Lion
Animal + Plant = Cow
Animal + Life = Baby
Animal + Monster = Werewolf
Tree + Magic = Treant
Animal + Dog = Wolf
Animal + Bird = Eagle
Animal + Dragon = Dinosaur
Animal + Fish = Shark
Monster + Cat = Tiger
Monster + Dragon = Hydra
Monster + Rain = Storm
Monster + Cloud = Storm
Air + Bird = Feather
Air + Moon = Space
Earth + Cat = Lion
Life + Car = Robot
Life + Wood = Tree
`;
