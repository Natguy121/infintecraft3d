// ============================================================================
//  ELEMENTAL LAB — 06 · Layer C: the modifier system
//  Any core item can carry up to two modifiers from *different* groups.
//  Combining an item with one of a modifier's "source" items applies it.
//
//  Fields:  name, pos ('pre' | 'suf'), group (conflict set), ord (adjective
//  order), add/remove tags, tint colour + amount, material override, mass and
//  scale multipliers, glow, rarity bump, fx (visual effects), requires (any-of
//  tags the base must have), sources (core item names), emoji badge.
// ============================================================================

const MODIFIER_DEFS = [
  // ---- size
  { id: 'tiny', name: 'Tiny', group: 'size', ord: 1, add: ['tiny'], remove: ['huge'], scale: 0.62, mass: 0.35, bump: 0, emoji: '🤏', sources: ['Microscope', 'Atom', 'Shrink Ray', 'Pixie', 'Ant'] },
  { id: 'giant', name: 'Giant', group: 'size', ord: 1, add: ['huge'], remove: ['tiny'], scale: 1.55, mass: 3.2, bump: 1, emoji: '🗻', sources: ['Titan', 'Growth Potion', 'Giant', 'Fertilizer', 'Beanstalk'] },
  // ---- temperature
  { id: 'frozen', name: 'Frozen', group: 'temp', ord: 4, add: ['cold', 'ice'], remove: ['hot', 'fire'], tint: 0xbfeaff, tintAmt: 0.55, mat: 'ice', mass: 1.1, bump: 0, fx: ['frost'], emoji: '🧊', sources: ['Ice', 'Snow', 'Frost', 'Glacier', 'Freezer', 'Blizzard'] },
  { id: 'burning', name: 'Burning', group: 'temp', ord: 4, add: ['hot', 'fire'], remove: ['cold', 'ice'], tint: 0xff6a1a, tintAmt: 0.35, glow: 0.8, glowColor: 0xff7a2a, bump: 0, fx: ['flames'], emoji: '🔥', sources: ['Fire', 'Flame', 'Inferno', 'Blaze', 'Wildfire'] },
  { id: 'molten', name: 'Molten', group: 'temp', ord: 4, add: ['hot', 'liquid', 'fire'], remove: ['cold', 'ice'], tint: 0xff4d00, tintAmt: 0.55, glow: 0.9, glowColor: 0xff5a10, mat: 'fire', bump: 1, fx: ['drip', 'flames'], emoji: '🌋', sources: ['Lava', 'Magma', 'Forge', 'Furnace', 'Volcano'] },
  // ---- matter
  { id: 'golden', name: 'Golden', group: 'matter', ord: 8, add: ['metal', 'money'], tint: 0xffcc33, tintAmt: 0.85, mat: 'gold', mass: 2.2, bump: 1, fx: ['shine'], emoji: '🥇', sources: ['Gold', 'Treasure', 'Gold Bar', 'King Midas'] },
  { id: 'crystal', name: 'Crystal', group: 'matter', ord: 8, add: ['crystal', 'magic'], tint: 0xc9a8ff, tintAmt: 0.6, mat: 'crystal', mass: 1.4, bump: 1, glow: 0.25, fx: ['sparkle'], emoji: '💎', sources: ['Crystal', 'Diamond', 'Quartz', 'Amethyst', 'Gem'] },
  { id: 'petrified', name: 'Petrified', group: 'matter', ord: 8, add: ['stone', 'hard'], remove: ['soft', 'living'], tint: 0x9a9a9a, tintAmt: 0.8, mat: 'stone', mass: 2.5, bump: 0, emoji: '🗿', sources: ['Medusa', 'Basilisk', 'Fossil', 'Cement', 'Gargoyle'] },
  { id: 'wooden', name: 'Wooden', group: 'matter', ord: 8, add: ['wood'], tint: 0xa8703a, tintAmt: 0.75, mat: 'wood', mass: 0.8, bump: 0, emoji: '🪵', sources: ['Wood', 'Plank', 'Sawdust', 'Log'] },
  { id: 'paper', name: 'Paper', group: 'matter', ord: 8, add: ['paper', 'soft'], remove: ['hard', 'metal'], tint: 0xf6f2e8, tintAmt: 0.75, mat: 'paper', mass: 0.2, bump: 0, emoji: '📄', sources: ['Paper', 'Newspaper', 'Cardboard', 'Origami'] },
  { id: 'candy', name: 'Candy', group: 'matter', ord: 8, add: ['sweet', 'edible'], tint: 0xff7ad0, tintAmt: 0.6, mat: 'candy', bump: 0, emoji: '🍬', sources: ['Sugar', 'Candy', 'Cotton Candy', 'Lollipop', 'Frosting'] },
  { id: 'chocolate', name: 'Chocolate', group: 'matter', ord: 8, add: ['sweet', 'edible'], tint: 0x6a3a1f, tintAmt: 0.75, mat: 'food', bump: 0, emoji: '🍫', sources: ['Chocolate', 'Cocoa'] },
  { id: 'liquid', name: 'Liquid', group: 'matter', ord: 8, add: ['liquid', 'wet'], remove: ['hard'], tint: 0x5ab0ff, tintAmt: 0.3, mat: 'liquid', bump: 0, fx: ['wobble'], emoji: '💧', sources: ['Blender', 'Solvent', 'Melting Pot'] },
  { id: 'plasma', name: 'Plasma', group: 'matter', ord: 8, add: ['energy', 'hot'], tint: 0xd05aff, tintAmt: 0.55, glow: 1, glowColor: 0xd05aff, mat: 'energy', mass: 0.2, bump: 2, fx: ['pulse', 'sparkle'], emoji: '🟣', sources: ['Plasma', 'Plasma Ball', 'Fusion'] },
  // ---- age
  { id: 'ancient', name: 'Ancient', group: 'age', ord: 2, add: ['ancient'], tint: 0xc8b48a, tintAmt: 0.35, bump: 1, emoji: '🏺', sources: ['Time', 'Ruins', 'Pyramid', 'Hourglass', 'Archaeologist', 'Relic'] },
  { id: 'baby', name: 'Baby', group: 'age', ord: 2, add: ['tiny', 'soft'], remove: ['huge'], scale: 0.7, mass: 0.4, bump: 0, emoji: '🍼', sources: ['Baby', 'Cradle', 'Stork', 'Pacifier', 'Diaper'] },
  { id: 'elder', name: 'Elder', group: 'age', ord: 2, add: ['ancient', 'knowledge'], tint: 0xb8b8c8, tintAmt: 0.25, bump: 1, emoji: '🧓', sources: ['Old Man', 'Wisdom', 'Beard', 'Grandma'] },
  { id: 'futuristic', name: 'Futuristic', group: 'age', ord: 2, add: ['digital', 'machine'], tint: 0x5ae8ff, tintAmt: 0.35, glow: 0.4, glowColor: 0x5ae8ff, bump: 1, fx: ['scan'], emoji: '🔮', sources: ['Future', 'Time Machine', 'Hologram', 'Science Fiction'] },
  { id: 'prehistoric', name: 'Prehistoric', group: 'age', ord: 2, add: ['ancient', 'huge'], tint: 0x8a9a5a, tintAmt: 0.3, bump: 1, emoji: '🦖', sources: ['Dinosaur', 'Caveman', 'Mammoth'] },
  // ---- alignment
  { id: 'cursed', name: 'Cursed', group: 'align', ord: 6, add: ['evil', 'magic', 'dark'], remove: ['holy'], tint: 0x6a1a8a, tintAmt: 0.45, glow: 0.4, glowColor: 0x9a2aff, bump: 1, fx: ['smoke'], emoji: '🧿', sources: ['Curse', 'Witch', 'Voodoo Doll', 'Black Cat', 'Hex'] },
  { id: 'holy', name: 'Holy', group: 'align', ord: 6, add: ['holy', 'light'], remove: ['evil'], tint: 0xfff2b8, tintAmt: 0.4, glow: 0.6, glowColor: 0xfff0a0, bump: 1, fx: ['halo'], emoji: '😇', sources: ['Angel', 'Halo', 'Church', 'Holy Water', 'Priest'] },
  { id: 'demonic', name: 'Demonic', group: 'align', ord: 6, add: ['evil', 'fire', 'hot'], remove: ['holy'], tint: 0xa81a1a, tintAmt: 0.5, glow: 0.5, glowColor: 0xff2a1a, bump: 2, fx: ['horns', 'flames'], emoji: '😈', sources: ['Demon', 'Hell', 'Devil', 'Pentagram'] },
  { id: 'divine', name: 'Divine', group: 'align', ord: 6, add: ['holy', 'cosmic', 'light'], remove: ['evil'], tint: 0xfff6d8, tintAmt: 0.5, glow: 0.9, glowColor: 0xfff4c0, bump: 3, fx: ['halo', 'sparkle'], emoji: '✨', sources: ['God', 'Heaven', 'Miracle'] },
  // ---- beings
  { id: 'robotic', name: 'Robotic', group: 'being', ord: 7, add: ['machine', 'metal', 'electric'], remove: ['living', 'soft'], tint: 0xb8c0c8, tintAmt: 0.6, mat: 'metal', mass: 1.8, bump: 1, fx: ['antenna'], emoji: '🤖', sources: ['Robot', 'Cyborg', 'Circuit', 'Microchip', 'Android'] },
  { id: 'zombie', name: 'Zombie', group: 'being', ord: 7, add: ['death', 'evil', 'poison'], tint: 0x7aa85a, tintAmt: 0.5, bump: 1, fx: ['smoke'], emoji: '🧟', sources: ['Zombie', 'Virus', 'Necromancer', 'Plague'] },
  { id: 'haunted', name: 'Haunted', group: 'being', ord: 7, add: ['evil', 'dark', 'magic'], tint: 0xd8d8f8, tintAmt: 0.35, opacity: 0.55, bump: 1, fx: ['ghost'], emoji: '👻', sources: ['Ghost', 'Haunted House', 'Spirit', 'Poltergeist'] },
  { id: 'mutant', name: 'Mutant', group: 'being', ord: 7, add: ['poison', 'living'], tint: 0x8aff3a, tintAmt: 0.45, glow: 0.5, glowColor: 0x8aff3a, scale: 1.15, bump: 1, fx: ['pulse'], emoji: '🧬', sources: ['Radiation', 'Mutation', 'Toxic Waste', 'Uranium'] },
  { id: 'vampire', name: 'Vampire', group: 'being', ord: 7, add: ['evil', 'dark', 'death'], tint: 0x5a0a1a, tintAmt: 0.45, bump: 1, fx: ['cape'], emoji: '🧛', sources: ['Vampire', 'Blood', 'Bat'] },
  { id: 'cyber', name: 'Cyber', group: 'being', ord: 7, add: ['digital', 'electric'], tint: 0x3affd0, tintAmt: 0.4, glow: 0.6, glowColor: 0x3affd0, bump: 1, fx: ['scan'], emoji: '🌐', sources: ['Internet', 'Hacker', 'Cyberspace'] },
  // ---- energy
  { id: 'electric', name: 'Electric', group: 'energy', ord: 5, add: ['electric', 'energy'], tint: 0xffe83a, tintAmt: 0.35, glow: 0.7, glowColor: 0xfff05a, bump: 1, fx: ['sparks'], emoji: '⚡', sources: ['Electricity', 'Lightning', 'Battery', 'Spark', 'Thunderstorm'] },
  { id: 'magnetic', name: 'Magnetic', group: 'energy', ord: 5, add: ['metal', 'electric'], tint: 0xe8303a, tintAmt: 0.25, bump: 0, fx: ['orbit'], emoji: '🧲', sources: ['Magnet', 'Compass', 'Lodestone'] },
  { id: 'atomic', name: 'Atomic', group: 'energy', ord: 5, add: ['energy', 'explosive', 'poison'], tint: 0x7aff5a, tintAmt: 0.4, glow: 0.8, glowColor: 0x7aff5a, bump: 2, fx: ['orbit', 'pulse'], emoji: '☢️', sources: ['Nuclear Reactor', 'Atomic Bomb'] },
  { id: 'quantum', name: 'Quantum', group: 'energy', ord: 5, add: ['cosmic', 'magic'], tint: 0x9a7aff, tintAmt: 0.45, glow: 0.7, glowColor: 0xa88aff, opacity: 0.8, bump: 3, fx: ['glitch', 'orbit'], emoji: '⚛️', sources: ['Quantum', 'Quantum Computer', 'Particle Accelerator'] },
  // ---- light & colour
  { id: 'shadow', name: 'Shadow', group: 'light', ord: 5, add: ['dark'], remove: ['light'], tint: 0x1a1428, tintAmt: 0.75, bump: 1, fx: ['smoke'], emoji: '🌑', sources: ['Shadow', 'Darkness', 'Night', 'Eclipse'] },
  { id: 'radiant', name: 'Radiant', group: 'light', ord: 5, add: ['light'], remove: ['dark'], tint: 0xfff6c0, tintAmt: 0.3, glow: 1, glowColor: 0xfff2a0, bump: 1, fx: ['sparkle'], emoji: '🌟', sources: ['Light', 'Glowstick', 'Firefly', 'Lightbulb', 'Lantern'] },
  { id: 'neon', name: 'Neon', group: 'light', ord: 5, add: ['light', 'electric'], tint: 0xff3ad8, tintAmt: 0.55, glow: 1, glowColor: 0xff3ad8, mat: 'energy', bump: 1, emoji: '💡', sources: ['Neon', 'Neon Sign', 'Synthwave'] },
  { id: 'invisible', name: 'Invisible', group: 'light', ord: 5, add: ['magic'], opacity: 0.18, bump: 2, emoji: '🫥', sources: ['Invisibility Cloak', 'Invisibility Potion', 'Chameleon'] },
  { id: 'rainbow', name: 'Rainbow', group: 'light', ord: 5, add: ['light', 'magic'], tint: 0xff7ad9, tintAmt: 0.2, glow: 0.4, glowColor: 0xffffff, bump: 1, fx: ['rainbow'], emoji: '🌈', sources: ['Rainbow', 'Prism', 'Unicorn'] },
  { id: 'sparkly', name: 'Sparkly', group: 'light', ord: 5, add: ['light', 'magic'], glow: 0.3, glowColor: 0xffe8ff, bump: 0, fx: ['sparkle'], emoji: '✨', sources: ['Glitter', 'Disco Ball', 'Sparkle'] },
  // ---- realm
  { id: 'cosmic', name: 'Cosmic', group: 'realm', ord: 5, add: ['cosmic', 'magic'], tint: 0x3a2a8a, tintAmt: 0.55, glow: 0.6, glowColor: 0x8a6aff, bump: 2, fx: ['stars'], emoji: '🌌', sources: ['Space', 'Galaxy', 'Star', 'Universe', 'Nebula'] },
  { id: 'void', name: 'Void', group: 'realm', ord: 5, add: ['dark', 'cosmic', 'death'], tint: 0x0a0612, tintAmt: 0.8, glow: 0.4, glowColor: 0x6a3aff, bump: 2, fx: ['smoke'], emoji: '⬛', sources: ['Void', 'Black Hole', 'Abyss'] },
  { id: 'aquatic', name: 'Aquatic', group: 'realm', ord: 5, add: ['sea', 'wet'], tint: 0x2a8ad8, tintAmt: 0.35, bump: 0, fx: ['bubbles'], emoji: '🐠', sources: ['Coral Reef', 'Submarine', 'Aquarium'] },
  // ---- titles (suffixes)
  { id: 'king', name: 'King', pos: 'suf', group: 'title', ord: 10, add: ['money', 'huge'], scale: 1.12, bump: 1, fx: ['crown'], emoji: '👑', sources: ['Crown', 'King', 'Throne', 'Scepter'] },
  { id: 'queen', name: 'Queen', pos: 'suf', group: 'title', ord: 10, add: ['money'], bump: 1, fx: ['tiara'], emoji: '👸', sources: ['Queen', 'Tiara'] },
  { id: 'super', name: 'Super', group: 'title', ord: 0, add: ['holy', 'fast', 'energy'], bump: 1, fx: ['cape'], emoji: '🦸', sources: ['Superhero', 'Cape', 'Hero'] },
  // ---- style
  { id: 'ninja', name: 'Ninja', group: 'style', ord: 9, add: ['dark', 'fast', 'weapon'], tint: 0x1a1a24, tintAmt: 0.5, bump: 1, fx: ['headband'], emoji: '🥷', sources: ['Ninja', 'Shuriken', 'Katana'] },
  { id: 'pirate', name: 'Pirate', group: 'style', ord: 9, add: ['sea', 'evil'], bump: 1, fx: ['piratehat'], emoji: '🏴‍☠️', sources: ['Pirate', 'Treasure Map', 'Pirate Ship', 'Eyepatch'] },
  { id: 'steampunk', name: 'Steampunk', group: 'style', ord: 9, add: ['machine', 'metal', 'ancient'], tint: 0xb08a4a, tintAmt: 0.45, bump: 1, fx: ['gears'], emoji: '⚙️', sources: ['Steam Engine', 'Gear', 'Clockwork'] },
  { id: 'armored', name: 'Armored', group: 'style', ord: 9, add: ['metal', 'hard', 'weapon'], tint: 0xa8b0b8, tintAmt: 0.45, mat: 'metal', mass: 1.8, bump: 1, fx: ['plates'], emoji: '🛡️', sources: ['Armor', 'Shield', 'Knight', 'Chainmail'] },
  // ---- texture
  { id: 'sticky', name: 'Sticky', group: 'texture', ord: 3, add: ['sticky'], tint: 0xf2a91a, tintAmt: 0.2, bump: 0, fx: ['drip'], emoji: '🍯', sources: ['Glue', 'Honey', 'Slime', 'Tape', 'Syrup', 'Gum'] },
  { id: 'fluffy', name: 'Fluffy', group: 'texture', ord: 3, add: ['soft'], remove: ['hard', 'sharp'], tint: 0xfdf8ff, tintAmt: 0.45, mat: 'cloth', scale: 1.1, mass: 0.5, bump: 0, emoji: '☁️', sources: ['Wool', 'Cotton', 'Feather', 'Pillow'] },
  { id: 'spiky', name: 'Spiky', group: 'texture', ord: 3, add: ['sharp'], remove: ['soft'], bump: 0, fx: ['spikes'], emoji: '🦔', sources: ['Cactus', 'Thorn', 'Porcupine', 'Hedgehog', 'Spike'] },
  { id: 'furry', name: 'Furry', group: 'texture', ord: 3, add: ['soft'], tint: 0xb5835a, tintAmt: 0.35, mat: 'cloth', bump: 0, emoji: '🦊', sources: ['Fur', 'Hair', 'Wig'] },
  { id: 'inflatable', name: 'Inflatable', group: 'texture', ord: 3, add: ['air', 'plastic', 'soft'], remove: ['hard'], tint: 0xff5a8a, tintAmt: 0.3, mat: 'plastic', scale: 1.15, mass: 0.12, bump: 0, emoji: '🎈', sources: ['Balloon', 'Helium', 'Air Pump'] },
  // ---- condition
  { id: 'rusty', name: 'Rusty', group: 'cond', ord: 3, add: ['ancient'], tint: 0xb7410e, tintAmt: 0.5, bump: 0, emoji: '🟠', sources: ['Rust', 'Corrosion', 'Scrapyard', 'Junk'] },
  { id: 'soggy', name: 'Soggy', group: 'cond', ord: 3, add: ['wet'], remove: ['dry'], tint: 0x6a8aa8, tintAmt: 0.25, mass: 1.3, bump: 0, fx: ['drip'], emoji: '💦', sources: ['Sponge', 'Puddle', 'Bath'] },
  { id: 'glitched', name: 'Glitched', group: 'cond', ord: 3, add: ['digital'], tint: 0xff3aff, tintAmt: 0.25, bump: 2, fx: ['glitch'], emoji: '👾', sources: ['Glitch', 'Software Bug', 'Computer Virus', 'Error'] },
  { id: 'pixel', name: 'Pixel', group: 'cond', ord: 3, add: ['digital'], bump: 1, fx: ['pixel'], emoji: '🟪', sources: ['Pixel', 'Video Game', 'Arcade', 'Game Console'] },
  // ---- cooking & flavour
  { id: 'spicy', name: 'Spicy', group: 'flavor', ord: 3, add: ['hot'], tint: 0xe2231a, tintAmt: 0.3, bump: 0, fx: ['steam'], emoji: '🌶️', sources: ['Chili', 'Pepper', 'Hot Sauce', 'Wasabi', 'Curry'] },
  { id: 'cooked', name: 'Cooked', group: 'flavor', ord: 3, add: ['edible', 'hot'], remove: ['living'], tint: 0xb06a2a, tintAmt: 0.45, bump: 0, fx: ['steam'], emoji: '🍳', requires: ['edible', 'living', 'plant', 'animal'], sources: ['Oven', 'Grill', 'Barbecue', 'Frying Pan', 'Stove', 'Microwave'] },
  { id: 'burnt', name: 'Burnt', group: 'flavor', ord: 3, add: ['dry', 'dark'], remove: ['living', 'wet'], tint: 0x2a1a12, tintAmt: 0.7, bump: 0, fx: ['smoke'], emoji: '🫠', requires: ['edible', 'living', 'plant', 'animal', 'wood', 'paper', 'cloth'], sources: ['Charcoal', 'Ash', 'Soot'] },
  { id: 'toxic', name: 'Toxic', group: 'flavor', ord: 3, add: ['poison'], tint: 0x7ad13b, tintAmt: 0.45, glow: 0.35, glowColor: 0x8aff3a, bump: 0, fx: ['bubbles'], emoji: '☠️', sources: ['Poison', 'Venom', 'Pollution', 'Acid'] },
  // ---- mood
  { id: 'wild', name: 'Wild', group: 'mood', ord: 0, add: ['fast'], bump: 0, emoji: '🌿', sources: ['Jungle', 'Wilderness', 'Savanna', 'Safari'] },
  { id: 'jolly', name: 'Jolly', group: 'mood', ord: 0, add: ['emotion', 'light'], bump: 0, fx: ['bounce'], emoji: '😄', sources: ['Joy', 'Party', 'Smile', 'Laughter'] },
  { id: 'sad', name: 'Sad', group: 'mood', ord: 0, add: ['emotion', 'wet'], tint: 0x5a8ad8, tintAmt: 0.25, bump: 0, fx: ['rainy'], emoji: '😢', sources: ['Sadness', 'Tears'] },
  { id: 'angry', name: 'Angry', group: 'mood', ord: 0, add: ['emotion', 'hot'], tint: 0xe83a2a, tintAmt: 0.3, bump: 0, fx: ['shake'], emoji: '😠', sources: ['Anger', 'Rage'] },
  { id: 'lovely', name: 'Lovely', group: 'mood', ord: 0, add: ['emotion', 'soft'], tint: 0xff7ab0, tintAmt: 0.3, glow: 0.3, glowColor: 0xff7ab0, bump: 0, fx: ['hearts'], emoji: '💖', sources: ['Love', 'Heart', 'Cupid', 'Kiss', 'Rose'] },
  { id: 'dreamy', name: 'Dreamy', group: 'mood', ord: 0, add: ['magic', 'soft'], tint: 0xc8a8ff, tintAmt: 0.3, glow: 0.3, glowColor: 0xc8a8ff, bump: 0, fx: ['zzz'], emoji: '💭', sources: ['Dream', 'Sleep', 'Lullaby', 'Bed'] },
  // ---- mind
  { id: 'genius', name: 'Genius', group: 'mind', ord: 0, add: ['knowledge'], bump: 1, fx: ['glasses'], emoji: '🧠', sources: ['Brain', 'Genius', 'Knowledge', 'Library', 'Professor'] },
  { id: 'musical', name: 'Musical', group: 'mind', ord: 0, add: ['music', 'sound'], bump: 0, fx: ['notes'], emoji: '🎵', sources: ['Music', 'Song', 'Melody', 'Piano'] },
  { id: 'enchanted', name: 'Enchanted', group: 'mind', ord: 6, add: ['magic'], tint: 0xb04dff, tintAmt: 0.3, glow: 0.6, glowColor: 0xc05cff, bump: 1, fx: ['sparkle', 'orbit'], emoji: '🪄', sources: ['Magic', 'Wand', 'Spell', 'Wizard', 'Spellbook', 'Potion'] },
  { id: 'lucky', name: 'Lucky', group: 'mind', ord: 0, add: ['magic'], tint: 0x3ae05a, tintAmt: 0.2, bump: 1, fx: ['sparkle'], emoji: '🍀', sources: ['Clover', 'Four-Leaf Clover', 'Horseshoe', 'Lucky Charm'] },
  // ---- legend (rare, powerful)
  { id: 'mythic', name: 'Mythic', group: 'legend', ord: 6, add: ['mythical', 'magic'], glow: 0.7, glowColor: 0xffd23a, bump: 3, fx: ['sparkle', 'halo'], emoji: '🐉', sources: ['Legend', 'Myth'] },
  { id: 'eternal', name: 'Eternal', group: 'legend', ord: 6, add: ['time', 'holy'], glow: 0.8, glowColor: 0xe8d8ff, bump: 3, fx: ['orbit', 'sparkle'], emoji: '♾️', sources: ['Eternity', 'Infinity', 'Immortality'] },
  // ---- form
  { id: 'explosive', name: 'Explosive', group: 'form', ord: 5, add: ['explosive'], tint: 0xe8302a, tintAmt: 0.2, bump: 1, fx: ['fuse', 'pulse'], emoji: '💣', sources: ['Dynamite', 'Bomb', 'TNT', 'Gunpowder', 'Firework'] },
  { id: 'winged', name: 'Winged', group: 'form', ord: 5, add: ['flying', 'sky'], mass: 0.7, bump: 1, fx: ['wings'], emoji: '🪽', sources: ['Wing', 'Jetpack', 'Pegasus'] },
];

// Modifier lookups are filled in by the universe once core items are parsed.
const MOD_BY_ID = new Map(MODIFIER_DEFS.map((m, i) => { m.index = i; m.pos = m.pos || 'pre'; return [m.id, m]; }));
