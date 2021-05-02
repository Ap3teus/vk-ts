import { translate } from 'craftjs-plugin/chat';
import { Material } from 'org.bukkit';
import { Container } from 'org.bukkit.block';
import { ItemStack } from 'org.bukkit.inventory';

/**
 * Tries to find similar itemstacks from the container
 * @param container Container used in the shop
 * @param lookfor ItemStack to be looked for from the container
 */
export function findItemsFromContainer(
  container: Container,
  lookfor: ItemStack,
) {
  return container.inventory.contents.filter((i) => {
    if (!i) return false;
    if (i.type != lookfor.type) return false;
    const metaA = i.itemMeta;
    const metaB = lookfor.itemMeta;
    if (metaA.displayName != metaB.displayName) return false;
    if (metaA.hasCustomModelData() !== metaB.hasCustomModelData()) return false;
    if (metaB.hasCustomModelData() && metaA.hasCustomModelData()) {
      if (metaA.customModelData !== metaB.customModelData) return false;
    }

    // Items were similar enough
    return true;
  });
}

/**
 * Creates new item stack with given information.
 * This is an estimation of the item in the shop
 * @param type Material of the item
 * @param modelId Custom model data of the item
 * @param name Display name of the item
 */
export function getShopItem(
  type: string,
  modelId?: number,
  name?: string,
  translationKey?: string,
) {
  const material = Material.valueOf(type);
  const item = new ItemStack(material);
  const meta = item.itemMeta;
  if (modelId) meta.customModelData = modelId;
  if (name) meta.displayName = name;
  if (translationKey) meta.displayNameComponent = [translate(translationKey)];
  item.itemMeta = meta;
  return item;
}
