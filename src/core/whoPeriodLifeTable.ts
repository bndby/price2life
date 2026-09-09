/**
 * WHO GHE 2021 period life expectancy at age x (e_x), GLOBAL.
 * Indicator LIFE_0000000035, abridged ages. Knots are e_x at the start of each interval.
 */
export const WHO_LIFE_TABLE_YEAR = 2021;

interface LifeTableKnot {
  readonly age: number;
  readonly years: number;
}

const MALE: readonly LifeTableKnot[] = [
  { age: 0, years: 68.89192705 },
  { age: 1, years: 70.036974144 },
  { age: 5, years: 66.671885714 },
  { age: 10, years: 61.906490505 },
  { age: 15, years: 57.082404747 },
  { age: 20, years: 52.364350522 },
  { age: 25, years: 47.721022675 },
  { age: 30, years: 43.09943124 },
  { age: 35, years: 38.539310673 },
  { age: 40, years: 34.085575137 },
  { age: 45, years: 29.798322946 },
  { age: 50, years: 25.646620185 },
  { age: 55, years: 21.712256038 },
  { age: 60, years: 18.046582269 },
  { age: 65, years: 14.723767289 },
  { age: 70, years: 11.698622764 },
  { age: 75, years: 9.039171047 },
  { age: 80, years: 6.630087168 },
  { age: 85, years: 4.483684121 },
];

const FEMALE: readonly LifeTableKnot[] = [
  { age: 0, years: 73.957524183 },
  { age: 1, years: 74.9215372 },
  { age: 5, years: 71.591850616 },
  { age: 10, years: 66.815425651 },
  { age: 15, years: 61.971274553 },
  { age: 20, years: 57.176609131 },
  { age: 25, years: 52.420389229 },
  { age: 30, years: 47.678833213 },
  { age: 35, years: 42.97208956 },
  { age: 40, years: 38.332747573 },
  { age: 45, years: 33.796512676 },
  { age: 50, years: 29.368644668 },
  { age: 55, years: 25.114796693 },
  { age: 60, years: 21.095030731 },
  { age: 65, years: 17.347578372 },
  { age: 70, years: 13.885312624 },
  { age: 75, years: 10.768207163 },
  { age: 80, years: 7.955425043 },
  { age: 85, years: 5.565674259 },
];

const TABLES = {
  male: MALE,
  female: FEMALE,
};

export function remainingLifeYearsAtAge(sex: keyof typeof TABLES, completedAge: number): number {
  const table = TABLES[sex];
  const age = Math.max(0, completedAge);
  const last = table[table.length - 1];

  if (age >= last.age) {
    return last.years;
  }

  for (let i = 0; i < table.length - 1; i += 1) {
    const left = table[i];
    const right = table[i + 1];
    if (age >= left.age && age < right.age) {
      const span = right.age - left.age;
      const t = (age - left.age) / span;
      return left.years + t * (right.years - left.years);
    }
  }

  return last.years;
}
