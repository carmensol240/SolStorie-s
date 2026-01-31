// Sound effects completely disabled - silent reading experience
export const useSoundEffects = () => {
  return {
    playPageSound: () => {}, // No-op: sound disabled
    playSuccessSound: () => {}, // No-op: sound disabled
  };
};
