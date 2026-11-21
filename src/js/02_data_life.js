// ============================================================================
//  ELEMENTAL LAB — 02 · Core item data: life, plants, animals, food
// ============================================================================

CORE_DATA.push(`
// ---------------- the spark of life ----------------
Primordial Soup|🍲|water,liquid,sea,energy,@liquid,#6b8f3a|Ocean+Mud;Swamp+Water;Sea+Mud
Life|🧬|living,energy,abstract,@abstract,#7dff9a|Primordial Soup+Energy;Primordial Soup+Lightning;Ocean+Lightning;Swamp+Energy;Swamp+Lightning
Bacteria|🦠|living,tiny,@blob,#9be36b,%organic|Life+Swamp;Life+Mud;Life+Water
Cell|🫧|living,tiny,@orb,#9cf0b8,%organic|Life+Bubble;Bacteria+Bubble
DNA|🧬|living,knowledge,tiny,@abstract,#5ce0ff|Life+Knowledge;Cell+Scientist;Life+Code
Virus|🦠|living,tiny,poison,death,@spike,#c04de0,%organic|Bacteria+Poison;Bacteria+Darkness;Cell+Poison
Egg|🥚|living,edible,@egg,#f6e7c8,%organic|Life+Stone;Life+Sand;Bird+Bird
Animal|🐾|animal,@creature,#c79a6b|Life+Egg;Egg+Earth;Bacteria+Time
Plant|🌱|plant,@plant,#3fb34f|Earth+Rain;Life+Earth;Mud+Rain
Seed|🌰|plant,tiny,edible,@egg,#a6763b|Plant+Sand;Fruit+Earth
Sprout|🌱|plant,tiny,@plant,#6ed36e|Seed+Water;Seed+Rain;Seed+Earth
Grass|🌿|plant,soft,@plant,#5cc95c|Plant+Earth;Sprout+Earth
Bush|🌳|plant,@plant,#3f9a48|Grass+Plant;Grass+Grass
Field|🟩|earth,plant,huge,@landform,#7cc46a|Grass+Earth;Grass+Land
Tree|🌳|plant,wood,huge,@tree,#2f9e44|Plant+Time;Plant+Plant;Seed+Time;Sprout+Time
Forest|🌲|plant,wood,huge,@landform,#2b8a3e|Tree+Tree;Tree+Grass
Jungle|🌴|plant,hot,wet,huge,@landform,#1f8a3c|Forest+Rain;Forest+Swamp;Tree+Swamp
Wilderness|🏕️|plant,huge,@landform,#4f8f3a|Forest+Animal;Forest+Wolf;Jungle+Land
Savanna|🦒|plant,dry,hot,huge,@landform,#c7b25a|Grass+Desert;Field+Sun;Grass+Heat
Safari|🦓|plant,animal,@landform,#c9a55a|Savanna+Car;Savanna+Human;Savanna+Lion
Pine Tree|🌲|plant,wood,cold,@tree,#1f6b3a|Tree+Snow;Tree+Mountain;Tree+Cold
Palm Tree|🌴|plant,wood,hot,@tree,#3aa14a|Tree+Beach;Tree+Island
Dead Tree|🪵|plant,wood,death,dry,@tree,#6b5640|Tree+Death;Tree+Desert+Time;Tree+Drought
Bonsai|🌳|plant,tiny,wood,@tree,#3d8f4f|Tree+Tiny;Tree+Pot;Tree+Scissors
Christmas Tree|🎄|plant,holy,light,@tree,#1f7a3a|Pine Tree+Gift;Pine Tree+Santa;Pine Tree+Star
Leaf|🍃|plant,tiny,soft,@plant,#56c45a|Tree+Wind;Plant+Wind
Stick|🪵|wood,tiny,@tool,#8a5a2b|Tree+Wind+Wind;Leaf+Wood;Tree+Storm
Wood|🪵|wood,hard,@cube,#9b6b3d|Stick+Stick;Tree+Axe;Tree+Saw
Log|🪵|wood,hard,@cube,#7a4f2a|Tree+Lumberjack;Wood+Wood;Tree+Beaver
Plank|🪵|wood,hard,building,@cube,#c08a52|Wood+Saw;Log+Saw;Wood+Carpenter
Sawdust|🟫|wood,tiny,dry,@gas,#d7b27a|Wood+Saw+Wind;Plank+Saw;Wood+Sandpaper
Root|🫚|plant,underground,@plant,#a07850|Tree+Earth;Plant+Cave
Flower|🌸|plant,soft,sweet,@plant,#ff7eb6|Plant+Sun;Plant+Rainbow;Grass+Sun
Rose|🌹|plant,emotion,soft,@plant,#e0245e|Flower+Love;Flower+Thorn;Flower+Blood
Sunflower|🌻|plant,light,@plant,#ffcc00|Flower+Sun;Flower+Summer
Tulip|🌷|plant,@plant,#ff5c8a|Flower+Windmill;Flower+Spring
Lotus|🪷|plant,holy,water,@plant,#ffb3d1|Flower+Pond;Flower+Lake
Lily|🌺|plant,@plant,#ffe3f0|Flower+Pond+Sun;Flower+Water
Orchid|🌺|plant,@plant,#d05cff|Flower+Jungle;Flower+Swamp
Clover|☘️|plant,tiny,@plant,#3fc45a|Grass+Luck;Grass+Rain;Grass+Sun+Rain
Four-Leaf Clover|🍀|plant,magic,tiny,@plant,#28c74a,!rare|Clover+Luck;Clover+Magic;Clover+Rainbow
Cactus|🌵|plant,sharp,dry,hot,@plant,#4c9a3a|Plant+Desert;Grass+Desert;Tree+Desert
Thorn|🥀|plant,sharp,tiny,@spike,#5a7a3a|Cactus+Plant;Rose+Sword;Bush+Sharp Stick
Moss|🌿|plant,soft,wet,tiny,@blob,#5f8f3a,%organic|Stone+Plant;Stone+Algae
Algae|🟢|plant,water,wet,sea,@blob,#3e8f4a,%organic|Plant+Water;Plant+Ocean;Bacteria+Sun
Seaweed|🌿|plant,sea,wet,@plant,#2d7a46|Algae+Ocean;Algae+Sea;Plant+Sea
Kelp Forest|🌿|plant,sea,huge,@landform,#2a6b3f|Seaweed+Forest;Seaweed+Seaweed
Mushroom|🍄|plant,edible,soft,@mushroom,#d9472b|Plant+Cave;Swamp+Plant;Moss+Darkness
Toadstool|🍄|plant,poison,@mushroom,#e03a3a|Mushroom+Poison;Mushroom+Frog
Glowing Mushroom|🍄|plant,light,magic,@mushroom,#5cf0ff|Mushroom+Light;Mushroom+Magic
Vine|🌿|plant,sticky,@plant,#3f8f3a|Plant+Tree;Grass+Tree
Beanstalk|🌱|plant,huge,magic,sky,@tree,#47c04a|Bean+Magic;Vine+Cloud;Vine+Sky
Ivy|🌿|plant,@plant,#2f7a3a|Vine+Wall;Vine+House
Hay|🌾|plant,dry,@cube,#e6c35c|Grass+Sun+Wind;Grass+Wind;Grass+Desert
Wheat|🌾|plant,edible,@plant,#e2b84a|Grass+Farmer;Seed+Field;Grass+Field
Corn|🌽|plant,edible,@food,#f6cf3a|Field+Sun;Seed+Farmer
Rice|🍚|plant,edible,tiny,@bowl,#f5f1e6|Wheat+Water;Wheat+Swamp
Bamboo|🎋|plant,wood,@plant,#7ec850|Grass+Wood;Grass+Panda;Grass+Tree+Rain
Garden|🏡|plant,building,@landform,#69c26a|Plant+House;Flower+Field
Vegetable|🥬|plant,edible,@food,#5ec45a|Plant+Field;Plant+Garden
Carrot|🥕|plant,edible,@food,#ff8a1f|Vegetable+Rabbit;Plant+Rabbit;Vegetable+Earth+Sun
Potato|🥔|plant,edible,@rock,#c8a060,%food|Vegetable+Earth;Vegetable+Mud
Tomato|🍅|plant,edible,@fruit,#e8392f|Fruit+Vegetable;Vegetable+Sun
Onion|🧅|plant,edible,@fruit,#e3c0a0|Vegetable+Tears
Garlic|🧄|plant,edible,@fruit,#f2ead8|Vegetable+Vampire;Onion+Vampire
Lettuce|🥬|plant,edible,soft,@plant,#8fdc6a|Vegetable+Leaf;Leaf+Garden
Broccoli|🥦|plant,edible,@tree,#3fa04a|Vegetable+Tree;Tree+Tiny+Vegetable
Pumpkin|🎃|plant,edible,@fruit,#ff8a1a|Fruit+Autumn;Vegetable+Autumn
Eggplant|🍆|plant,edible,@fruit,#6b2f8a|Vegetable+Egg;Egg+Plant
Cucumber|🥒|plant,edible,cold,@food,#4caf50|Vegetable+Cold;Vegetable+Ice
Chili|🌶️|plant,edible,hot,@food,#e2231a|Vegetable+Fire;Pepper+Fire
Pepper|🫑|plant,edible,@fruit,#3fae3a|Vegetable+Salt;Chili+Water
Wasabi|🟢|plant,edible,hot,@blob,#8fcf4a,%food|Vegetable+Japan;Chili+Fish;Mint+Chili
Mint|🌿|cold,plant,@plant,#4fe0a0|Plant+Cold;Grass+Ice
Herb|🌿|plant,medicine,@plant,#5fbf5a|Grass+Garden;Mint+Plant
Spice|🌶️|edible,hot,dry,@blob,#c46a2a,%food|Herb+Fire;Pepper+Sun;Herb+Desert
Bean|🫘|plant,edible,tiny,@egg,#8a4a2a|Seed+Vegetable;Seed+Pod
Pod|🫛|plant,edible,@food,#7fcf4a|Plant+Seed+Seed;Seed+Seed
Cocoa|🫘|plant,edible,@egg,#5a3220|Bean+Jungle;Bean+Brown
Coffee Bean|🫘|plant,edible,energy,@egg,#4a2a1a|Bean+Fire;Bean+Energy
Fruit|🍎|plant,edible,sweet,@fruit,#e83b3b|Tree+Flower;Flower+Time
Apple|🍎|plant,edible,sweet,@fruit,#e0302f|Fruit+Tree;Tree+Gravity
Banana|🍌|plant,edible,sweet,@food,#ffe135|Fruit+Monkey;Fruit+Jungle
Orange|🍊|plant,edible,sweet,@fruit,#ff9a1f|Fruit+Sun;Fruit+Summer
Lemon|🍋|plant,edible,@fruit,#fff04a|Fruit+Acid;Orange+Cold
Grape|🍇|plant,edible,sweet,@fruit,#7b3fa0|Fruit+Vine
Strawberry|🍓|plant,edible,sweet,@fruit,#ff3352|Fruit+Bush;Fruit+Grass
Cherry|🍒|plant,edible,sweet,@fruit,#d0103a|Fruit+Flower;Tree+Blossom
Blossom|🌸|plant,soft,@plant,#ffc0d9|Tree+Spring;Flower+Cherry
Watermelon|🍉|plant,edible,wet,huge,@fruit,#3aa14a|Fruit+Water;Fruit+Lake
Pineapple|🍍|plant,edible,sharp,sweet,@fruit,#f5c330|Fruit+Cactus;Fruit+Beach
Coconut|🥥|plant,edible,hard,@fruit,#7a5230|Fruit+Palm Tree;Fruit+Island
Peach|🍑|plant,edible,sweet,soft,@fruit,#ffb38a|Fruit+Blossom;Fruit+Soft
Avocado|🥑|plant,edible,@fruit,#5a8f2a|Fruit+Vegetable+Tree;Fruit+Stone
Olive|🫒|plant,edible,tiny,@fruit,#6b7a2a|Fruit+Oil;Tree+Greece
Berry|🫐|plant,edible,tiny,sweet,@fruit,#4a5cd0|Fruit+Bush+Tiny;Bush+Fruit+Sun;Bush+Sun
Mango|🥭|plant,edible,sweet,@fruit,#ffb52e|Fruit+India;Fruit+Jungle+Sun
Kiwi|🥝|plant,edible,@fruit,#7ab83a|Fruit+Bird;Fruit+New Zealand
Juice|🧃|liquid,edible,sweet,@drink,#ffa63a|Fruit+Pressure;Fruit+Blender
Sugar|🍬|sweet,tiny,edible,@cube,#fdfdfd,%food|Fruit+Sand;Juice+Sun;Juice+Fire
Honey|🍯|sweet,sticky,liquid,edible,@potion,#f2a91a|Bee+Flower;Bee+Beehive
Syrup|🍁|sweet,sticky,liquid,edible,@potion,#b5651d|Tree+Sugar;Sugar+Water;Maple+Heat
Maple|🍁|plant,wood,@tree,#d9481a|Tree+Autumn;Tree+Canada

// ---------------- creatures ----------------
Worm|🪱|animal,tiny,soft,underground,@snake,#e08a8a|Animal+Soil;Life+Soil;Snake+Tiny
Snail|🐌|animal,tiny,slow,soft,@creature,#c8a060|Worm+Shell;Slime+Shell
Shell|🐚|sea,hard,@egg,#f4dcc8|Sea+Stone+Animal;Egg+Sea;Egg+Sand
Insect|🐛|animal,tiny,@insect,#7a9a3a|Animal+Leaf;Worm+Leaf;Worm+Air
Bug|🐞|animal,tiny,@insect,#e0302f|Insect+Dot;Insect+Red;Insect+Grass
Ant|🐜|animal,tiny,@insect,#3a2a2a|Insect+Soil;Insect+Sand;Insect+Hill
Bee|🐝|animal,tiny,flying,@insect,#f6c21a|Insect+Flower;Insect+Honey
Beehive|🍯|animal,building,sweet,@building,#e8a830|Bee+House;Bee+Tree;Bee+Bee
Butterfly|🦋|animal,flying,tiny,@insect,#6ab0ff|Insect+Flower+Rainbow;Caterpillar+Time;Insect+Rainbow
Caterpillar|🐛|animal,tiny,soft,@snake,#7ad13b|Insect+Leaf;Worm+Leaf+Grass;Worm+Grass
Moth|🦋|animal,flying,tiny,dark,@insect,#a89c8a|Butterfly+Night;Insect+Lamp
Firefly|✨|animal,flying,tiny,light,@insect,#e6ff5c|Insect+Light;Bug+Light;Insect+Fire
Spider|🕷️|animal,tiny,poison,@insect,#2a2a2a|Insect+Web;Ant+Poison;Insect+Thread
Web|🕸️|sticky,cloth,@cloth,#f2f2f2|Spider+Thread;Thread+Thread+Sticky;Spider+Silk
Scorpion|🦂|animal,poison,sharp,hot,@insect,#8a5a2a|Spider+Desert;Insect+Desert;Spider+Sand
Mosquito|🦟|animal,tiny,flying,@insect,#5a4a3a|Insect+Swamp;Insect+Blood
Fly|🪰|animal,tiny,flying,@insect,#3a3f4a|Insect+Poop;Insect+Air
Dragonfly|🪰|animal,tiny,flying,fast,@insect,#4ad0e0|Fly+Dragon;Insect+Pond
Grasshopper|🦗|animal,tiny,@insect,#6ac43a|Insect+Field;Insect+Jump
Beetle|🪲|animal,tiny,hard,@insect,#2f5a3a|Insect+Stone;Insect+Armor
Ladybug|🐞|animal,tiny,@insect,#ff2a2a|Bug+Flower;Beetle+Love
Cockroach|🪳|animal,tiny,dirty,@insect,#6b3a1a|Insect+City;Insect+Garbage;Bug+Kitchen
Fish|🐟|animal,sea,water,@fish,#5aa0d8|Life+Ocean;Animal+Water;Egg+Sea+Life;Animal+Sea
Goldfish|🐠|animal,sea,tiny,@fish,#ffa31a|Fish+Gold;Fish+Bowl;Fish+Aquarium
Tropical Fish|🐠|animal,sea,@fish,#ffcf3a|Fish+Coral;Fish+Coral Reef;Fish+Rainbow
Pufferfish|🐡|animal,sea,poison,@fish,#e8d06a|Fish+Balloon;Fish+Poison;Fish+Spike
Shark|🦈|animal,sea,sharp,huge,fast,@fish,#7d93a8|Fish+Sword;Fish+Teeth;Fish+Blood
Whale|🐋|animal,sea,huge,@fish,#3a6aa8|Fish+Huge;Fish+Ocean;Animal+Ocean
Dolphin|🐬|animal,sea,fast,knowledge,@fish,#6aa8d8|Whale+Knowledge;Fish+Knowledge;Whale+Tiny
Orca|🐋|animal,sea,huge,@fish,#1a1a1a|Whale+Shark;Whale+Darkness
Octopus|🐙|animal,sea,soft,@blob,#e0507a,%organic|Fish+Eight;Fish+Ink;Squid+Shell
Squid|🦑|animal,sea,soft,@blob,#f08a8a,%organic|Fish+Ink;Octopus+Spear;Fish+Rope
Jellyfish|🪼|animal,sea,soft,poison,@blob,#d0a8ff,%organic|Fish+Jelly;Bubble+Poison;Fish+Bubble+Poison
Crab|🦀|animal,sea,hard,@insect,#e8492f|Fish+Shell;Shell+Animal+Sea;Animal+Beach
Lobster|🦞|animal,sea,hard,@insect,#d0302a|Crab+Ocean;Crab+Sea
Shrimp|🦐|animal,sea,tiny,edible,@insect,#ff8a6a|Crab+Puddle;Lobster+Baby;Crab+Pond
Seahorse|🦭|animal,sea,tiny,@fish,#ffb84a|Fish+Horse;Horse+Ocean;Horse+Sea
Seal|🦭|animal,sea,cold,@creature,#8a9aa8|Animal+Ice+Sea;Dog+Ocean;Animal+Arctic
Walrus|🦭|animal,sea,cold,huge,@creature,#a07a5a|Seal+Tooth;Seal+Huge;Seal+Mustache
Turtle|🐢|animal,sea,hard,@creature,#4a8a4a|Animal+Shell;Egg+Beach;Lizard+Shell
Tortoise|🐢|animal,hard,ancient,@creature,#7a6a3a|Turtle+Land;Turtle+Time;Turtle+Desert
Frog|🐸|animal,wet,@creature,#4fc04f|Animal+Swamp;Animal+Pond;Fish+Land
Toad|🐸|animal,wet,poison,@creature,#8a8a3a|Frog+Poison;Frog+Mud
Tadpole|🐸|animal,tiny,water,@fish,#3a4a3a|Frog+Egg;Frog+Baby;Egg+Pond
Lizard|🦎|animal,dry,@creature,#6ab03a|Animal+Desert;Egg+Swamp;Animal+Stone
Chameleon|🦎|animal,magic,@creature,#3ae08a|Lizard+Rainbow;Lizard+Paint;Lizard+Camouflage
Gecko|🦎|animal,tiny,sticky,@creature,#8ad06a|Lizard+Glue;Lizard+Wall
Iguana|🦎|animal,@creature,#3a9a5a|Lizard+Jungle;Lizard+Tree
Snake|🐍|animal,poison,@snake,#5a9a3a|Animal+Rope;Worm+Poison;Lizard+Rope;Worm+Huge
Cobra|🐍|animal,poison,@snake,#a08a3a|Snake+Desert;Snake+Venom
Python|🐍|animal,huge,@snake,#8a7a3a|Snake+Huge;Snake+Jungle
Crocodile|🐊|animal,sharp,wet,@creature,#3a6a3a|Lizard+Swamp;Lizard+River;Lizard+Teeth
Alligator|🐊|animal,sharp,wet,@creature,#2f5a2f|Crocodile+America;Crocodile+Swamp
Dinosaur|🦕|animal,huge,ancient,@creature,#5a8a4a|Lizard+Time;Lizard+Huge;Egg+Time+Huge;Fossil+Life
T-Rex|🦖|animal,huge,sharp,ancient,@creature,#4a7a3a,!rare|Dinosaur+Teeth;Dinosaur+King;Dinosaur+Meat
Pterodactyl|🦅|animal,flying,ancient,@bird,#7a8a6a|Dinosaur+Bird;Dinosaur+Air;Dinosaur+Sky
Mammoth|🦣|animal,huge,cold,ancient,furry,@creature,#7a5a3a|Elephant+Ice;Elephant+Time;Elephant+Fur
Bird|🐦|animal,flying,sky,@bird,#5ab0e8|Egg+Air;Animal+Sky;Animal+Air;Egg+Sky
Feather|🪶|soft,flying,tiny,@plant,#f2f2f2,%cloth|Bird+Wind;Bird+Knife;Bird+Tiny
Wing|🪽|flying,soft,@plant,#f4f4f4,%cloth|Feather+Feather;Bird+Arm;Feather+Arm
Nest|🪺|wood,plant,@bowl,#9a7a4a|Bird+Tree;Bird+Hay;Egg+Hay
Chicken|🐔|animal,edible,@bird,#f8f4ea|Bird+Farm;Bird+Barn;Egg+Farm
Rooster|🐓|animal,sound,@bird,#d84a2a|Chicken+Morning;Chicken+Alarm Clock
Duck|🦆|animal,flying,water,@bird,#e8c040|Bird+Pond;Bird+Lake;Bird+Water
Swan|🦢|animal,flying,water,@bird,#ffffff|Duck+Love;Duck+Lake+Beauty;Duck+Ballet
Goose|🪿|animal,flying,@bird,#e8e8e0|Duck+Farm;Duck+Huge
Penguin|🐧|animal,cold,sea,@bird,#2a2a3a|Bird+Ice;Bird+Snow;Bird+Arctic
Owl|🦉|animal,flying,dark,knowledge,@bird,#8a6a4a|Bird+Night;Bird+Wisdom;Bird+Book
Eagle|🦅|animal,flying,sharp,fast,@bird,#6a4a2a|Bird+Mountain;Bird+America;Bird+Sword
Hawk|🦅|animal,flying,fast,@bird,#8a5a3a|Bird+Hunter;Eagle+Tiny
Falcon|🦅|animal,flying,fast,@bird,#7a6a5a|Bird+Fast;Hawk+Speed
Parrot|🦜|animal,flying,sound,@bird,#3ad04a|Bird+Jungle;Bird+Rainbow
Peacock|🦚|animal,flying,magic,@bird,#2a8ad0|Bird+Rainbow+Pride;Bird+Beauty;Turkey+Rainbow
Flamingo|🦩|animal,flying,@bird,#ff7aa8|Bird+Shrimp;Bird+Pink;Duck+Shrimp
Crow|🐦‍⬛|animal,flying,dark,@bird,#1a1a24|Bird+Darkness;Bird+Coal;Bird+Shadow
Raven|🐦‍⬛|animal,flying,dark,magic,@bird,#14141c|Crow+Magic;Crow+Night
Pigeon|🕊️|animal,flying,@bird,#9aa0b0|Bird+City;Bird+Statue
Dove|🕊️|animal,flying,holy,@bird,#fbfbff|Bird+Peace;Bird+Love;Pigeon+Peace
Turkey|🦃|animal,edible,@bird,#8a4a2a|Chicken+Huge;Chicken+America;Chicken+Thanksgiving
Ostrich|🦤|animal,fast,huge,@bird,#6a5a4a|Bird+Desert;Bird+Huge;Bird+Sand
Hummingbird|🐦|animal,flying,tiny,fast,@bird,#3ae0c0|Bird+Flower;Bird+Tiny+Fast;Bird+Nectar
Stork|🦩|animal,flying,@bird,#f4f4f4|Bird+Baby;Bird+Chimney
Bat|🦇|animal,flying,dark,@bird,#3a2f3a|Bird+Cave;Mouse+Wing;Mouse+Bird;Bird+Darkness+Cave
Mouse|🐁|animal,tiny,@creature,#a8a0a0|Animal+Cheese;Animal+Tiny;Animal+Hole
Rat|🐀|animal,poison,@creature,#7a6a6a|Mouse+City;Mouse+Sewer;Mouse+Garbage
Hamster|🐹|animal,tiny,soft,@creature,#e8b07a|Mouse+Wheel;Mouse+Pet
Squirrel|🐿️|animal,tiny,@creature,#b06a3a|Mouse+Tree;Mouse+Acorn
Rabbit|🐇|animal,fast,soft,@creature,#f0e8e0|Animal+Carrot;Mouse+Field;Animal+Grass+Fast
Hedgehog|🦔|animal,sharp,tiny,@creature,#8a6a4a|Mouse+Thorn;Mouse+Cactus;Animal+Thorn
Porcupine|🦔|animal,sharp,@creature,#6a5a4a|Hedgehog+Huge;Animal+Spike;Hedgehog+Forest
Beaver|🦫|animal,wood,@creature,#8a5a2a|Animal+Dam;Animal+Wood;Rat+River
Otter|🦦|animal,water,@creature,#8a6a4a|Animal+River;Beaver+Fish
Raccoon|🦝|animal,@creature,#8a8a8a|Animal+Garbage;Cat+Mask;Fox+Garbage
Skunk|🦨|animal,poison,@creature,#2a2a2a|Cat+Smoke;Animal+Poison
Fox|🦊|animal,fast,@creature,#ff7a2a|Dog+Forest;Animal+Forest;Wolf+Fire
Wolf|🐺|animal,wild,sharp,@creature,#7a7f8a|Dog+Moon;Dog+Forest+Night;Dog+Wild;Animal+Moon
Dog|🐕|animal,@creature,#c8925a|Animal+Human;Wolf+Pet;Animal+House
Puppy|🐶|animal,tiny,soft,@creature,#e8b27a|Dog+Baby;Dog+Tiny
Cat|🐈|animal,soft,@creature,#e8a050|Animal+Mouse;Dog+Mouse;Animal+Yarn
Kitten|🐱|animal,tiny,soft,@creature,#f0b870|Cat+Baby;Cat+Tiny
Black Cat|🐈‍⬛|animal,dark,magic,evil,@creature,#1a1a22|Cat+Darkness;Cat+Witch;Cat+Night
Lion|🦁|animal,wild,huge,@creature,#d8a040|Cat+Savanna;Cat+King;Cat+Huge
Tiger|🐅|animal,wild,huge,@creature,#ff8a1a|Cat+Jungle;Lion+Stripes;Cat+Stripes
Leopard|🐆|animal,fast,wild,@creature,#e0b050|Cat+Spots;Cat+Tree
Cheetah|🐆|animal,fast,@creature,#e8c060|Cat+Fast;Leopard+Speed;Cat+Car
Panther|🐈‍⬛|animal,dark,@creature,#141418|Leopard+Night;Leopard+Shadow
Bear|🐻|animal,huge,furry,@creature,#7a4f2a|Animal+Forest+Huge;Dog+Huge;Animal+Honey
Polar Bear|🐻‍❄️|animal,cold,huge,@creature,#f4f4f0|Bear+Ice;Bear+Snow;Bear+Arctic
Panda|🐼|animal,soft,@creature,#f4f4f4|Bear+Bamboo;Bear+China
Koala|🐨|animal,soft,@creature,#9a9aa0|Bear+Tree;Bear+Australia
Kangaroo|🦘|animal,fast,@creature,#c08a5a|Animal+Australia;Rabbit+Huge;Rabbit+Box
Monkey|🐒|animal,@creature,#9a6a3a|Animal+Tree;Animal+Jungle;Human+Jungle
Gorilla|🦍|animal,huge,@creature,#3a3a3a|Monkey+Huge;Monkey+Muscle
Sloth|🦥|animal,slow,soft,@creature,#a89070|Monkey+Sleep;Monkey+Slow
Elephant|🐘|animal,huge,@creature,#9aa0a8|Hippo+Snake;Animal+Mountain;Mouse+Giant
Rhino|🦏|animal,huge,hard,@creature,#8a8f98|Animal+Horn+Huge;Elephant+Horn;Hippo+Horn
Hippo|🦛|animal,huge,wet,@creature,#9a8aa8|Animal+River+Huge;Pig+River;Pig+Water
Giraffe|🦒|animal,huge,@creature,#e8b050|Horse+Tree;Animal+Savanna;Horse+Savanna
Zebra|🦓|animal,fast,@creature,#f0f0f0|Horse+Stripes;Horse+Savanna+Stripes;Horse+Africa
Horse|🐎|animal,fast,@creature,#8a5a3a|Animal+Field;Animal+Farm+Fast;Animal+Hay
Pony|🐴|animal,tiny,@creature,#c08a6a|Horse+Tiny;Horse+Baby
Donkey|🫏|animal,@creature,#8a8a8a|Horse+Hay+Farm;Horse+Desert
Camel|🐪|animal,dry,hot,@creature,#d8a860|Horse+Sand
Llama|🦙|animal,soft,@creature,#f0e8d8|Camel+Mountain;Sheep+Camel
Deer|🦌|animal,fast,@creature,#b07a4a|Horse+Forest;Animal+Antlers
Moose|🫎|animal,huge,cold,@creature,#6a4a2a|Deer+Huge;Deer+Canada;Deer+Cold
Reindeer|🦌|animal,cold,magic,@creature,#9a6a3a|Deer+Snow;Deer+Santa;Deer+Christmas
Cow|🐄|animal,edible,@creature,#f4f4f4|Animal+Farm;Animal+Grass;Animal+Milk
Bull|🐂|animal,huge,@creature,#5a3a2a|Cow+Anger;Cow+Horn;Cow+Red
Ox|🐂|animal,huge,@creature,#7a5a3a|Bull+Farm;Cow+Plow
Pig|🐖|animal,edible,@creature,#ffb0b8|Animal+Mud;Animal+Farm+Mud
Boar|🐗|animal,wild,@creature,#6a4a3a|Pig+Forest;Pig+Wild
Sheep|🐑|animal,soft,@creature,#f6f4ee|Animal+Cloud;Animal+Wool;Cow+Cloud
Lamb|🐑|animal,tiny,soft,@creature,#fbfaf6|Sheep+Baby;Sheep+Tiny
Goat|🐐|animal,@creature,#e0d8c8|Sheep+Mountain;Sheep+Horn
Duckling|🐤|animal,tiny,@bird,#ffe14a|Duck+Baby;Duck+Tiny
Chick|🐣|animal,tiny,@bird,#ffe85a|Chicken+Baby;Egg+Chicken;Egg+Heat
Mole|🐀|animal,underground,@creature,#4a3a3a|Mouse+Tunnel;Mouse+Underground;Mouse+Soil
Armadillo|🦔|animal,hard,@creature,#a08a7a|Animal+Armor;Hedgehog+Shell
Platypus|🦫|animal,water,@creature,#8a6a4a|Duck+Beaver;Duck+Otter
Badger|🦡|animal,@creature,#7a7a7a|Animal+Hill+Stripes;Dog+Tunnel
Hyena|🐕|animal,@creature,#b8a070|Dog+Savanna;Dog+Laughter
Snow Leopard|🐆|animal,cold,@creature,#e8e8e0|Leopard+Snow;Leopard+Mountain
Jaguar|🐆|animal,fast,@creature,#d8a040|Leopard+Jungle;Leopard+South America
Lynx|🐈|animal,cold,@creature,#c8a080|Cat+Forest+Snow;Cat+Pine Tree
Bison|🦬|animal,huge,@creature,#5a3a20|Cow+Prairie;Bull+Fur;Cow+Huge
Unicorn|🦄|animal,mythical,magic,holy,@creature,#fbe8ff,!epic|Horse+Rainbow;Horse+Magic;Horse+Horn
Pegasus|🪽|animal,mythical,flying,holy,@creature,#f4f8ff,!epic|Horse+Wing;Horse+Bird;Horse+Cloud
Pet|🐾|animal,soft,emotion,@creature,#e8b07a|Animal+Love;Dog+House
Fur|🦊|soft,cloth,@cloth,#b5835a|Animal+Scissors;Bear+Knife;Wolf+Scissors
Wool|🧶|soft,cloth,@cloth,#f2ece0|Sheep+Scissors;Sheep+Knife;Lamb+Scissors
Yarn|🧶|cloth,soft,@orb,#e05a8a,%cloth|Wool+Spin;Wool+Stick;Wool+Thread
Silk|🧵|cloth,soft,@cloth,#f8f0ff|Caterpillar+Thread;Spider+Cloth;Worm+Thread
Bone|🦴|hard,death,@bone,#f0ead8|Animal+Death;Skeleton+Knife;Meat+Time
Skeleton|💀|death,human,hard,@humanoid,#f2eee2|Bone+Bone;Human+Death+Time;Bone+Human
Skull|💀|death,hard,evil,@skull,#f0ece0|Bone+Head;Skeleton+Head;Head+Death
Blood|🩸|liquid,living,death,@liquid,#a8101c|Human+Knife;Animal+Sword;Meat+Knife
Heart|❤️|living,emotion,@heart,#e8203a|Blood+Love;Blood+Muscle;Love+Love+Blood
Brain|🧠|living,knowledge,@blob,#ffb0c0,%organic|Human+Knowledge;Head+Knowledge;Human+Thought
Muscle|💪|living,hard,@blob,#e06a5a,%organic|Human+Exercise;Meat+Energy;Human+Strength
Eye|👁️|living,light,@orb,#f8f8f8,%organic|Human+Light;Animal+Light
Hand|✋|living,human,tool,@blob,#e8b090,%organic|Human+Tool;Human+Five
Head|🗣️|living,human,@orb,#e8b090,%organic|Human+Brain;Human+Hat
Teeth|🦷|hard,sharp,@bone,#fbfaf2|Bone+Mouth;Bone+Food;Human+Bone
Tooth|🦷|hard,tiny,@bone,#fdfcf6|Teeth+Knife;Bone+Mouth
Horn|📯|hard,sharp,@spike,#d8c8a8|Bone+Bull;Bone+Goat;Bone+Spike
Antlers|🦌|hard,@tree,#a07a50|Horn+Tree;Bone+Tree
Tears|💧|water,emotion,tiny,@liquid,#8ac8ff|Eye+Water;Sadness+Water;Eye+Sadness
Sweat|💦|water,tiny,@liquid,#b8e0ff|Human+Heat;Human+Exercise+Heat;Human+Sun
Poison|☠️|poison,liquid,death,@potion,#7ad13b|Toad+Potion;Snake+Bottle;Mushroom+Death
Venom|🐍|poison,liquid,@potion,#9ae04a|Spider+Bottle;Snake+Poison
Acid|🧪|poison,liquid,hot,@potion,#c8ff3a|Poison+Water;Lemon+Poison;Rain+Pollution
Slime|🟢|sticky,soft,liquid,poison,@blob,#7fe05a,%liquid|Mud+Bacteria;Bacteria+Water+Sticky;Jelly+Poison
Death|💀|death,abstract,dark,@abstract,#1a1a1f|Life+Time;Life+Poison;Human+Time
Plague|🦠|death,poison,@gas,#7a8a3a|Virus+City;Rat+Disease;Virus+Virus

// ---------------- food & drink ----------------
Food|🍽️|edible,@bowl,#e8a060|Human+Hunger;Fruit+Human
Meat|🍖|edible,@meat,#c0504a|Animal+Knife;Animal+Fire;Cow+Knife
Steak|🥩|edible,hot,@meat,#a8382a|Meat+Fire;Meat+Grill;Meat+Barbecue
Bacon|🥓|edible,@meat,#d8604a|Pig+Fire;Meat+Pig;Pig+Knife
Sausage|🌭|edible,@food,#c06040|Meat+Tube;Meat+Rope
Hot Dog|🌭|edible,@food,#e0904a|Sausage+Bread;Dog+Bread;Dog+Heat
Burger|🍔|edible,@disc,#c8802a|Meat+Bread;Steak+Bread;Bread+Cow
Cheeseburger|🍔|edible,@disc,#e0a030|Burger+Cheese;Cheese+Meat+Bread
Sandwich|🥪|edible,@food,#e8c080|Bread+Cheese;Bread+Vegetable;Bread+Bacon
Taco|🌮|edible,@food,#f0c050|Tortilla+Meat;Corn+Meat;Tortilla+Vegetable
Tortilla|🫓|edible,@disc,#f0d090|Corn+Flour;Flour+Pressure;Corn+Fire
Burrito|🌯|edible,@food,#e8c080|Tortilla+Rice;Taco+Blanket
Pizza|🍕|edible,@disc,#f0b040|Bread+Cheese+Tomato;Dough+Tomato;Bread+Tomato;Dough+Cheese
Pasta|🍝|edible,@bowl,#f0d070|Dough+Water;Flour+Egg+Water;Dough+Italy
Spaghetti|🍝|edible,@bowl,#f0c860|Pasta+Tomato;Pasta+Rope
Noodles|🍜|edible,hot,@bowl,#f0d890|Pasta+Soup;Dough+Soup
Ramen|🍜|edible,hot,@bowl,#e8b860|Noodles+Japan;Noodles+Egg+Soup;Noodles+Egg
Soup|🍲|edible,hot,liquid,@bowl,#e09040|Water+Vegetable+Fire;Vegetable+Hot Water;Water+Vegetable;Vegetable+Steam
Stew|🍲|edible,hot,@bowl,#a8603a|Soup+Meat;Meat+Water+Fire;Soup+Potato
Curry|🍛|edible,hot,@bowl,#e8a020|Rice+Spice;Stew+Spice;Rice+Chili
Sushi|🍣|edible,@food,#ff8a6a|Rice+Fish;Fish+Seaweed+Rice;Fish+Seaweed
Bread|🍞|edible,@bread,#d8a050|Dough+Fire;Dough+Oven;Flour+Fire
Toast|🍞|edible,hot,dry,@bread,#c8803a|Bread+Fire;Bread+Toaster;Bread+Heat
Baguette|🥖|edible,@bread,#d8a050|Bread+France;Bread+Stick
Croissant|🥐|edible,@bread,#e8b050|Bread+Butter;Dough+Butter;Bread+Moon
Bagel|🥯|edible,@ring,#d8a868,%food|Bread+Donut;Dough+Ring;Bread+Hole
Pretzel|🥨|edible,@ring,#b06a2a,%food|Dough+Rope;Dough+Salt
Pancake|🥞|edible,sweet,@disc,#e8b060|Dough+Frying Pan;Flour+Egg+Milk;Egg+Flour
Waffle|🧇|edible,sweet,@cube,#e0a850,%food|Pancake+Grid;Pancake+Iron
Dough|🫓|soft,sticky,edible,@blob,#f2dcae,%food|Flour+Water;Flour+Egg
Flour|🌾|edible,tiny,dry,@cube,#fbf6ea,%food|Wheat+Stone;Wheat+Windmill;Wheat+Pressure
Butter|🧈|edible,soft,@cube,#ffe58a,%food|Milk+Pressure;Cream+Pressure
Milk|🥛|edible,liquid,@drink,#fbfbff|Cow+Water;Cow+Hand;Goat+Hand
Cream|🍦|edible,soft,sweet,@blob,#fff8e8,%food|Milk+Wind;Milk+Air;Milk+Sugar+Air
Cheese|🧀|edible,@food,#ffcf3a|Milk+Time;Milk+Bacteria;Milk+Cave
Yogurt|🥣|edible,soft,@bowl,#fbf4f8|Milk+Bacteria+Time;Milk+Fruit;Cream+Bacteria
Ice Cream|🍨|edible,cold,sweet,@icecream,#ffd8e8|Milk+Ice;Cream+Ice;Milk+Snow;Cream+Cold
Milkshake|🥤|edible,cold,sweet,@drink,#ffc8e0|Ice Cream+Milk;Milk+Blender
Smoothie|🥤|edible,cold,@drink,#ff8ac0|Fruit+Blender;Juice+Ice;Fruit+Yogurt
Cake|🎂|edible,sweet,@cake,#ffc0d8|Dough+Sugar;Bread+Sugar;Flour+Egg+Sugar;Dough+Cream
Cupcake|🧁|edible,sweet,tiny,@cake,#ff9ac8|Cake+Tiny;Cake+Cup
Birthday Cake|🎂|edible,sweet,emotion,@cake,#ffb0d0|Cake+Candle;Cake+Party;Cake+Birthday
Cookie|🍪|edible,sweet,@disc,#d8a060|Dough+Sugar+Fire;Dough+Chocolate;Flour+Chocolate;Dough+Oven+Sugar
Donut|🍩|edible,sweet,@ring,#f0a0c0,%food|Dough+Oil;Dough+Ring+Sugar;Cake+Ring;Dough+Hole
Pie|🥧|edible,sweet,@disc,#d8904a|Dough+Fruit;Fruit+Bread;Dough+Apple
Apple Pie|🥧|edible,sweet,@disc,#c8803a|Pie+Apple;Apple+Dough
Candy|🍬|edible,sweet,@candy,#ff5ca8|Sugar+Sugar;Sugar+Fire;Sugar+Color
Lollipop|🍭|edible,sweet,@candy,#ff6ad0|Candy+Stick;Sugar+Stick
Cotton Candy|🍭|edible,sweet,soft,@cloud,#ffb8e8|Sugar+Cloud;Candy+Cloud;Sugar+Wool
Gum|🫧|edible,sticky,sweet,@blob,#ff8ad0,%food|Candy+Rubber;Sugar+Rubber;Candy+Glue
Marshmallow|🍡|edible,sweet,soft,@cube,#fff8fb,%food|Sugar+Cloud+Fire;Sugar+Pillow;Candy+Pillow
Jelly|🍮|edible,sweet,soft,sticky,@blob,#ff4a7a,%food|Fruit+Sugar;Juice+Sugar
Jam|🍓|edible,sweet,sticky,@potion,#c0103a|Fruit+Sugar+Fire;Jelly+Bread;Fruit+Pressure+Sugar;Berry+Sugar
Caramel|🍮|edible,sweet,sticky,@blob,#c8802a,%food|Sugar+Heat;Sugar+Butter
Pudding|🍮|edible,sweet,soft,@cake,#f0c070|Milk+Sugar;Cream+Sugar;Egg+Milk+Sugar
Frosting|🧁|edible,sweet,soft,@blob,#fff0f8,%food|Sugar+Cream;Sugar+Butter+Cream;Cream+Candy
Chocolate|🍫|edible,sweet,@cube,#6a3a1f,%food|Cocoa+Sugar;Cocoa+Milk
Hot Chocolate|☕|edible,hot,sweet,@drink,#7a4a2a|Chocolate+Milk;Chocolate+Hot Water;Chocolate+Steam
Popcorn|🍿|edible,@cloud,#fff6d0|Corn+Fire;Corn+Heat;Corn+Explosion
Fries|🍟|edible,hot,@food,#f6c040|Potato+Oil;Potato+Knife+Fire;Potato+Fire
Chips|🥔|edible,dry,@disc,#f0c060|Potato+Knife;Fries+Flat;Potato+Salt
Salad|🥗|edible,@bowl,#6ad04a|Vegetable+Bowl;Lettuce+Tomato;Lettuce+Vegetable
Omelette|🍳|edible,@disc,#ffd84a|Egg+Frying Pan;Egg+Fire
Fried Egg|🍳|edible,hot,@disc,#fff8e8|Egg+Oil;Egg+Sun;Egg+Stove
Dumpling|🥟|edible,@food,#f8ecd8|Dough+Meat;Dough+Steam
Spring Roll|🥢|edible,@food,#e8c07a|Dough+Vegetable;Dough+Vegetable+Oil
Rice Ball|🍙|edible,@food,#fbfbfb|Rice+Hand;Rice+Seaweed
Fortune Cookie|🥠|edible,magic,@food,#e8b060|Cookie+Paper;Cookie+Future;Cookie+Fortune
Oil|🛢️|liquid,sticky,@potion,#d8b830|Olive+Pressure;Seed+Pressure;Fossil+Pressure;Dinosaur+Pressure
Vinegar|🍶|liquid,@potion,#e8dc90|Wine+Time;Wine+Bacteria;Acid+Fruit
Wine|🍷|liquid,edible,@drink,#8a1a3a|Grape+Time;Grape+Bottle;Juice+Time
Beer|🍺|liquid,edible,@drink,#f0b030|Wheat+Water+Time;Wheat+Bottle;Bread+Water+Time;Wheat+Yeast
Yeast|🦠|living,tiny,@blob,#e8d8a8,%organic|Bacteria+Bread;Bacteria+Flour;Bacteria+Sugar
Soda|🥤|liquid,edible,sweet,@drink,#8a3a1a|Sugar+Bubble;Juice+Bubble;Water+Sugar+Bubble
Tea|🍵|hot,liquid,edible,@drink,#a8b860|Herb+Steam;Herb+Water;Mint+Water
Coffee|☕|hot,liquid,edible,energy,@drink,#5a3a2a|Coffee Bean+Steam;Coffee Bean+Water;Coffee Bean+Hot Water
Hot Water|♨️|water,hot,liquid,@drink,#9ad4ff|Water+Heat;Water+Stove;Water+Kettle
Lemonade|🍋|liquid,edible,cold,@drink,#fff27a|Lemon+Water;Lemon+Sugar;Lemon+Juice
Energy Drink|⚡|liquid,edible,energy,@drink,#8aff3a|Soda+Energy;Coffee+Soda;Juice+Lightning
Potion|🧪|magic,liquid,@potion,#c05cff|Water+Magic;Bottle+Magic;Herb+Magic
Hot Sauce|🌶️|liquid,edible,hot,@potion,#e8301a|Chili+Bottle;Chili+Water;Chili+Juice
Ketchup|🍅|liquid,edible,@potion,#d8201a|Tomato+Bottle;Tomato+Sugar;Tomato+Pressure
Mustard|🟡|liquid,edible,@potion,#e8c020|Seed+Vinegar;Spice+Bottle
Mayonnaise|🥚|liquid,edible,soft,@potion,#fbf6e0|Egg+Oil
Barbecue Sauce|🍖|liquid,edible,@potion,#7a2a1a|Ketchup+Smoke;Ketchup+Barbecue
Feast|🍗|edible,huge,@bowl,#d8904a|Food+Food;Meat+Party;Food+Party
Picnic|🧺|edible,emotion,@bowl,#e05a5a|Food+Field;Sandwich+Park;Food+Blanket
Breakfast|🥞|edible,time,@disc,#f0c060|Food+Morning;Egg+Toast;Pancake+Morning
Lunch|🍱|edible,time,@food,#e8a060|Food+Day;Sandwich+Day
Dinner|🍽️|edible,time,@bowl,#c8704a|Food+Night;Food+Evening
Bento|🍱|edible,@cube,#e85a4a,%food|Lunch+Japan;Rice+Box;Sushi+Box
`);
