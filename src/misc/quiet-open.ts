import { Door, Gate } from 'org.bukkit.block.data.type';
import { Action } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { Saw } from './saw';
import { Material } from 'org.bukkit';

registerEvent(PlayerInteractEvent, (event) => {
  const block = event.clickedBlock;
  if (event.action !== Action.RIGHT_CLICK_BLOCK) return;
  if (!block) return;
  if (event.player.isSneaking()) return;

  // Wooden doors
  if (block.blockData instanceof Door) {
    if (block.type === Material.IRON_DOOR) return;
    // Custom sound names with vanilla sound files (sounds.json)
    const sound = (block.blockData as Door).isOpen()
      ? 'non-silent.wooden_door.close'
      : 'non-silent.wooden_door.open';
    block.world.playSound(block.location, sound, 1, 1);
  }

  // Fence gates
  else if (block.blockData instanceof Gate) {
    if (Saw.check(block)) return;
    // Custom sound names with vanilla sound files (sounds.json)
    const sound = (block.blockData as Gate).isOpen()
      ? 'non-silent.fence_gate.close'
      : 'non-silent.fence_gate.open';
    block.world.playSound(block.location, sound, 1, 1);
  }
});
