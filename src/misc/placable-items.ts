import { color, text } from 'craftjs-plugin/chat';
import { Location, Material, SoundCategory } from 'org.bukkit';
import { Block, BlockFace } from 'org.bukkit.block';
import { ArmorStand, EntityType, Player } from 'org.bukkit.entity';
import { Action } from 'org.bukkit.event.block';
import {
  PlayerInteractAtEntityEvent,
  PlayerInteractEvent,
} from 'org.bukkit.event.player';
import { EquipmentSlot, ItemStack } from 'org.bukkit.inventory';
import { giveItem } from '../common/helpers/inventory';

const PLACABLE_MATERIALS = new Set([
  Material.GLASS_BOTTLE,
  Material.POTION,
  Material.BOOK,
  Material.WRITABLE_BOOK,
  Material.WRITTEN_BOOK,
]);

const SURFACES = new Set([
  Material.OAK_PLANKS,
  Material.SPRUCE_PLANKS,
  Material.BIRCH_PLANKS,
  Material.JUNGLE_PLANKS,
  Material.ACACIA_PLANKS,
  Material.DARK_OAK_PLANKS,

  Material.OAK_SLAB,
  Material.SPRUCE_SLAB,
  Material.BIRCH_SLAB,
  Material.JUNGLE_SLAB,
  Material.ACACIA_SLAB,
  Material.DARK_OAK_SLAB,

  Material.OAK_STAIRS,
  Material.SPRUCE_STAIRS,
  Material.BIRCH_STAIRS,
  Material.JUNGLE_STAIRS,
  Material.ACACIA_STAIRS,
  Material.DARK_OAK_STAIRS,
]);

/**
 * Check if the item can be placed on the ground
 */
function isPlacableItem(item: ItemStack | null): item is ItemStack {
  if (!item) return false;
  return PLACABLE_MATERIALS.has(item.type);
}

/**
 * Check if items can be placed on this block
 */
function isValidSurface(block: Block | null): block is Block {
  if (!block) return false;
  return SURFACES.has(block.type);
}

/**
 * Place item on the ground
 */
registerEvent(PlayerInteractEvent, (event) => {
  if (event.action !== Action.RIGHT_CLICK_BLOCK) return;
  if (event.blockFace !== BlockFace.UP) return;
  if (!isValidSurface(event.clickedBlock)) return;
  if (!isPlacableItem(event.item)) return;

  const location = getClickedLocation(event.player);
  if (!location) return;

  if (containsTooManyItems(location)) {
    warnTooManyItems(event.player);
    return;
  }

  spawnHolderArmorStand(location, event.item);
  event.item.amount--;
  event.setCancelled(true);
});

/**
 * Gets the exact clicked position
 * @param player Player who clicked
 */
function getClickedLocation(player: Player) {
  const raytrace = player.rayTraceBlocks(4);
  if (!raytrace) return;
  const position = raytrace.hitPosition;
  return position.toLocation(
    player.world,
    player.location.yaw,
    player.location.pitch,
  );
}

const RADIUS = 0.5;
const MAX_ITEMS_IN_RADIUS = 2;
/**
 * Checks if the location has too many (armorstand) items on the ground
 * @param location Clicked location
 */
function containsTooManyItems(location: Location) {
  let items = 0;
  const entities = location.getNearbyEntities(RADIUS, RADIUS, RADIUS);
  for (const entity of entities) {
    if (!(entity instanceof ArmorStand)) continue;
    if (entity.isVisible()) continue;
    const item = entity.getItem(EquipmentSlot.HEAD);
    if (isPlacableItem(item)) {
      items++;
    }
    if (items >= MAX_ITEMS_IN_RADIUS) {
      return true;
    }
  }
  return false;
}

function warnTooManyItems(player: Player) {
  player.sendMessage(color('#D44E39', text('Tähän ei mahdu uutta esinettä')));
}

/**
 * Spawns item on the ground with armor stand
 * @param loc Clicked location
 * @param item Item to be placed
 */
function spawnHolderArmorStand(loc: Location, item: ItemStack) {
  const tempLoc = loc.clone();
  tempLoc.y = 1000;
  // Clever hack to make the teleport instant ":)"
  tempLoc.x += 75;
  const armorStand = loc.world.spawnEntity(
    tempLoc,
    EntityType.ARMOR_STAND,
  ) as ArmorStand;

  armorStand.setSilent(true);
  armorStand.setVisible(false);
  armorStand.teleport(loc);
  armorStand.setItem(EquipmentSlot.HEAD, item);
  armorStand.setCanPickupItems(false);
  armorStand.setCollidable(false);
  armorStand.setSilent(true);
  armorStand.setSmall(true);
  armorStand.setArms(false);
  armorStand.addDisabledSlots(
    EquipmentSlot.HEAD,
    EquipmentSlot.CHEST,
    EquipmentSlot.LEGS,
    EquipmentSlot.FEET,
    EquipmentSlot.HAND,
    EquipmentSlot.OFF_HAND,
  );

  loc.world.playSound(
    loc,
    'minecraft:block.wood.break',
    SoundCategory.BLOCKS,
    0.5,
    1.3,
  );
}

/**
 * Pick up the item
 */
registerEvent(PlayerInteractAtEntityEvent, (event) => {
  if (
    !event.player.inventory.itemInMainHand.type.isEmpty() &&
    !event.player.inventory.itemInMainHand.type.isEmpty()
  )
    return;
  if (event.rightClicked.type !== EntityType.ARMOR_STAND) return;
  const armorStand = event.rightClicked as ArmorStand;
  if (!armorStand.isInvisible()) return;
  if (!armorStand.isValid()) return;

  // Check if the player actually clicked close enough
  // This makes the picking up more realistic
  const location = getClickedLocation(event.player);
  if (!location) return;
  const distance = location.distance(armorStand.location);
  if (distance > 0.3) return;

  const item = armorStand.getItem(EquipmentSlot.HEAD);
  if (!isPlacableItem(item)) return;
  giveItem(event.player, item, event.hand);
  armorStand.remove();
});
