import { SoundCategory } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';

// Applause
registerCommand(
  ['applause', 'aplodit'],
  (sender) => {
    if (sender instanceof Player) {
      clap(sender, 10, 0.2);
    }
  },
  {
    executableBy: 'players',
    permission: 'vk.clap',
  },
);

// Clapping
registerCommand(
  ['taputa', 'taputus', 'taptap', 'clapping'],
  (sender) => {
    if (sender instanceof Player) {
      clap(sender, 5);
    }
  },
  {
    executableBy: 'players',
    permission: 'vk.clap',
  },
);

// One clap
registerCommand(
  ['tap', 'clap'],
  (sender) => {
    if (sender instanceof Player) {
      clap(sender, 1);
    }
  },
  {
    executableBy: 'players',
    permission: 'vk.clap',
  },
);

export async function clap(player: Player, claps: number, delay = 0.3) {
  for (let i = 0; i < claps; i++) {
    const pitch = 1.1 + Math.random() * 0.15;
    player.world.playSound(
      player.location,
      'custom.clap',
      SoundCategory.PLAYERS,
      1,
      pitch,
    );
    await wait(delay, 'seconds');
  }
}
