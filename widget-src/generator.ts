export const EPOCH = "EPOCH";

interface Pair {
  value: string;
  double: boolean;
  repeat: boolean;
  notable: boolean;
}

export interface Code {
  pairs: Pair[];
  doubles: number;
  repeats: number;
  uniques: number;
  score: number;
  advantage: number;
  complete: boolean;
  value: string;
}

interface History {
  [k: string]: number;
}

export function generateCodeFromParentCodes(codeA: Code, codeB: Code): Code {
  const advantage = Math.ceil(
    Math.pow((codeA.score + codeB.score) / 64, 2) * 250
  );
  const history: History = {};
  const pairs = codeA.pairs.map((pA, i) =>
    pairFromParents(pA, codeB.pairs[i], history, advantage)
  );
  return codeFromPairs(pairs, advantage, history);
}

export function generateCode(): Code {
  // return codeFromString("9999999999991111", 1);
  return codeFromString("9999999999999999", 1);

  const history: History = {};
  const array = [0, 0, 0, 0, 0, 0, 0, 0];
  const pairs = array.map(() => randomPairWithAdvantage(history, 0));
  return codeFromPairs(pairs, 0, history);
}

export function codeFromString(string: string, advantage = 0): Code {
  const pairs: Pair[] = [];
  const history: History = {};
  for (let i = 0; i < string.length; i += 2) {
    const pair = pairFromValues(
      string.charAt(i),
      string.charAt(i + 1),
      history
    );
    pairs.push(pair);
  }
  return codeFromPairs(pairs, advantage, history);
}

function codeFromPairs(
  pairs: Pair[],
  advantage: number,
  history: History
): Code {
  let doubles = 0;
  let repeats = 0;
  let present: { [k: string]: 1 } = {};
  let complete = pairs.length;
  pairs = pairs.map(({ value }) => {
    const pair = pairFromValues(value.charAt(0), value.charAt(1), {});
    if (history[value] > 1) {
      pair.repeat = true;
      pair.notable = true;
    }
    if (pair.notable) {
      complete--;
      if (pair.double) {
        doubles++;
      }
      if (pair.repeat) {
        repeats++;
      }
    }
    present[pair.value.charAt(0)] = 1;
    present[pair.value.charAt(1)] = 1;
    return pair;
  });
  const uniques = 17 - Object.keys(present).length;
  return {
    doubles,
    repeats,
    uniques,
    score: doubles + repeats + uniques,
    pairs,
    advantage,
    complete: complete === 0,
    value: pairs.map((p) => p.value).join(""),
  };
}

function pairFromParents(
  parentA: Pair,
  parentB: Pair,
  history: History,
  advantage: number
): Pair {
  const factorA = parentA.notable || parentB.notable ? 0.6 : 0.4;
  if (Math.random() < factorA) {
    return parentA.repeat || (parentA.notable && !parentB.repeat)
      ? parentA
      : parentB;
  } else {
    return randomPairWithAdvantage(history, advantage);
  }
}

function randomPairWithAdvantage(history: History, advantage: number): Pair {
  const clone1 = { ...history };
  let best = randomPair(clone1);
  if (clone1[best.value] <= 1) {
    for (let i = 0; i < advantage - 1; i++) {
      const clone2 = { ...history };
      const pair = randomPair(clone2);
      if (clone2[pair.value] > 1) {
        pair.repeat = true;
        pair.notable = true;
        best = pair;
        i = advantage;
      } else if (!best.notable && pair.notable) {
        best = pair;
      }
    }
  } else {
    best.repeat = true;
    best.notable = true;
  }
  history[best.value] = history[best.value] || 0;
  history[best.value]++;
  return best;
}

function randomPair(history: History): Pair {
  const single = () =>
    Math.floor(Math.random() * 16)
      .toString(16)
      .toUpperCase();
  const valueA = single();
  const valueB = single();
  return pairFromValues(valueA, valueB, history);
}

function pairFromValues(
  valueA: string,
  valueB: string,
  history: History
): Pair {
  const repeat = false;
  const key = `${valueA}${valueB}`;
  history[key] = history[key] || 0;
  history[key]++;
  const double = valueA === valueB;
  const notable = double || repeat;
  return { value: valueA + valueB, double, repeat, notable };
}
