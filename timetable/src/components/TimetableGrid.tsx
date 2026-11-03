import { useMemo, useState, useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';
import { CalendarOff } from 'lucide-react';
import type { Day } from '../types';
import { cn } from '../utils/cn';
import { sectionLabel } from '../utils/catalog';
import { courseColors, DAY_LABELS, DAYS, fromMinutes, toMinutes } from '../utils/timeUtils';
import type { TimetableItem, TimetableVariant } from './timetableItems';

export type { TimetableItem, TimetableVariant } from './timetableItems';

export interface TimetableGridProps {
  items: TimetableItem[];
  compact?: boolean;
  showSaturday?: boolean;
  className?: string;
}

const DAY_START_MINUTES = 8 * 60;
const DAY_END_MINUTES = 20 * 60;
const SLOT_MINUTES = 30;
const WEEKDAYS: Day[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const NARROW_QUERY = '(max-width: 639.98px)';

interface Density {
  rowRem: number;
  rowPx: number;
  linePx: number;
  gutter: string;
  dayColumn: string;
}

const DENSITIES: Record<'regular' | 'compact', Density> = {
  regular: { rowRem: 2, rowPx: 32, linePx: 16, gutter: '3.5rem', dayColumn: 'minmax(5.5rem, 1fr)' },
  compact: { rowRem: 1.25, rowPx: 20, linePx: 14, gutter: '2.75rem', dayColumn: 'minmax(0, 1fr)' },
};

function variantOf(item: TimetableItem): TimetableVariant {
  return item.variant ?? 'enrolled';
}

function isOverlay(item: TimetableItem): boolean {
  return variantOf(item) !== 'enrolled';
}

function slipLabel(item: TimetableItem): string {
  const { meeting } = item;
  const parts = [
    [item.courseCode, sectionLabel(item.sectionNo)?.toLowerCase()].filter(Boolean).join(' '),
    `${DAY_LABELS[meeting.day].long} ${meeting.start} to ${meeting.end}`,
  ];
  if (meeting.room.trim()) parts.push(`room ${meeting.room}`);
  const variant = variantOf(item);
  if (variant === 'preview') parts.push('preview');
  if (variant === 'conflict') parts.push('time conflict');
  return parts.join(', ');
}

function slipTitle(item: TimetableItem): string {
  const { meeting } = item;
  const room = meeting.room.trim() ? `, ${meeting.room}` : '';
  const section = sectionLabel(item.sectionNo);
  const details = [section, room.replace(/^, /, '')].filter(Boolean).join(', ');
  return `${item.courseCode} ${item.courseName}${details ? `\n${details}` : ''}\n${DAY_LABELS[meeting.day].long} ${meeting.start}–${meeting.end}`;
}

function detailText(item: TimetableItem): string {
  const room = item.meeting.room.trim();
  return [sectionLabel(item.sectionNo), room ? `room ${room}` : null].filter(Boolean).join(', ');
}

function slipToneClasses(item: TimetableItem): string {
  const variant = variantOf(item);
  if (variant === 'preview') return 'slip-preview';
  if (variant === 'conflict') return 'slip-conflict';
  const colors = courseColors(item.courseCode);
  return cn('border-l-4', colors.fill, colors.edge, colors.ink);
}

function compareByTime(a: TimetableItem, b: TimetableItem): number {
  const startDiff = toMinutes(a.meeting.start) - toMinutes(b.meeting.start);
  if (startDiff !== 0) return startDiff;
  const endDiff = toMinutes(b.meeting.end) - toMinutes(a.meeting.end);
  if (endDiff !== 0) return endDiff;
  return a.courseCode.localeCompare(b.courseCode);
}

interface Lane {
  lane: number;
  laneCount: number;
}

function assignLanes(items: TimetableItem[]): Map<string, Lane> {
  const result = new Map<string, Lane>();
  const sorted = [...items].sort(compareByTime);
  let cluster: { key: string; lane: number }[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    const laneCount = Math.max(laneEnds.length, 1);
    for (const member of cluster) result.set(member.key, { lane: member.lane, laneCount });
    cluster = [];
    laneEnds = [];
    clusterEnd = -1;
  };

  for (const item of sorted) {
    const start = toMinutes(item.meeting.start);
    const end = toMinutes(item.meeting.end);
    if (cluster.length > 0 && start >= clusterEnd) flush();
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }
    cluster.push({ key: item.key, lane });
    clusterEnd = Math.max(clusterEnd, end);
  }
  flush();
  return result;
}

function visibleDays(items: TimetableItem[], showSaturday: boolean): Day[] {
  const needsSaturday = showSaturday || items.some((item) => item.meeting.day === 'SAT');
  return needsSaturday ? [...WEEKDAYS, 'SAT'] : WEEKDAYS;
}

function timeRange(items: TimetableItem[]): { start: number; end: number } {
  let start = DAY_START_MINUTES;
  let end = DAY_END_MINUTES;
  for (const item of items) {
    start = Math.min(start, Math.floor(toMinutes(item.meeting.start) / 60) * 60);
    end = Math.max(end, Math.ceil(toMinutes(item.meeting.end) / 60) * 60);
  }
  return { start: Math.max(start, 0), end: Math.min(end, 24 * 60) };
}

function todayDay(): Day | null {
  const index = new Date().getDay();
  return index >= 1 && index <= 6 ? DAYS[index - 1] : null;
}

function subscribeToNarrow(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const query = window.matchMedia(NARROW_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function readNarrow(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(NARROW_QUERY).matches;
}

function readNarrowOnServer(): boolean {
  return false;
}

function useIsNarrowViewport(): boolean {
  return useSyncExternalStore(subscribeToNarrow, readNarrow, readNarrowOnServer);
}

export function TimetableGrid({ items, compact = false, showSaturday = false, className }: TimetableGridProps) {
  const isNarrow = useIsNarrowViewport();
  const days = useMemo(() => visibleDays(items, showSaturday), [items, showSaturday]);

  if (isNarrow) {
    return <TimetableDayList items={items} days={days} className={className} />;
  }
  return <TimetableWeekGrid items={items} days={days} compact={compact} className={className} />;
}

interface WeekGridProps {
  items: TimetableItem[];
  days: Day[];
  compact: boolean;
  className?: string;
}

function TimetableWeekGrid({ items, days, compact, className }: WeekGridProps) {
  const density = DENSITIES[compact ? 'compact' : 'regular'];
  const range = useMemo(() => timeRange(items), [items]);
  const rowCount = (range.end - range.start) / SLOT_MINUTES;
  const today = todayDay();

  const placedItems = useMemo(() => {
    const dayIndex = new Map(days.map((day, index) => [day, index]));
    const lanes = new Map<string, Lane>();
    for (const day of days) {
      const ofDay = items.filter((item) => item.meeting.day === day);
      for (const [key, lane] of assignLanes(ofDay.filter((item) => !isOverlay(item)))) lanes.set(key, lane);
      for (const [key, lane] of assignLanes(ofDay.filter(isOverlay))) lanes.set(key, lane);
    }
    return items
      .filter((item) => dayIndex.has(item.meeting.day) && toMinutes(item.meeting.end) > toMinutes(item.meeting.start))
      .sort((a, b) => {
        const dayDiff = (dayIndex.get(a.meeting.day) ?? 0) - (dayIndex.get(b.meeting.day) ?? 0);
        if (dayDiff !== 0) return dayDiff;
        const timeDiff = compareByTime(a, b);
        if (timeDiff !== 0) return timeDiff;
        return Number(isOverlay(a)) - Number(isOverlay(b));
      })
      .map((item) => ({
        item,
        column: (dayIndex.get(item.meeting.day) ?? 0) + 2,
        lane: lanes.get(item.key) ?? { lane: 0, laneCount: 1 },
      }));
  }, [items, days]);

  const gridStyle: CSSProperties = {
    gridTemplateColumns: `${density.gutter} repeat(${days.length}, ${density.dayColumn})`,
    gridTemplateRows: `auto repeat(${rowCount}, ${density.rowRem}rem)`,
  };

  const slotRows = Array.from({ length: rowCount }, (_, index) => range.start + index * SLOT_MINUTES);

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-line bg-surface', className)}>
      <div role="list" aria-label="Weekly timetable" className="relative grid pr-2 pb-2" style={gridStyle}>
        <div aria-hidden="true" className="sticky left-0 z-30 bg-surface" style={{ gridColumn: 1, gridRow: 1 }} />
        {days.map((day, index) => (
          <div
            key={`head-${day}`}
            aria-hidden="true"
            className={cn(
              'border-b border-line text-center font-semibold',
              compact ? 'py-1.5 text-xs' : 'py-2.5 text-sm',
              day === today ? 'text-brand' : 'text-ink-soft',
            )}
            style={{ gridColumn: index + 2, gridRow: 1 }}
          >
            {compact ? DAY_LABELS[day].short : (
              <>
                <span className="lg:hidden">{DAY_LABELS[day].short}</span>
                <span className="hidden lg:inline">{DAY_LABELS[day].long}</span>
              </>
            )}
          </div>
        ))}

        {slotRows.map((minute, index) => {
          const onHour = minute % 60 === 0;
          return (
            <div
              key={`line-${minute}`}
              aria-hidden="true"
              className={cn('border-t', onHour ? 'border-line' : 'border-line/40', index === rowCount - 1 && 'border-b border-b-line')}
              style={{ gridColumn: `2 / ${days.length + 2}`, gridRow: index + 2 }}
            />
          );
        })}

        {days.map((day, index) => (
          <div
            key={`column-${day}`}
            aria-hidden="true"
            className="border-l border-line"
            style={{ gridColumn: index + 2, gridRow: `2 / ${rowCount + 2}` }}
          />
        ))}

        {slotRows.map((minute, index) =>
          minute % 60 === 0 ? (
            <div
              key={`label-${minute}`}
              aria-hidden="true"
              className={cn(
                'sticky left-0 z-30 bg-surface pr-2 text-right leading-none text-ink-faint tabular-nums',
                compact ? 'text-[0.6875rem]' : 'text-xs',
              )}
              style={{ gridColumn: 1, gridRow: `${index + 2} / span 2` }}
            >
              <span className="relative -top-[0.4em]">{fromMinutes(minute)}</span>
            </div>
          ) : null,
        )}

        {placedItems.map(({ item, column, lane }) => (
          <GridSlip
            key={item.key}
            item={item}
            column={column}
            lane={lane}
            rangeStart={range.start}
            density={density}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}

interface GridSlipProps {
  item: TimetableItem;
  column: number;
  lane: Lane;
  rangeStart: number;
  density: Density;
  compact: boolean;
}

function GridSlip({ item, column, lane, rangeStart, density, compact }: GridSlipProps) {
  const start = toMinutes(item.meeting.start);
  const end = toMinutes(item.meeting.end);
  const firstSlot = Math.floor((start - rangeStart) / SLOT_MINUTES);
  const lastSlot = Math.ceil((end - rangeStart) / SLOT_MINUTES);
  const span = Math.max(lastSlot - firstSlot, 1);
  const topOffsetRem = (((start - rangeStart) % SLOT_MINUTES) / SLOT_MINUTES) * density.rowRem;
  const bottomOffsetRem = (((rangeStart + lastSlot * SLOT_MINUTES) - end) / SLOT_MINUTES) * density.rowRem;
  const overlay = isOverlay(item);
  const inset = overlay ? { side: '0.625rem', trim: '0.875rem', vertical: '3px' } : { side: '2px', trim: '4px', vertical: '1px' };
  const laneWidth = 100 / lane.laneCount;

  const style: CSSProperties = {
    gridColumn: column,
    gridRow: `${firstSlot + 2} / span ${span}`,
    marginTop: `calc(${topOffsetRem}rem + ${inset.vertical})`,
    marginBottom: `calc(${bottomOffsetRem}rem + ${inset.vertical})`,
    marginLeft: `calc(${lane.lane * laneWidth}% + ${inset.side})`,
    width: `calc(${laneWidth}% - ${inset.trim})`,
    justifySelf: 'start',
  };

  const heightPx = ((end - start) / SLOT_MINUTES) * density.rowPx;
  const lineBudget = Math.max(Math.floor((heightPx - 8) / density.linePx), 1);
  const room = item.meeting.room.trim();
  const section = sectionLabel(item.sectionNo);
  const lines = (compact ? [room, section] : [item.courseName, room, section]).filter((line): line is string => Boolean(line));
  const detailLines = lines.slice(0, Math.max(lineBudget - 1, 0));
  const showTime = !compact && lineBudget >= lines.length + 2;

  return (
    <div
      role="listitem"
      aria-label={slipLabel(item)}
      title={slipTitle(item)}
      data-variant={variantOf(item)}
      className={cn(
        'relative min-w-0 overflow-hidden rounded-r-md rounded-l-[3px]',
        compact ? 'px-1 py-0.5' : 'px-1.5 py-1',
        overlay ? 'z-20 rounded-md' : 'z-10',
        slipToneClasses(item),
      )}
      style={style}
    >
      <p className={cn('truncate font-bold', compact ? 'text-[0.6875rem] leading-[14px]' : 'text-[0.8125rem] leading-4')}>
        {item.courseCode}
      </p>
      {detailLines.map((line, index) => (
        <p
          key={`${index}-${line}`}
          className={cn('truncate opacity-90', compact ? 'text-[0.6875rem] leading-[14px]' : 'text-xs leading-4')}
        >
          {line}
        </p>
      ))}
      {showTime ? (
        <p className="truncate text-xs leading-4 tabular-nums opacity-75">
          {item.meeting.start}–{item.meeting.end}
        </p>
      ) : null}
    </div>
  );
}

interface DayListProps {
  items: TimetableItem[];
  days: Day[];
  className?: string;
}

function TimetableDayList({ items, days, className }: DayListProps) {
  const [chosenDay, setChosenDay] = useState<Day | null>(null);
  const today = todayDay();

  const defaultDay = useMemo<Day>(() => {
    if (today && days.includes(today)) return today;
    const firstBusy = days.find((day) => items.some((item) => item.meeting.day === day));
    return firstBusy ?? days[0];
  }, [days, items, today]);

  const selectedDay = chosenDay && days.includes(chosenDay) ? chosenDay : defaultDay;
  const dayItems = items
    .filter((item) => item.meeting.day === selectedDay)
    .sort((a, b) => compareByTime(a, b) || Number(isOverlay(a)) - Number(isOverlay(b)));

  const countByDay = new Map<Day, number>(
    days.map((day) => [day, items.filter((item) => item.meeting.day === day && !isOverlay(item)).length]),
  );

  return (
    <div className={cn('rounded-lg border border-line bg-surface', className)}>
      <div role="group" aria-label="Choose a day" className="flex gap-1 overflow-x-auto border-b border-line p-1.5">
        {days.map((day) => {
          const selected = day === selectedDay;
          const count = countByDay.get(day) ?? 0;
          return (
            <button
              key={day}
              type="button"
              aria-pressed={selected}
              aria-label={`${DAY_LABELS[day].long}, ${count} ${count === 1 ? 'class' : 'classes'}`}
              onClick={() => setChosenDay(day)}
              className={cn(
                'flex min-w-12 flex-1 flex-col items-center rounded-md px-2 py-1.5 text-sm font-medium',
                'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand',
                selected ? 'bg-brand text-on-brand' : 'text-ink-soft hover:bg-sunken hover:text-ink',
              )}
            >
              <span>{DAY_LABELS[day].short}</span>
              <span
                aria-hidden="true"
                className={cn('text-xs tabular-nums', selected ? 'text-on-brand/80' : 'text-ink-faint', day === today && !selected && 'text-brand')}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {dayItems.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-ink-soft">
          <CalendarOff aria-hidden="true" className="size-5 text-ink-faint" />
          <p className="text-sm">No classes on {DAY_LABELS[selectedDay].long}.</p>
        </div>
      ) : (
        <ul aria-label={`${DAY_LABELS[selectedDay].long} classes`} className="flex flex-col gap-2 p-3">
          {dayItems.map((item) => (
            <ListSlip key={item.key} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ListSlip({ item }: { item: TimetableItem }) {
  const variant = variantOf(item);
  return (
    <li
      aria-label={slipLabel(item)}
      data-variant={variant}
      className={cn('flex gap-3 rounded-r-md rounded-l-[3px] px-3 py-2.5', isOverlay(item) && 'rounded-md', slipToneClasses(item))}
    >
      <div className="flex w-12 shrink-0 flex-col text-sm leading-5 font-semibold tabular-nums">
        <span>{item.meeting.start}</span>
        <span className="font-normal opacity-75">{item.meeting.end}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm leading-5">
          <span className="font-bold">{item.courseCode}</span>
          <span className="opacity-90"> {item.courseName}</span>
        </p>
        {detailText(item) ? <p className="text-xs leading-5 opacity-90">{detailText(item)}</p> : null}
        {variant === 'preview' ? <p className="text-xs leading-5 font-medium">Preview</p> : null}
        {variant === 'conflict' ? <p className="text-xs leading-5 font-medium text-bad">Time conflict</p> : null}
      </div>
    </li>
  );
}
