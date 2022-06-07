export const EPOCH = "EPOCH";

interface Pair {
  value: string;
  pair: boolean;
  notable: boolean;
}

export interface Code {
  pairs: Pair[];
  double: number;
  unique: number;
  score: number;
  sequence: number;
  advantage: number;
  value: string;
}

export function generateCodeFromParentCodes(codeA: Code, codeB: Code): Code {
  const advantage = Math.ceil(
    Math.pow((codeA.score + codeB.score) / 40, 3) * 20000
  );
  return generateCode(advantage);
}

export function generateCode(advantage = 1): Code {
  // return codeFromString("9999999999991111", advantage);
  // return codeFromString("9999999999999999", advantage);
  const generateCode = () =>
    codeFromPairs(
      [generatePair(), generatePair(), generatePair(), generatePair()],
      advantage
    );
  const startA = generateCode();
  const startB = generateCode();
  let bestA = startA.score > startB.score ? startA : startB;
  let bestB = startA.score > startB.score ? startB : startA;
  for (let i = 0; i < advantage - 2; i++) {
    const code = generateCode();
    if (code.score > bestA.score) {
      bestB = bestA;
      bestA = code;
    } else if (code.score > bestB.score) {
      bestB = code;
    }
  }
  return codeFromString(bestA.value + bestB.value, advantage);
}

export function codeFromString(string: string, advantage = 0): Code {
  const pairs: Pair[] = [];
  for (let i = 0; i < string.length; i += 2) {
    pairs.push(pairFromValues(string.charAt(i), string.charAt(i + 1)));
  }
  return codeFromPairs(pairs, advantage);
}

function generatePair(): Pair {
  const single = () =>
    Math.floor(Math.random() * 16)
      .toString(16)
      .toUpperCase();
  const valueA = single();
  const valueB = single();
  return pairFromValues(valueA, valueB);
}

function pairFromValues(valueA: string, valueB: string): Pair {
  const pair = valueA === valueB;
  return { value: valueA + valueB, pair, notable: false };
}

function codeFromPairs(pairs: Pair[], advantage: number): Code {
  let double = 0;
  let sequence = 0;
  let present: { [k: string]: 1 } = {};

  pairs.forEach((pair, i) => {
    if (pair.pair) {
      double += 1;
      pair.notable = true;
    }
    const prev = i > 0 ? pair.value === pairs[i - 1].value : false;
    const next =
      i < pairs.length - 1 ? pair.value === pairs[i + 1].value : false;
    if (prev || next) {
      pair.notable = true;
      sequence += 2;
    }
    present[pair.value.charAt(0)] = 1;
    present[pair.value.charAt(1)] = 1;
  });
  const unique = 17 - Object.keys(present).length;
  return {
    double,
    sequence,
    unique,
    score: double + sequence + unique,
    pairs,
    advantage,
    value: pairs.map((p) => p.value).join(""),
  };
}
