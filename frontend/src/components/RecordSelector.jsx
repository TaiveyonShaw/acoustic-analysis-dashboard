import { useMemo } from "react";

const DIMENSIONS = [
  { key: "aid", label: "Hearing aid" },
  { key: "room", label: "Room" },
  { key: "run", label: "Run", optionPrefix: "Run " },
];

function smartCompare(a, b) {
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

function uniqueSorted(records, key) {
  const seen = new Set();
  for (const r of records) seen.add(r[key]);
  return [...seen].sort(smartCompare);
}

/**
 * Choose the record matching the desired aid/room/run combo. If that exact
 * combination doesn't exist, keep the just-changed dimension fixed and pick the
 * closest record (most other dimensions matching).
 */
function pickRecordIndex(records, desired, changedKey) {
  const exact = records.find(
    (r) => r.aid === desired.aid && r.room === desired.room && r.run === desired.run,
  );
  if (exact) return exact.index;

  const candidates = records.filter((r) => r[changedKey] === desired[changedKey]);
  if (!candidates.length) return records[0]?.index ?? 0;

  const others = DIMENSIONS.map((d) => d.key).filter((k) => k !== changedKey);
  let best = candidates[0];
  let bestScore = -1;
  for (const r of candidates) {
    const score = others.reduce((acc, k) => acc + (r[k] === desired[k] ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  return best.index;
}

export default function RecordSelector({ records, recordIndex, onRecordIndex, loading }) {
  const current = useMemo(
    () => records?.find((r) => r.index === recordIndex) ?? records?.[0],
    [records, recordIndex],
  );

  const options = useMemo(() => {
    const map = {};
    for (const d of DIMENSIONS) map[d.key] = uniqueSorted(records ?? [], d.key);
    return map;
  }, [records]);

  if (!records?.length || !current) return null;

  const handleChange = (key, value) => {
    const desired = { aid: current.aid, room: current.room, run: current.run, [key]: value };
    onRecordIndex?.(pickRecordIndex(records, desired, key));
  };

  return (
    <div className="record-selector">
      {DIMENSIONS.map((d) => (
        <label key={d.key} className="field inline-field record-selector-field">
          <span>{d.label}</span>
          <select
            value={current[d.key]}
            disabled={loading}
            onChange={(e) => handleChange(d.key, e.target.value)}
          >
            {options[d.key].map((v) => (
              <option key={v} value={v}>
                {d.optionPrefix ? `${d.optionPrefix}${v}` : v}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
