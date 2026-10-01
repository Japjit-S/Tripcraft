import {
  ActivityCategory,
  AuditEntry,
  CandidateActivity,
  DayWeatherState,
  EngineItineraryItem,
  EngineTripDay,
  Persona,
  Slot,
} from '../types/engine';
import { scoreCandidate, sortScoredCandidates } from './scoring';

export interface DayAllocationInput {
  dayNumber: number;
  dateStr: string;
  weatherState: DayWeatherState;
  weatherSummary: string;
  isEstimatedWeather?: boolean;
  blockedSlots: Slot[];
  survivors: CandidateActivity[];
}

export interface AllocationResult {
  itineraryDays: EngineTripDay[];
  auditEntries: AuditEntry[];
}

export function allocateItinerarySlots(
  daysInput: DayAllocationInput[],
  persona: Persona
): AllocationResult {
  const auditEntries: AuditEntry[] = [];
  const usedCandidateIds = new Set<string>();

  // ==========================================
  // PASS A: Distribute High-Prominence Anchors
  // ==========================================
  const dayAnchors = new Map<number, CandidateActivity>();

  for (const day of daysInput) {
    const landmarkCandidates = day.survivors
      .filter(
        (c) =>
          !usedCandidateIds.has(c.id) &&
          (c.category === 'LANDMARK' ||
            c.category === 'CULTURE' ||
            (c.category === 'NATURE' && (persona === 'Backpacker' || c.prominence >= 0.65)) ||
            c.prominence >= 0.7)
      )
      .sort((a, b) => b.prominence - a.prominence || a.id.localeCompare(b.id));

    if (landmarkCandidates.length > 0) {
      const anchor = landmarkCandidates[0];
      dayAnchors.set(day.dayNumber, anchor);
      usedCandidateIds.add(anchor.id);

      auditEntries.push({
        dayNumber: day.dayNumber,
        stage: 'ALLOCATION',
        candidateId: anchor.id,
        candidateTitle: anchor.title,
        verdict: 'SELECTED',
        ruleId: 'ANCHOR_LANDMARK_DISTRIBUTION',
        reason: `Selected as primary high-prominence anchor landmark for Day ${day.dayNumber}.`,
      });
    }
  }

  // ==========================================
  // PASS B: Greedy Fill Slots & Evening Handling
  // ==========================================
  const itineraryDays: EngineTripDay[] = [];
  const allSlots: Slot[] = ['MORNING', 'AFTERNOON', 'EVENING'];

  for (const day of daysInput) {
    const anchor = dayAnchors.get(day.dayNumber);
    const dayCategories: ActivityCategory[] = [];
    let dayIntensityLoad = 0;

    const slotItems: Record<Slot, EngineItineraryItem[]> = {
      MORNING: [],
      AFTERNOON: [],
      EVENING: [],
    };

    // Determine which slot the anchor occupies
    let anchorAssignedSlot: Slot | null = null;
    if (anchor) {
      const preferred = anchor.slotAffinity.find((s) => !day.blockedSlots.includes(s)) || 'MORNING';
      anchorAssignedSlot = day.blockedSlots.includes(preferred) ? 'AFTERNOON' : preferred;
      if (day.blockedSlots.includes(anchorAssignedSlot)) {
        anchorAssignedSlot = 'EVENING';
      }

      const anchorWeatherAdvisory =
        day.weatherState === 'RAIN' && !anchor.indoor
          ? ' (Gear advisory: carry light umbrella/rain jacket for outdoor sections).'
          : '';

      const anchorItem: EngineItineraryItem = {
        id: `item-${day.dayNumber}-${anchor.id}`,
        candidateId: anchor.id,
        title: anchor.title,
        category: anchor.category,
        indoor: anchor.indoor,
        slot: anchorAssignedSlot,
        reason: `Day anchor landmark with highest city prominence (${Math.round(anchor.prominence * 100)}%).${anchorWeatherAdvisory}`,
        intensity: anchor.intensity,
        typicalDurationMin: anchor.typicalDurationMin,
        coords: anchor.coords,
      };

      slotItems[anchorAssignedSlot].push(anchorItem);
      dayCategories.push(anchor.category);
      dayIntensityLoad += anchor.intensity === 'HIGH' ? 3 : anchor.intensity === 'MEDIUM' ? 2 : 1;
    }

    for (const slot of allSlots) {
      // 1. Check if slot was blocked by arrival gate
      if (day.blockedSlots.includes(slot)) {
        slotItems[slot].push({
          id: `transit-${day.dayNumber}-${slot.toLowerCase()}`,
          candidateId: `transit-${slot.toLowerCase()}`,
          title: 'Arrival & Hotel Check-in',
          category: 'RELAXATION',
          indoor: true,
          slot,
          reason: `Slot reserved for arrival transit and check-in logistics.`,
          intensity: 'LOW',
          typicalDurationMin: 120,
          coords: anchor?.coords ?? { lat: 0, lon: 0 },
        });
        continue;
      }

      // If slot already holds the anchor, it is filled
      if (anchorAssignedSlot === slot) {
        continue;
      }

      // Multi-slot activity spans (Bug 4): When morning anchor has typicalDurationMin >= 240 (4+ hours, e.g. mountain trek or Solang Valley excursion),
      // mark afternoon as relaxed buffer/continuation rather than scheduling a second strenuous tour.
      if (
        slot === 'AFTERNOON' &&
        anchorAssignedSlot === 'MORNING' &&
        anchor &&
        anchor.typicalDurationMin >= 240
      ) {
        const bufferItem: EngineItineraryItem = {
          id: `buffer-${day.dayNumber}-afternoon`,
          candidateId: `buffer-afternoon`,
          title: `${anchor.title} — Rest & Transit Buffer`,
          category: 'RELAXATION',
          indoor: false,
          slot: 'AFTERNOON',
          reason: `Multi-slot continuation: Anchor activity requires 4+ hours (${anchor.typicalDurationMin}m); afternoon is reserved for relaxed pacing and transit buffer.`,
          intensity: 'LOW',
          typicalDurationMin: 120,
          coords: anchor.coords,
        };

        slotItems.AFTERNOON.push(bufferItem);
        dayCategories.push('RELAXATION');
        dayIntensityLoad += 1;

        auditEntries.push({
          dayNumber: day.dayNumber,
          stage: 'ALLOCATION',
          candidateId: bufferItem.id,
          candidateTitle: bufferItem.title,
          verdict: 'SELECTED',
          ruleId: 'MULTI_SLOT_SPAN_BUFFER',
          reason: `Anchor excursion (${anchor.typicalDurationMin}m) spans into afternoon; reserved relaxation buffer.`,
        });
        continue;
      }

      // 2. Score remaining candidate survivors for this slot
      const availableCandidates = day.survivors.filter(
        (c) => !usedCandidateIds.has(c.id)
      );

      const scored = availableCandidates.map((candidate) =>
        scoreCandidate({
          candidate,
          persona,
          weatherState: day.weatherState,
          slot,
          anchorCoords: anchor?.coords,
          categoriesSelectedInDay: dayCategories,
          intensityLoadSoFar: dayIntensityLoad,
        })
      );

      const sorted = sortScoredCandidates(scored);

      if (sorted.length > 0) {
        const best = sorted[0];
        usedCandidateIds.add(best.candidate.id);

        const itemWeatherAdvisory =
          day.weatherState === 'RAIN' && !best.candidate.indoor
            ? ' (Gear advisory: carry light rain protection for outdoor sections).'
            : '';

        const chosenItem: EngineItineraryItem = {
          id: `item-${day.dayNumber}-${best.candidate.id}`,
          candidateId: best.candidate.id,
          title: best.candidate.title,
          category: best.candidate.category,
          indoor: best.candidate.indoor,
          slot,
          reason: `Selected for ${persona} based on high affinity (${best.breakdown.personaAffinity}) and weather fit (${best.breakdown.weatherFit}).${itemWeatherAdvisory}`,
          intensity: best.candidate.intensity,
          typicalDurationMin: best.candidate.typicalDurationMin,
          coords: best.candidate.coords,
          scoreBreakdown: best.breakdown,
        };

        slotItems[slot].push(chosenItem);
        dayCategories.push(best.candidate.category);
        dayIntensityLoad +=
          best.candidate.intensity === 'HIGH' ? 3 : best.candidate.intensity === 'MEDIUM' ? 2 : 1;

        auditEntries.push({
          dayNumber: day.dayNumber,
          stage: 'ALLOCATION',
          candidateId: best.candidate.id,
          candidateTitle: best.candidate.title,
          verdict: 'SELECTED',
          ruleId: 'SCORE_ALLOCATION',
          reason: `Allocated to ${slot} slot with total score ${best.breakdown.total}.`,
          scoreBreakdown: best.breakdown,
        });
      } else {
        // ==========================================
        // Stage 7: Graceful Degradation on Thin Pools
        // ==========================================
        const flexItem: EngineItineraryItem = {
          id: `flex-${day.dayNumber}-${slot.toLowerCase()}`,
          candidateId: `flex-${slot.toLowerCase()}`,
          title: 'Flexible Local Exploration & Rest',
          category: 'RELAXATION',
          indoor: day.weatherState === 'RAIN' || day.weatherState === 'STORM',
          slot,
          reason: `Flexible window scheduled due to thin pool of weather-appropriate options.`,
          intensity: 'LOW',
          typicalDurationMin: 90,
          coords: anchor?.coords ?? { lat: 0, lon: 0 },
          isFlex: true,
          flexReason: `Thin candidate pool for ${slot.toLowerCase()} under ${day.weatherState} conditions.`,
        };

        slotItems[slot].push(flexItem);

        auditEntries.push({
          dayNumber: day.dayNumber,
          stage: 'DEGRADATION',
          candidateId: flexItem.id,
          candidateTitle: flexItem.title,
          verdict: 'SELECTED',
          ruleId: 'DEGRADATION_THIN_POOL',
          reason: `Thin candidate pool; emitted explicit FLEX block for ${slot.toLowerCase()}.`,
        });
      }
    }

    itineraryDays.push({
      id: `day-${day.dayNumber}`,
      dayNumber: day.dayNumber,
      date: day.dateStr,
      weatherState: day.weatherState,
      weatherSummary: day.weatherSummary,
      isEstimatedWeather: day.isEstimatedWeather,
      morning: slotItems.MORNING,
      afternoon: slotItems.AFTERNOON,
      evening: slotItems.EVENING,
    });
  }

  return { itineraryDays, auditEntries };
}
