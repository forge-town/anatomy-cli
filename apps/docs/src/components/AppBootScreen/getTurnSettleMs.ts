import { BOOT_MOTION } from "./BOOT_MOTION";

export const getTurnSettleMs = (elapsedMs: number) => {
  const position = elapsedMs % BOOT_MOTION.turnMs;
  return position > BOOT_MOTION.turnMs * BOOT_MOTION.holdFraction
    ? BOOT_MOTION.turnMs - position
    : 0;
};
