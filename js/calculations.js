export function calculateEnergy(totalGeneration, totalConsumption) {
  return Math.max(totalGeneration - totalConsumption, 0);
}
