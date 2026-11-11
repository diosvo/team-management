import type { ProgressionSummary, TestPoint } from '@/types/periodic-testing';

import { PerformanceBand, ProgressStatus, TestTypeUnit } from './enum';

/** A change smaller than this (2%) is treated as noise, not progress. */
const CHANGE_THRESHOLD = 0.02;
/** How far (10%) past or short of the target moves a result up or down a band. */
const BAND_MARGIN = 0.1;

/**
 * Relative change from `from` to `to`, signed so a positive value is always an
 * improvement regardless of the test's direction.
 *
 * @example relativeChange(10, 9, false); // 0.1 (a faster sprint)
 */
export function relativeChange(
  from: number,
  to: number,
  higherIsBetter: boolean,
): number {
  const diff = higherIsBetter ? to - from : from - to;
  if (from === 0) return Math.sign(diff);
  return diff / Math.abs(from);
}

export function isBetter(a: number, b: number, higherIsBetter: boolean) {
  return higherIsBetter ? a > b : a < b;
}

export function average(values: Array<number>): Nullable<number> {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Labels the trend of a chronological series of results:
 * - `improving` / `regressing`: the latest test moved past the threshold
 * - `plateauing`: neither of the last two tests moved past it
 * - `stable`: only the latest test held steady
 */
export function progressStatus(
  results: Array<number>,
  higherIsBetter: boolean,
): ProgressStatus {
  if (results.length < 2) return ProgressStatus.INSUFFICIENT;

  // Length checked above, so the last two exist.
  const latest = results.at(-1) as number;
  const previous = results.at(-2) as number;

  const last = relativeChange(previous, latest, higherIsBetter);
  if (last >= CHANGE_THRESHOLD) return ProgressStatus.IMPROVING;
  if (last <= -CHANGE_THRESHOLD) return ProgressStatus.REGRESSING;

  const before = results.at(-3);
  if (before !== undefined) {
    const change = relativeChange(before, previous, higherIsBetter);
    if (Math.abs(change) < CHANGE_THRESHOLD) return ProgressStatus.PLATEAUING;
  }

  return ProgressStatus.STABLE;
}

/** Places a result against the test type's target; `null` without a target. */
export function performanceBand(
  value: number,
  target: Nullable<number>,
  higherIsBetter: boolean,
): Nullable<PerformanceBand> {
  if (target == null) return null;

  const gap = relativeChange(target, value, higherIsBetter);
  if (gap >= BAND_MARGIN) return PerformanceBand.ELITE;
  if (gap >= 0) return PerformanceBand.ON_TARGET;
  if (gap >= -BAND_MARGIN) return PerformanceBand.BELOW_TARGET;
  return PerformanceBand.NEEDS_WORK;
}

/** Summarises a player's chronological (oldest first) results for one test type. */
export function summarize(
  history: Array<TestPoint>,
  higherIsBetter: boolean,
  target: Nullable<number>,
): ProgressionSummary {
  const [baseline] = history;
  const latest = history.at(-1);
  // `reduce` below throws on an empty history too; fail with a clear message.
  if (!baseline || !latest) throw new Error('summarize: empty history');
  const best = history.reduce((top, point) =>
    isBetter(point.result, top.result, higherIsBetter) ? point : top,
  );

  return {
    baseline,
    latest,
    best,
    count: history.length,
    change: relativeChange(baseline.result, latest.result, higherIsBetter),
    status: progressStatus(
      history.map(({ result }) => result),
      higherIsBetter,
    ),
    band: performanceBand(latest.result, target, higherIsBetter),
  };
}

export type GoalOutcome = 'met' | 'missed' | 'pending';

/**
 * Whether the first result after a goal was set reached it.
 * `pending` until the player is tested again.
 */
export function goalOutcome(
  goal: number,
  next: Nullish<number>,
  higherIsBetter: boolean,
): GoalOutcome {
  if (next == null) return 'pending';
  return isBetter(goal, next, higherIsBetter) ? 'missed' : 'met';
}

/** Parses a nullable `decimal` column. */
export const toNumber = (value: Nullish<string>): Nullable<number> =>
  value == null ? null : Number(value);

/** Unit as shown next to a value: percent reads as a symbol, `65%`. */
export const unitLabel = (unit: string): string =>
  unit === TestTypeUnit.PERCENT ? '%' : unit;

/**
 * Up to two decimals, trailing zeros dropped.
 * @example formatResult(12.5, 'seconds'); // '12.5 seconds'
 * @example formatResult(65, 'percent'); // '65%'
 */
export const formatResult = (value: number, unit?: Nullish<string>): string => {
  const result = String(Number(value.toFixed(2)));
  if (!unit) return result;
  return unit === TestTypeUnit.PERCENT ? `${result}%` : `${result} ${unit}`;
};

/** @example formatChange(0.123); // '+12.3%' */
export const formatChange = (change: number): string =>
  `${change > 0 ? '+' : ''}${(change * 100).toFixed(1)}%`;
