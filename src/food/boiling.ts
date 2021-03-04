import { DyeColor, Location, Material, SoundCategory } from 'org.bukkit';
import { Levelled } from 'org.bukkit.block.data';
import {
  PlayerInteractEntityEvent,
  PlayerInteractEvent,
} from 'org.bukkit.event.player';
import * as yup from 'yup';
import {
  Action,
  BlockBreakEvent,
  BlockFromToEvent,
  BlockPlaceEvent,
  CauldronLevelChangeEvent,
} from 'org.bukkit.event.block';
import { CustomItem } from '../common/items/CustomItem';
import { EntityType, ItemFrame } from 'org.bukkit.entity';
import { ScoopEmpty } from '../hydration/bottles';
import { Class } from 'java.lang';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { BlockFace } from 'org.bukkit.block';
import { locationToObj, objToLocation } from '../death/helpers';
import { SpawnReason } from 'org.bukkit.event.entity.CreatureSpawnEvent';
import { LeatherArmorMeta } from 'org.bukkit.inventory.meta';
import { ItemSpawnEvent } from 'org.bukkit.event.entity';
import { VkItem } from '../common/items/VkItem';
import { EventPriority } from 'org.bukkit.event';
import { Campfire } from 'org.bukkit.block.data.type';

/**
 * Ingredient schema
 */
export const IngredientSchema = yup.object({
  /**
   * Material name
   */
  name: yup.string().required(),

  /**
   * Material modelId for custom items
   */
  modelId: yup.number().optional(),

  /**
   * Date when the ingredient was added
   */
  date: yup.number().required(),

  /**
   * Temperature when the ingredient was added
   */
  temp: yup.number().required(),
});

/**
 * Brew in a itemframe
 */
export const Brew = new CustomItem({
  id: 1000,
  type: VkItem.COLORABLE,
  modelId: 1000,
  data: {
    ingredients: yup
      .array()
      .of(IngredientSchema.required())
      .default([])
      .required(),

    /**
     * Location of the owning cauldron
     */
    cauldron: yup
      .object({
        x: yup.number().required(),
        y: yup.number().required(),
        z: yup.number().required(),
        worldId: yup.string().required(),
      })
      .required(),

    /**
     * Date when the brew was created
     */
    date: yup.number().required(),

    /**
     * Current heat source information
     */
    heatSource: yup
      .object({
        /**
         * Current state of the heat source.
         * Indicates is the brew heating up or cooling down
         */
        exists: yup.boolean().optional(),

        /**
         * Time since the heat source had changed.
         * Used to calculate elapsed time for the calculateWaterTemp() function
         */
        since: yup.number().required(),

        /**
         * Temperature at the time the heat source changed.
         * Used as the initial value for the temperature function
         */
        temp: yup.number().required(),
      })
      .required(),
  },
});

/**
 * Brew schema for containers.
 * Other features depending on boiling might find this useful
 * @see BrewBucket for example
 */
export const BrewContainerSchema = {
  ingredients: yup.array().of(IngredientSchema).required(),

  /**
   * Date when the brew was put into this container
   */
  date: yup.number().required(),

  /**
   * Date when the brew was created
   */
  brewDate: yup.number().required(),

  /**
   * Brew temperature when put into this container
   */
  temp: yup.number().required(),
};

/**
 * Brew in a bucket
 */
export const BrewBucket = new CustomItem({
  id: 1,
  type: VkItem.COLORABLE,
  modelId: 1,
  name: 'Sotkua',
  data: {
    ...BrewContainerSchema,
  },
});

/**
 * Define ingredient.
 * Each ingredient can have multiple nested ingredients for each modelId
 */
export type Ingredient = {
  [x in string | number]: Ingredient | IngredientProperties;
};

/**
 * Define properties for ingredient
 */
export type IngredientProperties = {
  /**
   * Ingredient effect on brew color
   */
  color?: DyeColor;

  /**
   * Short description about the ingredient
   */
  description?: string;

  /**
   * The highest temperature the ingredient can withstand
   */
  tempMax?: number;
};

/**
 * Static list of valid ingredients and their properties.
 */
export const INGREDIENTS: Ingredient = {
  APPLE: { color: DyeColor.RED, description: 'hedelmiä' },
  PORKCHOP: { color: DyeColor.PINK, description: 'lihaa' },
  COD: { color: DyeColor.PINK, description: 'kalaa' },
  SALMON: { color: DyeColor.PINK, description: 'kalaa' },
  TROPICAL_FISH: { color: DyeColor.PINK, description: 'kalaa' },
  PUFFERFISH: { color: DyeColor.PINK, description: 'myrkkyä' },
  MELON_SLICE: { color: DyeColor.RED, description: 'sokeria' },
  BEEF: { color: DyeColor.RED, description: 'lihaa' },
  CHICKEN: { color: DyeColor.PINK, description: 'lihaa' },
  CARROT: { color: DyeColor.ORANGE, description: 'juureksia' },
  COCOA_BEANS: { color: DyeColor.BROWN, description: 'kaakaota' },
  POTATO: { color: DyeColor.YELLOW, description: 'juureksia' },
  RABBIT: { color: DyeColor.RED, description: 'lihaa' },
  MUTTON: { color: DyeColor.RED, description: 'lihaa' },
  SWEET_BERRIES: { color: DyeColor.RED, description: 'marjoja' },
  HONEYCOMB: { color: DyeColor.YELLOW, description: 'hunajaa' },
  BROWN_MUSHROOM: { color: DyeColor.BROWN, description: 'sieniä' },
  RED_MUSHROOM: { color: DyeColor.BROWN, description: 'myrkkyä' },
  SUGAR_CANE: { color: DyeColor.BROWN, description: 'sokeria' },
  EGG: { description: 'kananmunia' },
  SUGAR: { color: DyeColor.WHITE, description: 'sokeria' },
  NETHER_WART: {
    color: DyeColor.WHITE,
    description: 'hiivaa',
    tempMax: 50.0,
  },
  TWISTING_VINES: {
    color: DyeColor.GREEN,
    description: 'yrttejä',
  },
  WHEAT: { color: DyeColor.YELLOW, description: 'viljaa' },
  POISONOUS_POTATO: {
    1: {
      color: DyeColor.YELLOW,
      description: 'juustoa',
    },
    2: {
      color: DyeColor.BROWN,
      description: 'lihaa',
    },
    5: {
      color: DyeColor.YELLOW,
      description: 'sokeria',
    },
    6: {
      color: DyeColor.RED,
      description: 'lihaa',
    },
    8: {
      color: DyeColor.BROWN,
      description: 'kaakaota',
    },
    19: {
      color: DyeColor.RED,
      description: 'hedelmiä',
    },
    20: {
      color: DyeColor.RED,
      description: 'marjoja',
    },
    21: {
      color: DyeColor.LIME,
      description: 'hedelmiä',
    },
    23: {
      color: DyeColor.PINK,
      description: 'lihaa',
    },
    26: {
      color: DyeColor.BLUE,
      description: 'marjoja',
    },
    28: {
      color: DyeColor.BROWN,
      description: 'kahvia',
    },
  },
};

/**
 * Retrieve ingredient properties for material
 * @param name material name
 * @param modelId for nested ingredients
 */
export function getIngredientProperties(
  name: string,
  modelId?: number,
): IngredientProperties | undefined {
  if (modelId /* && Object.values(VkItem).includes(Material.valueOf(name)) */) {
    return (INGREDIENTS[name] as Ingredient)[modelId];
  }

  return INGREDIENTS[name];
}

/**
 * Return a list of items frames at given location
 * @param location
 */
function getItemFramesAt(location: Location) {
  return location.getNearbyEntitiesByType(
    Class.forName('org.bukkit.entity.ItemFrame'),
    0.5,
  );
}

/**
 * Create new brew itemframe at given location
 * @param location must be the location of a cauldron
 */
export function spawnBrewItem(location: Location) {
  // Return if the face is obstructed
  if (!getItemFramesAt(location).isEmpty()) return;

  // Spawn new itemframe
  const itemFrame = location.world.spawnEntity(
    location,
    EntityType.ITEM_FRAME,
    SpawnReason.CUSTOM,
    {
      accept(itemFrame: ItemFrame) {
        itemFrame.setFacingDirection(BlockFace.UP, true);
        itemFrame.setVisible(false);
        itemFrame.setInvulnerable(true);
        itemFrame.setSilent(true);
        itemFrame.setFixed(true);
      },
    },
  ) as ItemFrame;

  // Create new brew item
  const itemFrameItem = Brew.create({
    cauldron: locationToObj(location.subtract(0.0, 1.0, 0.0)),
    date: Date.now(),
    heatSource: {
      exists: true,
      since: Date.now(),
      temp: 20.0, // ? Could biome temperature be used here to get ambient temperature?
    },
  });

  // Set default color
  const meta = itemFrameItem.itemMeta as LeatherArmorMeta;
  meta.color = DyeColor.BLUE.color;
  itemFrameItem.itemMeta = meta;

  itemFrame.setItem(itemFrameItem, false);
}

/**
 * Search and retrieve the first found brew itemframe
 * @param location
 */
export function getBrewItemFrame(location: Location): ItemFrame | undefined {
  for (const itemFrame of getItemFramesAt(location)) {
    if (Brew.check(itemFrame.item)) return itemFrame;
  }

  return;
}

/**
 * Search and destroy itemframes containing a brew item
 * @param location
 */
function removeBrewItem(location: Location) {
  // Check all detected frames
  for (const entity of getItemFramesAt(location)) {
    if (Brew.check((entity as ItemFrame).item)) entity.remove();
  }
}

/**
 * Check that the given location has a valid heat source
 * @param location
 */
export function hasValidHeatSource(location: Location): boolean {
  // Create a clone of location (so we don't modify original)
  // ? Is there a more clean way to do this
  location = location.clone();
  return (
    location.subtract(0.0, 1.0, 0.0).block.type === Material.CAMPFIRE ||
    (location.block.type === Material.FIRE &&
      location.subtract(0.0, 1.0, 0.0).block.type === Material.NETHERRACK)
  );
}

/**
 * Check that the location is of a cauldron and it has a valid heat source
 * @param location expected to be the location of a cauldron
 */
export function isValidBrewStation(location: Location): boolean {
  return (
    location.block.type == Material.CAULDRON && hasValidHeatSource(location)
  );
}

/**
 * Newton's Law of Cooling. Was used to calculate the time of death, but works fine in here too!
 * Result is in one decimal precision.
 * @param time in seconds
 */
export function calculateTemp(
  from: number,
  to: number,
  time: number,
  constant: number,
): number {
  return (
    Math.round((to + (from - to) * Math.pow(Math.E, constant * time)) * 10.0) /
    10.0
  );
}

/**
 * Water temperature as the function of time
 * @param time in seconds
 */
export function calculateWaterTemp(
  from: number,
  to: number,
  time: number,
): number {
  return calculateTemp(from, to, time, -0.035);
}

/**
 * Update brew heat source information
 */
function setBrewHeatSource(brewItemFrame: ItemFrame, exists: boolean) {
  const brewItem = brewItemFrame.item;

  const brew = Brew.get(brewItem);

  if (!brew) return;

  // Keep track of temperature
  const temp = calculateWaterTemp(
    brew.heatSource.temp,
    brew.heatSource.exists ? 100.0 : 20.0,
    (Date.now() - brew.heatSource.since) / 1000.0,
  );

  brew.heatSource = {
    exists,
    since: Date.now(),
    temp,
  };

  brewItemFrame.setItem(brewItem, false);
}

/**
 * Create BrewContainerSchema from Brew
 * @example BrewBucket.create(createBrewContainer(brew))
 */
export function createBrewContainer(brew: any) {
  return {
    ingredients: brew.ingredients,
    date: Date.now(),
    brewDate: brew.date,
    temp: calculateWaterTemp(
      brew.heatSource.temp,
      brew.heatSource.exists ? 100.0 : 20.0,
      (Date.now() - brew.heatSource.since) / 1000.0,
    ),
  };
}

/**
 * Handle player interaction with a brew
 */
Brew.event(
  PlayerInteractEntityEvent,
  (event) => (event.rightClicked as ItemFrame).item,
  async (event) => {
    // Return if cancelled by the validation event
    if (event.isCancelled()) return;

    // Check if main hand
    if (event.hand != EquipmentSlot.HAND) return;

    const item = event.player.inventory.itemInMainHand;

    const itemFrame = event.rightClicked as ItemFrame;

    const itemFrameItem = itemFrame.item;

    const brew = Brew.get(itemFrameItem);

    if (!brew || !brew.ingredients) return;

    // Calculate current water temperature
    const waterTemp = calculateWaterTemp(
      brew.heatSource.temp,
      brew.heatSource.exists ? 100.0 : 20.0,
      (Date.now() - brew.heatSource.since) / 1000.0,
    );

    // Describe ingredients if clicked with a empty scoop
    if (ScoopEmpty.check(item)) {
      let description = '';

      // Different water temperature states
      if (waterTemp < 25) {
        description = 'Vesi on haaleaa';
      } else if (waterTemp > 24 && waterTemp < 41) {
        description = 'Vesi on lämmintä';
      } else if (waterTemp > 40 && waterTemp < 96) {
        description = 'Vesi on kuumaa';
      } else if (waterTemp > 95) {
        description = 'Vesi on kiehuvaa';
      }

      // If none ingredients
      if (brew.ingredients.length < 1) {
        event.player.sendMessage(description);
        return;
      }

      // Generate descriptions from the ingredients
      const descriptions = brew.ingredients
        .map(
          (ingredient) =>
            getIngredientProperties(ingredient.name, ingredient.modelId)
              ?.description,
        )
        .filter((ingredient, index, self) => self.indexOf(ingredient) == index);

      // Join descriptions into one string and replace the last delimiter with 'ja'
      description +=
        ' ja siinä vaikuttaisi olevan ' +
        descriptions.join(', ').replace(/,([^,]*)$/, ' ja$1');

      event.player.sendMessage(description);

      event.player.world.playSound(
        itemFrame.location,
        'item.bucket.fill_fish',
        SoundCategory.PLAYERS,
        1.0,
        1.0,
      );

      return;
    }

    // Retrieve ingredient properties
    const properties = getIngredientProperties(
      item.type.toString(),
      item.itemMeta.hasCustomModelData()
        ? item.itemMeta.customModelData
        : undefined,
    );

    // Return if not a valid ingredient
    // Somehow a custom item with modelId 0 is not undefined even though has no own data. Probably a TS feature because it has nested data.
    // Prevented by just checking if it has one of the ingredient properties
    if (!properties || !properties.description) return;

    // Limit ingredient amount
    if (brew.ingredients.length >= 18) {
      event.player.sendMessage('Pata on täysi');
      return;
    }

    // Add ingredient to brew
    brew.ingredients.push({
      name: item.type.toString(),
      modelId: item.itemMeta.hasCustomModelData()
        ? item.itemMeta.customModelData
        : undefined,
      date: Date.now(),
      temp: waterTemp,
    });

    // Update brew color
    if (properties && properties.color) {
      const meta = itemFrameItem.itemMeta as LeatherArmorMeta;
      meta.color = properties.color.color.mixColors(meta.color);
      itemFrameItem.itemMeta = meta;
    }

    // Update item frame item after modify
    itemFrame.setItem(itemFrameItem, false);

    // Remove item from player
    item.amount -= 1;

    // Alternative sound effect
    // event.player.world.playSound(
    //   itemFrame.location,
    //   Sound.ENTITY_ITEM_PICKUP,
    //   0.2,
    //   Math.random(),
    // );

    // Splash sound effect
    event.player.world.playSound(
      itemFrame.location,
      'entity.generic.splash',
      SoundCategory.PLAYERS,
      0.5,
      1.0,
    );
  },
);

/**
 * Puts the brew into a bucket by default.
 * Can be cancelled by some other feature for custom behaviour.
 * Possible cases could be custom foods, drinks, potions etc...
 *
 * TODO: set event priority to highest to be called last
 * TODO: set event property ignoreCancelled
 */
Brew.event(
  PlayerInteractEntityEvent,
  (event) => (event.rightClicked as ItemFrame).item,
  async (event) => {
    // Return if cancelled by the validator or some other feature
    if (event.isCancelled()) return;

    // Check that player clicked with main hand
    if (event.hand != EquipmentSlot.HAND) return;

    const itemInMainHand = event.player.inventory.itemInMainHand;

    // Check that the item in main hand is a empty bucket
    if (itemInMainHand.type != Material.BUCKET) return;

    // No need to check entity type because it is already handled by the lower priority event
    const itemFrame = event.rightClicked as ItemFrame;

    const brew = Brew.get(itemFrame.item);

    // Make type checker happy
    if (!brew || !brew.ingredients) return;

    let brewBucketItem;

    // Create new bucket from brew. If brew has no ingredients, create a water bucket instead
    if (brew.ingredients.length > 0) {
      // Copy ingredients from brew to brew bucket
      brewBucketItem = BrewBucket.create(createBrewContainer(brew));

      // Set color
      const meta = brewBucketItem.itemMeta as LeatherArmorMeta;
      meta.color = (itemFrame.item.itemMeta as LeatherArmorMeta).color;
      brewBucketItem.itemMeta = meta;
    } else {
      brewBucketItem = new ItemStack(Material.WATER_BUCKET);
    }

    // Set owning cauldron empty
    const cauldron = objToLocation(brew.cauldron).block;
    const data = cauldron.blockData as Levelled;
    data.level = 0.0;
    cauldron.setBlockData(data, true);

    // Remove brew item
    event.rightClicked.remove();

    // Remove bucket
    itemInMainHand.amount -= 1;

    // Add new bucket
    event.player.inventory.addItem(brewBucketItem);

    event.player.world.playSound(
      cauldron.location,
      'item.bucket.fill',
      SoundCategory.PLAYERS,
      1.0,
      1.0,
    );
  },
);

/**
 * Validates player interaction with a itemframe that contains a brew item.
 */
registerEvent(
  PlayerInteractEntityEvent,
  (event) => {
    const itemFrame = event.rightClicked as ItemFrame;

    // Validate entity
    if (!itemFrame) return;

    const itemFrameItem = itemFrame.item;

    // Validate item
    if (!itemFrameItem) return;

    // Validate custom item
    // Prevents player from interacting with a entity that is marked for removal
    if (Brew.check(itemFrameItem)) event.setCancelled(itemFrame.isDead());
  },
  {
    priority: EventPriority.LOWEST, // listen in lowest priority so that this event is fired first
  },
);

/**
 * Spawn brew on a full cauldron if a valid heat source is created under it.
 * Also detects if a campfire is extinguished
 */
registerEvent(BlockPlaceEvent, (event) => {
  const block = event.block.getRelative(BlockFace.UP);

  // Check if the block above is a cauldron
  if (block.type != Material.CAULDRON) return;

  // Check if cauldron has now a valid heat source
  if (!hasValidHeatSource(block.location)) return;

  const data = block.blockData as Levelled;

  // Check that the cauldron is full
  if (data.level < data.maximumLevel) return;

  const brewItemFrame = getBrewItemFrame(block.location.add(0.0, 1.0, 0.0));

  if (brewItemFrame) {
    let state = true;

    // Check campfire state
    if (event.block.type === Material.CAMPFIRE) {
      state = (event.block.blockData as Campfire).isLit();
    }

    setBrewHeatSource(brewItemFrame, state);
  } else {
    spawnBrewItem(block.location.add(0.0, 1.0, 0.0));
  }
});

/**
 * Spawn a brew on cauldron if it's being filled with water and already has a heat source.
 * Also prevents removing or adding water.
 */
registerEvent(CauldronLevelChangeEvent, (event) => {
  const brewItemFrame = getBrewItemFrame(
    event.block.location.add(0.0, 1.0, 0.0),
  );

  // Prevent adding or removing water
  if (brewItemFrame) {
    event.setCancelled(true);
    return;
  }

  // Spawn brew only if cauldron's being filled to max
  if (event.newLevel < 3.0) return;

  // Check if there's a heat source under cauldron
  if (!hasValidHeatSource(event.block.location)) return;

  // Spawn new brew
  spawnBrewItem(event.block.location.add(0.0, 1.0, 0.0));
});

/**
 * Removes brew itemframes if a cauldron is broken.
 * Updates heat source information if a heat source is broken.
 */
registerEvent(BlockBreakEvent, (event) => {
  // Remove possible brew if a cauldron is broken
  if (event.block.type == Material.CAULDRON) {
    removeBrewItem(event.block.location.add(0.0, 1.0, 0.0));
    return;
  }

  const location = event.block.location.add(0.0, 1.0, 0.0);

  // Check if player broke the heat source of a brewing station
  if (isValidBrewStation(location)) {
    const brewItemFrame = getBrewItemFrame(location.add(0.0, 1.0, 0.0));

    if (!brewItemFrame) return;

    setBrewHeatSource(brewItemFrame, false);
  }
});

/**
 * Update heat source information if a other block destroys fire
 */
registerEvent(BlockFromToEvent, (event) => {
  const location = event.toBlock.location.add(0.0, 1.0, 0.0);

  // Check if the facing block acts as a heat source to a brewing station
  if (!isValidBrewStation(location)) return;

  const brewItemFrame = getBrewItemFrame(location.add(0.0, 1.0, 0.0));

  if (!brewItemFrame) return;

  setBrewHeatSource(brewItemFrame, false);
});

/**
 * Update heat source information if a campfire is about to get waterlogged
 */
registerEvent(PlayerInteractEvent, (event) => {
  if (
    event.action !== Action.RIGHT_CLICK_BLOCK ||
    event.clickedBlock?.type !== Material.CAMPFIRE
  )
    return;

  if (!event.item || event.item.type !== Material.WATER_BUCKET) return;

  const location = event.clickedBlock.location.add(0.0, 1.0, 0.0);

  if (!isValidBrewStation(location)) return;

  const brewItemFrame = getBrewItemFrame(location.add(0.0, 1.0, 0.0));

  if (!brewItemFrame) return;

  setBrewHeatSource(brewItemFrame, false);
});

/**
 * (Fallback) Prevent brew item from spawning
 */
Brew.event(
  ItemSpawnEvent,
  (event) => event.entity.itemStack,
  async (event) => {
    event.setCancelled(true);
  },
);

// /**
//  * Represents a cauldron that is used for boiling or mixing ingredients
//  */
// const Cauldron = new CustomBlock({
//   type: Material.CAULDRON,
//   data: {
//     ingredients: yup
//       .array()
//       .of(
//         yup.object().shape({
//           name: yup.string().required(),
//         }),
//       )
//       .default([]),
//   },
// });

// /*
//  * Custom Event System?
//  *
//  * Brew.event(BrewIngredientEvent, (event) => event.brewItemStack, async (event) => { event.player.sendMessage(`You put ${event.ingredient.name()} into the brew`) })
//  */

// /**
//  * Called when player adds ingredients to a brew
//  */
// export class BrewIngredientEvent extends Event {
//   player: Player;
//   brewItemStack: ItemStack;
//   brew: CustomItem<never>;
//   ingredient: Material;

//   constructor(
//     player: Player,
//     brewItemStack: ItemStack,
//     brew: CustomItem<never>,
//     ingredient: Material,
//   ) {
//     super();
//     this.player = player;
//     this.brewItemStack = brewItemStack;
//     this.brew = brew;
//     this.ingredient = ingredient;
//   }
// }

// /**
//  * Prevent brew item removal from the itemframe
//  */
// Brew.event(
//   EntityDamageByEntityEvent,
//   (event) => (event.entity as ItemFrame).item,
//   async (event) => {
//     event.setCancelled(true);
//   },
// );

// /**
//  * Prevent obstructed brew itemframe from breaking
//  */
// Brew.event(
//   HangingBreakEvent,
//   (event) => (event.entity as ItemFrame).item,
//   async (event) => {
//     log.info('ItemFrame wanted to break');
//     event.setCancelled(true);
//   },
// );

// /**
//  * Attempt to prevent brew from being bottled
//  */
// registerEvent(
//   PlayerInteractEvent,
//   (event) => {
//     if (
//       !event.clickedBlock ||
//       event.clickedBlock.type != Material.CAULDRON ||
//       !event.item ||
//       event.item.type != Material.GLASS_BOTTLE ||
//       event.action != Action.RIGHT_CLICK_BLOCK
//     )
//       return;

//     const brewItem = getBrewItemAt(
//       event.clickedBlock.location.add(0.0, 1.0, 0.0),
//     );

//     if (!brewItem) return;

//     event.player.sendMessage('Event cancelled');

//     event.setCancelled(true);
//   },
//   {
//     priority: EventPriority.HIGHEST,
//   },
// );

// /**
//  * Add dropped items to cauldron
//  */
// registerEvent(PlayerDropItemEvent, (event) => {
//   // Only track items that are listed as ingredients
//   //if (!INGREDIENTS.has(event.itemDrop)) return;

//   const DELAY = 250;

//   let time = 0;

//   const handle = setInterval(() => {
//     // Either location.block or getRelative(down)
//     const block = event.itemDrop.location.block;

//     if (block.type == Material.CAULDRON) {
//       const data = block.blockData as Levelled;

//       // Cauldron needs to be full
//       if (data.level == data.maximumLevel) {
//         event.itemDrop.setCanPlayerPickup(false);
//         event.itemDrop.setCanMobPickup(false);
//         event.itemDrop.teleport(block.location);

//         event.player.playSound(
//           block.location,
//           Sound.ENTITY_GENERIC_SPLASH,
//           0.5,
//           1.0,
//         );
//       }

//       clearInterval(handle);
//     }

//     // Failsafe to stop timer if landing is not detected
//     if (time > 10) {
//       clearInterval(handle);
//     }

//     time += DELAY / 1000;
//   }, DELAY);
// });