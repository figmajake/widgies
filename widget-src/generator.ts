export const EPOCH = "EPOCH";
interface RarityType {
  factor: number;
  data: { [key: string]: number };
}

export interface Rarity {
  factor: number;
  absence: RarityType;
  prominence: RarityType;
  repeats: RarityType;
}

export interface WidgieDNA {
  advantage: number;
  rarity: Rarity;
  value: string;
}

export function determineRarityFromValue(value: string) {
  const valueLength = value.length;
  const matches = value.match(/((\d)\2+)/g) || [];
  const rarity: Rarity = {
    factor: 0,
    repeats: { factor: 0, data: {} },
    absence: { factor: 0, data: {} },
    prominence: { factor: 0, data: {} },
  };
  if (value === EPOCH) {
    return rarity;
  }
  const repeats: { [k: string]: number } = {};
  const numbers: { [k: string]: number } = {};
  for (let i = 0; i <= valueLength; i++) {
    if (i < 10) {
      numbers[i] = 0;
    }
    repeats[i] = 0;
  }

  matches.forEach((match) => repeats[match.length]++);
  value.split("").forEach((number) => numbers[number]++);

  for (let length in repeats) {
    const count = repeats[length];
    if (count > 0) {
      rarity.repeats.data[length] = count;
      rarity.repeats.factor += (Number(length) * count) / valueLength;
    }
  }

  let zeroes = 0;
  for (let number in numbers) {
    const count = numbers[number];
    if (count >= valueLength / 5) {
      rarity.prominence.factor += Math.pow(count / (valueLength / 1.5), 2);
      rarity.prominence.data[number] = count;
    } else if (count === 0) {
      zeroes++;
      rarity.absence.data[number] = count;
    }
  }
  rarity.absence.factor = Math.pow(zeroes / 8, 2);
  const sorted = [
    rarity.repeats.factor,
    rarity.absence.factor,
    rarity.prominence.factor,
  ].sort();
  rarity.factor = (sorted[1] + sorted[2]) / 2;
  return rarity;
}

function generateValue(advantage: number, scale = 10000000): WidgieDNA {
  const number = Math.floor(Math.random() * 9 * scale) + scale;
  const value = number.toString();
  const rarity = determineRarityFromValue(value);
  return { advantage, value, rarity };
}

export function generateDNA(advantage = 1): WidgieDNA {
  const valueAV: WidgieDNA = generateValue(advantage);
  const valueBV: WidgieDNA = generateValue(advantage);
  let valueA =
    valueAV.rarity.factor > valueBV.rarity.factor ? valueAV : valueBV;
  let valueB =
    valueAV.rarity.factor > valueBV.rarity.factor ? valueBV : valueAV;
  for (let i = 0; i < advantage - 1; i++) {
    const next = generateValue(advantage);
    if (next.rarity.factor > valueA.rarity.factor) {
      valueA = next;
    } else if (next.rarity.factor > valueB.rarity.factor) {
      valueB = next;
    }
  }
  const value = valueA.value + valueB.value;
  return { value, advantage, rarity: determineRarityFromValue(value) };
}

export function generateDNAFromParentRarities(
  rarityA: Rarity,
  rarityB: Rarity
): WidgieDNA {
  const rarity = (rarityA.factor + rarityB.factor) / 2;
  const advantage = Math.round(Math.pow(rarity, 4) * 10000);
  return generateDNA(advantage);
}
