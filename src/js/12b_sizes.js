// ============================================================================
//  ELEMENTAL LAB — 12b · Real-world sizes
//  Every item is built at (roughly) its true size: an ant is a few centimetres,
//  a toy fits in your hand, a person is 1.75 m, a whale is 16 m and a cloud is
//  a big drifting puff. Truly astronomical things are capped so they still fit
//  inside the (enormous) lab. Value = the item's largest dimension in metres.
// ============================================================================

const REAL_SIZE = [
  // tiny
  [0.06, 'atom,molecule,bacteria,virus,cell,yeast,dot,point,spark,pixel,static'], [0.05, 'ant,flea,mosquito,fly,ladybug,firefly,bee,tick'],
  [0.05, 'seed,bean,acorn,pea,rice,sugar,salt,pill,button,pearl,tooth,coin,ring,dice,gem,diamond,ruby,emerald,sapphire,quartz,amethyst,nail,screw,pin,needle,snowflake,hail,pebble,gravel,sand,dust,glitter,sparkle,stardust,microchip,bullet'],
  [0.08, 'grape,berry,cherry,olive,key,compass,egg,shrimp,snail,spider,beetle,grasshopper,bug,caterpillar,worm,tadpole,lollipop,candy,cookie,chocolate,cupcake,match,lighter,battery,dna,heart,brain,eye,ear,mouth,lips,hand,feather,leaf,clover,thorn,spike,shuriken,origami,stamp,lens,chip,chips,fries,dumpling,sushi,rice ball,wasabi,pacifier'],
  // hand-held
  [0.12, 'apple,orange,lemon,lime,peach,tomato,onion,garlic,kiwi,mango,fruit,potato,carrot,pepper,chili,cucumber,mushroom,toadstool,mouse,hamster,frog,toad,butterfly,moth,dragonfly,scorpion,crab,hummingbird,chick,duckling,mug,cup,glass,bulb,lightbulb,idea,phone,smartphone,watch,smartwatch,burger,cheeseburger,sandwich,taco,donut,bagel,pretzel,muffin,cheese,butter,soap,sponge,candle,ink,glue,tape,can,jar,horseshoe,magnet,bell,whistle,pen,pencil,quill,scalpel,syringe,ball,golf,tennis,baseball,puck,snowball,grenade,glasses,crown,tiara,medal,trophy'],
  [0.3, 'banana,corn,eggplant,pineapple,coconut,avocado,cabbage,lettuce,broccoli,bread,toast,croissant,pie,pizza,cake,pancake,steak,meat,bacon,sausage,hot dog,ice cream,milkshake,smoothie,juice,soda,coffee,tea,wine,beer,bottle,potion,elixir,poison,flask,book,spellbook,bible,scroll,map,letter,paper,newspaper,photo,picture,calendar,cards,clock,alarm clock,lamp,lantern,torch,flashlight,camera,radio,toaster,kettle,pot,pan,frying pan,bowl,plate,basket,bag,hat,top hat,helmet,mask,shoe,boot,sock,glove,scarf,wig,toy,doll,teddy,yo-yo,puzzle,kite,balloon,rock,stone,brick,ore,coal,crystal,ice,gold,silver,iron,steel,copper,metal,ingot,gold bar,skull,bone,fossil,shell,starfish,bird,parrot,pigeon,crow,owl,duck,squirrel,rat,mole,hedgehog,kitten,piggy,fish,goldfish,pufferfish,seahorse,octopus,squid,jellyfish,cactus,flower,rose,tulip,sunflower,lily,lotus,orchid,herb,mint,sprout,bonsai,nest,hammer,wrench,screwdriver,knife,dagger,chisel,saw,drill,gun,laser gun,wand,microphone,headphones,laptop,keyboard,calculator,game console,video game,drone,typewriter,chess,bomb,dynamite,tnt,firework,hourglass,trophy,vinyl,flute,whistle,violin,trumpet,saxophone,harp'],
  // furniture / pets / people-scale
  [0.6, 'cat,rabbit,chicken,rooster,penguin,puppy,fox,raccoon,skunk,otter,beaver,armadillo,platypus,lizard,gecko,iguana,chameleon,turtle,eagle,hawk,falcon,peacock,turkey,swan,goose,flamingo,bat,lamb,baby,pillow,blanket,towel,backpack,chest,treasure,box,gift,cargo,barrel,bucket,microwave,computer,television,speaker,drum,guitar,electric guitar,cello,sword,katana,axe,pickaxe,shovel,rake,broom,mop,bow,shield,umbrella,paddle,racket,skateboard,snowboard,fire extinguisher'],
  [1.0, 'dog,wolf,hyena,goat,sheep,pig,boar,koala,panda,monkey,sloth,kangaroo,seal,dolphin,child,dwarf,gnome,goblin,leprechaun,pixie,fairy,chair,bench,stool,throne,table,oven,stove,fridge,freezer,washing machine,vacuum,piano,synthesizer,spear,trident,scythe,flag,pole,sign,ladder,bicycle,sled,barbecue,grill,anvil,spinning wheel,loom,well,fountain,statue'],
  [1.75, 'human,man,woman,person,surfer,farmer,hunter,lumberjack,carpenter,blacksmith,miner,builder,engineer,chef,baker,butcher,fisherman,sailor,pirate,captain,pilot,doctor,nurse,scientist,professor,teacher,student,genius,artist,sculptor,musician,singer,dancer,athlete,soldier,knight,samurai,ninja,viking,warrior,gladiator,cowboy,caveman,explorer,archaeologist,detective,police,thief,assassin,judge,lawyer,banker,merchant,king,queen,prince,princess,pharaoh,emperor,priest,monk,clown,magician,superhero,hero,villain,hacker,programmer,gamer,firefighter,gardener,leader,astronaut,wizard,witch,warlock,sorcerer,necromancer,alchemist,vampire,zombie,mummy,skeleton,ghost,ghoul,elf,mermaid,angel,archangel,cupid,demon,devil,reaper,santa,snowman,robot,android,cyborg,alien,muse,goddess,old man,grandma,actor,celebrity,champion,winner,archer,dryad,nymph,medusa,genie,avatar,frankenstein,werewolf,minotaur,centaur,chess master,lighthouse keeper,robot chef'],
  // big animals & vehicles
  [2.4, 'horse,pony,donkey,zebra,deer,reindeer,cow,bull,ox,bison,lion,tiger,leopard,cheetah,jaguar,panther,lynx,bear,polar bear,gorilla,yeti,bigfoot,ostrich,llama,camel,unicorn,pegasus,griffin,phoenix,sphinx,cerberus,kitsune,chimera,shark,orca,crocodile,alligator,python,cobra,snake,eel,motorcycle,snowmobile,jet ski,canoe,raft,hot tub,bed,sofa,golem,gargoyle,troll,ogre,cyclops'],
  [4.5, 'car,igloo,hut,tent,electric car,race car,police car,taxi,ambulance,tractor,cart,wagon,chariot,elephant,rhino,hippo,giraffe,moose,mammoth,walrus,sea lion,boat,sailboat,yacht,catapult,cannon,helicopter,jetpack,giant,lake monster,hydra,basilisk,kraken,treant,swamp monster,ice golem,mud golem,fire elemental,water elemental,air elemental,earth elemental,titan,grim reaper,poseidon,zeus,thor,odin,god'],
  [9, 'truck,fire truck,bus,tank,train,locomotive,bullet train,magnet train,ship,pirate ship,viking ship,submarine,airplane,ufo,rocket,spaceship,rocket ship,hot air balloon,satellite,dinosaur,t-rex,dragon,ice dragon,baby dragon,whale,fire whale,cosmic whale,leviathan,sea serpent,tree,pine tree,palm tree,dead tree,maple,christmas tree,beanstalk,tree of life,house,cabin,barn,treehouse,windmill,mill,factory,shop,restaurant,school,hospital,bank,museum,library,church,haunted house,prison,hotel,gym,arcade,laboratory,kitchen,well,dam,bridge,greenhouse'],
  [16, 'castle,palace,tower,lighthouse,skyscraper,temple,pyramid,colosseum,arena,stadium,observatory,space station,moon base,nuclear reactor,great wall,stonehenge,ruins,cloud castle,valhalla,atlantis,el dorado,village,town,city,metropolis,kingdom,empire,world tree,tesla coil'],
  // weather & landscape
  [6, 'cloud,rain cloud,rain,drizzle,snow,storm,thunderstorm,hurricane,tornado,blizzard,fog,smog,mist,steam cloud,sandstorm,rainbow,aurora,northern lights,lightning,thunder,heaven,weather,cotton candy'],
  [20, 'mountain,volcano,ice cream volcano,glacier,iceberg,hill,plateau,cliff,canyon,island,volcano island,beach,desert,dune,oasis,lake,lava lake,pond,river,waterfall,valley,delta,ocean,sea,swamp,marsh,forest,jungle,rain forest,wilderness,savanna,prairie,field,farm,garden,park,continent,land,country,tundra,arctic,antarctica,coral reef,kelp forest,olympus,paradise,garden of eden'],
  // cosmic (capped)
  [10, 'sun,star,neutron star,pulsar,quasar,supernova,moon,full moon,planet,planet earth,world,mars,venus,jupiter,saturn,solar system,pizza planet,comet,asteroid,meteor,black hole,wormhole,eclipse,nebula,gas cloud,big bang'],
  [24, 'galaxy,milky way,universe,multiverse,omniverse,dark matter,singularity,cosmic egg,primordial chaos,creation'],
];
const SHAPE_SIZE = { orb: 0.4, flame: 0.45, rock: 0.35, blob: 0.4, liquid: 0.5, gas: 1.4, cloud: 6, cube: 0.35, crystal: 0.3, spike: 0.3, tree: 9, plant: 0.5,
  mushroom: 0.15, creature: 1.2, bird: 0.35, fish: 0.4, snake: 2, insect: 0.06, humanoid: 1.75, robot: 1.7, tool: 0.35, blade: 0.9, building: 9, vehicle: 4.5,
  plane: 12, boat: 6, rocket: 12, machine: 0.7, device: 0.2, celestial: 10, planet: 10, moon: 8, galaxy: 24, blackhole: 10, abstract: 0.5, heart: 0.3,
  star5: 0.3, fruit: 0.12, food: 0.2, disc: 0.3, cake: 0.3, icecream: 0.2, drink: 0.18, bowl: 0.25, bread: 0.3, meat: 0.25, candy: 0.06, egg: 0.08,
  potion: 0.25, book: 0.25, coin: 0.05, instrument: 0.9, cloth: 0.6, landform: 20, bolt: 2, gear: 0.3, ring: 0.3, skull: 0.22, bone: 0.4, bomb: 0.3,
  lamp: 0.2, shield: 0.7, crown: 0.25, key: 0.08, clock: 0.3, magnet: 0.12, bell: 0.2, umbrella: 1, flag: 1.5 };
const SIZE_BY_NAME = new Map();
for (const [s, list] of REAL_SIZE) for (const w of list.split(',')) SIZE_BY_NAME.set(w.trim(), s);
const MAX_REAL = 24, MIN_REAL = 0.05;

function realSize(info) {
  const base = (info.base && info.base) || (info.headItem) || info;
  const name = base.name.toLowerCase();
  let s = SIZE_BY_NAME.get(name);
  if (s == null) {
    // try the last word ("Golden Retriever" → retriever, "Ice Dragon" → dragon), then any word
    const words = name.split(/[\s-]+/);
    for (let i = 0; i < words.length - 1 && s == null; i++) s = SIZE_BY_NAME.get(words.slice(i).join(' '));
    for (let i = words.length - 1; i >= 0 && s == null; i--) s = SIZE_BY_NAME.get(words[i]);
  }
  if (s == null && base.like) { const like = Universe.byNorm.get(normName(base.like)); if (like && like !== base) return realSize(like); }
  if (s == null) {
    s = SHAPE_SIZE[base.shape] ?? 0.4;
    if (base.tags.includes('tiny')) s *= 0.4;
    if (base.tags.includes('huge')) s *= 2.5;
  }
  s *= info.scale || 1; // Giant / Tiny / Baby modifiers
  if (info.mods && info.mods.includes('giant')) s *= 1.6; // giants should feel giant
  return clamp(s, MIN_REAL, MAX_REAL);
}
