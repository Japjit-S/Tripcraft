import {
  ActivityCategory,
  AuditEntry,
  CandidateActivity,
  DayOfWeek,
  DayWeatherState,
  Destination,
  EngineItineraryItem,
  EngineTripDay,
  Persona,
  Slot,
} from '../types/engine';
import { scoreCandidate, sortScoredCandidates } from './scoring';
import {
  isExpeditionCandidate,
  isVenueOpenDuringInterval,
  minutesToTimeStr,
  timeStrToMinutes,
} from './timeline';
import { sequenceDayStops } from './geography';
import { getRelaxationVenueForSlot } from './relaxationVenues';

export interface DayAllocationInput {
  dayNumber: number;
  dateStr: string;
  weatherState: DayWeatherState;
  weatherSummary: string;
  isEstimatedWeather?: boolean;
  weatherSource?: 'forecast' | 'historical_estimate' | 'fallback_estimate';
  weatherConfidence?: 'high' | 'medium' | 'low';
  weatherResolution?: 'daily' | 'hourly';
  blockedSlots: Slot[];
  survivors: CandidateActivity[];
  arrivalAt?: string;
}

export interface AllocationResult {
  itineraryDays: EngineTripDay[];
  auditEntries: AuditEntry[];
}

const DAYS_OF_WEEK: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

function getDayOfWeek(dateStr: string): DayOfWeek {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return DAYS_OF_WEEK[d.getUTCDay()];
}

/**
 * Stage 1 Temporal Allocation Engine:
 * Replaces fixed slot heuristics with continuous timeline tracking,
 * arrival-time boundary enforcement, multi-slot continuous excursions,
 * linked multi-day expeditions, and cumulative fatigue management.
 */
export function allocateItinerarySlots(
  daysInput: DayAllocationInput[],
  persona: Persona,
  destination?: Destination
): AllocationResult {
  const auditEntries: AuditEntry[] = [];
  const usedCandidateIds = new Set<string>();

  const destCoords = destination
    ? { lat: destination.latitude, lon: destination.longitude }
    : daysInput[0]?.survivors[0]?.coords ?? { lat: 26.9124, lon: 75.7873 };

  // ==========================================
  // PASS A: Distribute High-Prominence Anchors & Linked Expeditions
  // ==========================================
  const dayAnchors = new Map<number, CandidateActivity>();
  const multiDayExpeditions = new Map<
    number,
    { candidate: CandidateActivity; phase: 'ascent' | 'descent'; linkedId: string }
  >();

  for (let i = 0; i < daysInput.length; i++) {
    const day = daysInput[i];
    const isDay1LateArrival =
      day.dayNumber === 1 &&
      (day.blockedSlots.includes('MORNING') && day.blockedSlots.includes('AFTERNOON'));

    // If Day 1 arrival precludes daytime sightseeing, do NOT consume the primary anchor on Day 1!
    if (isDay1LateArrival) {
      auditEntries.push({
        dayNumber: 1,
        stage: 'ARRIVAL_GATE',
        candidateId: 'anchor-gate',
        candidateTitle: 'Day 1 Daytime Slots',
        verdict: 'DEFERRED',
        ruleId: 'ANCHOR_ARRIVAL_GATE_DEFERRAL',
        reason: `Late arrival scheduled at ${day.arrivalAt || 'evening'}; primary landmark anchor deferred to Day 2 for full daylight.`,
      });
      continue;
    }

    // Check if this day is already reserved as the descent phase of a previous day's expedition
    if (multiDayExpeditions.has(day.dayNumber)) {
      continue;
    }

    // Select highest prominence landmark or iconic trek candidate
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
      for (const candidate of landmarkCandidates) {
        const hasNextDay = i + 1 < daysInput.length;
        const wantsMultiDay =
          hasNextDay &&
          isExpeditionCandidate(candidate) &&
          candidate.typicalDurationMin >= 360;

        if (wantsMultiDay) {
          const nextDay = daysInput[i + 1];
          const nextDayMorningBlocked = nextDay.blockedSlots.includes('MORNING');
          const isNextDayWeatherHazard =
            !candidate.indoor &&
            (nextDay.weatherState === 'STORM' ||
              (nextDay.weatherState === 'RAIN' && candidate.intensity === 'HIGH') ||
              nextDay.weatherState === 'COLD_WIND' ||
              nextDay.weatherState === 'EXTREME_HEAT' ||
              !nextDay.survivors.some((s) => s.id === candidate.id));

          if (nextDayMorningBlocked) {
            continue;
          }

          if (isNextDayWeatherHazard) {
            auditEntries.push({
              dayNumber: day.dayNumber,
              stage: 'WEATHER_FILTER',
              candidateId: candidate.id,
              candidateTitle: candidate.title,
              verdict: 'REMOVED',
              ruleId: 'MULTI_DAY_WEATHER_HAZARD',
              reason: `Multi-day expedition "${candidate.title}" cancelled: Day ${nextDay.dayNumber} weather (${nextDay.weatherState}) creates hazardous conditions for outdoor continuation.`,
            });
            continue;
          }

          // Weather safe across both days: allocate linked expedition
          const linkedId = `exp-${candidate.id}-d${day.dayNumber}`;
          dayAnchors.set(day.dayNumber, candidate);
          multiDayExpeditions.set(day.dayNumber, {
            candidate,
            phase: 'ascent',
            linkedId,
          });
          multiDayExpeditions.set(day.dayNumber + 1, {
            candidate,
            phase: 'descent',
            linkedId,
          });
          usedCandidateIds.add(candidate.id);

          auditEntries.push({
            dayNumber: day.dayNumber,
            stage: 'ALLOCATION',
            candidateId: candidate.id,
            candidateTitle: candidate.title,
            verdict: 'SELECTED',
            ruleId: 'MULTI_DAY_EXPEDITION_LINKING',
            reason: `Allocated linked multi-day expedition (${candidate.title}) spanning Day ${day.dayNumber} ascent and Day ${day.dayNumber + 1} descent.`,
          });
          break;
        } else {
          dayAnchors.set(day.dayNumber, candidate);
          usedCandidateIds.add(candidate.id);

          auditEntries.push({
            dayNumber: day.dayNumber,
            stage: 'ALLOCATION',
            candidateId: candidate.id,
            candidateTitle: candidate.title,
            verdict: 'SELECTED',
            ruleId: 'ANCHOR_LANDMARK_DISTRIBUTION',
            reason: `Selected as primary high-prominence anchor landmark for Day ${day.dayNumber}.`,
          });
          break;
        }
      }
    } else if (day.weatherState === 'STORM' || day.weatherState === 'RAIN') {
      auditEntries.push({
        dayNumber: day.dayNumber,
        stage: 'WEATHER_FILTER',
        candidateId: `anchor-day-${day.dayNumber}`,
        candidateTitle: `Day ${day.dayNumber} Anchors`,
        verdict: 'DEFERRED',
        ruleId: 'ANCHOR_WEATHER_SAFETY_REMOVAL',
        reason: `No weather-safe landmark anchors available for Day ${day.dayNumber} due to ${day.weatherState}; falling back to indoor cultural and leisure activities.`,
      });
    }
  }

  // ==========================================
  // PASS B: Temporal Timeline Scheduling per Day
  // ==========================================
  const itineraryDays: EngineTripDay[] = [];
  let cumulativeFatigue = 0;

  for (let dayIndex = 0; dayIndex < daysInput.length; dayIndex++) {
    const day = daysInput[dayIndex];
    const dayOfWeek = getDayOfWeek(day.dateStr);
    const dayCategories: ActivityCategory[] = [];
    let dayIntensityLoad = 0;
    const dayTimeline: EngineItineraryItem[] = [];

    const slotItems: Record<Slot, EngineItineraryItem[]> = {
      MORNING: [],
      AFTERNOON: [],
      EVENING: [],
    };

    // Calculate daily start time based on fatigue and Day 1 arrival
    let currentMin = 8 * 60 + 30; // 08:30 default start
    if (day.dayNumber === 1 && day.arrivalAt) {
      const parsedArrival = timeStrToMinutes(day.arrivalAt);
      if (parsedArrival !== null) {
        currentMin = Math.max(currentMin, parsedArrival + 60); // 60m transit & check-in buffer
      }
    } else if (cumulativeFatigue >= 5) {
      // Recovery buffer following heavy physical exertion on previous day
      currentMin = 9 * 60 + 30; // Push wake/start to 09:30
      auditEntries.push({
        dayNumber: day.dayNumber,
        stage: 'ALLOCATION',
        candidateId: `recovery-day-${day.dayNumber}`,
        candidateTitle: 'Gentle Morning Recovery',
        verdict: 'SELECTED',
        ruleId: 'CUMULATIVE_FATIGUE_RECOVERY',
        reason: `Cumulative exertion index (${cumulativeFatigue}) triggered a 60-minute relaxed morning start window.`,
      });
    }

    const anchor = dayAnchors.get(day.dayNumber);
    const expeditionInfo = multiDayExpeditions.get(day.dayNumber);

    // ----------------------------------------------------
    // Scenario 1: Day 1 Late Arrival (Evening Only / No Sightseeing)
    // ----------------------------------------------------
    if (
      day.dayNumber === 1 &&
      day.blockedSlots.includes('MORNING') &&
      day.blockedSlots.includes('AFTERNOON')
    ) {
      const arrivalMin = timeStrToMinutes(day.arrivalAt) ?? 19 * 60 + 30;
      const checkInEnd = minutesToTimeStr(Math.min(1439, arrivalMin + 60));
      const dinnerStart = checkInEnd;
      const dinnerEnd = minutesToTimeStr(Math.min(1439, arrivalMin + 150));

      const transitMorning: EngineItineraryItem = {
        id: `transit-1-morning`,
        candidateId: `transit-morning`,
        title: 'Inbound Transit & Arrival Travel',
        category: 'RELAXATION',
        indoor: true,
        slot: 'MORNING',
        eventKind: 'arrival_checkin',
        startTime: '09:00',
        endTime: '12:00',
        durationMin: 180,
        reason: `Morning slot occupied by inbound travel to destination.`,
        intensity: 'LOW',
        typicalDurationMin: 180,
        coords: anchor?.coords ?? destCoords,
      };

      const transitAfternoon: EngineItineraryItem = {
        id: `transit-1-afternoon`,
        candidateId: `transit-afternoon`,
        title: 'Arrival Logistics & Hotel Check-in',
        category: 'RELAXATION',
        indoor: true,
        slot: 'AFTERNOON',
        eventKind: 'arrival_checkin',
        startTime: '13:30',
        endTime: '17:00',
        durationMin: 210,
        reason: `Afternoon slot reserved for terminal transit, transfer, and hotel room check-in.`,
        intensity: 'LOW',
        typicalDurationMin: 210,
        coords: anchor?.coords ?? destCoords,
      };

      const dinnerEvening: EngineItineraryItem = {
        id: `dinner-1-evening`,
        candidateId: `dinner-evening`,
        title: 'Evening Arrival Dinner & Local Welcome',
        category: 'FOOD',
        indoor: true,
        slot: 'EVENING',
        eventKind: 'meal',
        startTime: dinnerStart,
        endTime: dinnerEnd,
        durationMin: 90,
        reason: `Evening dinner and relaxed settling-in following arrival. No strenuous sightseeing scheduled.`,
        intensity: 'LOW',
        typicalDurationMin: 90,
        coords: anchor?.coords ?? destCoords,
      };

      slotItems.MORNING.push(transitMorning);
      slotItems.AFTERNOON.push(transitAfternoon);
      slotItems.EVENING.push(dinnerEvening);
      dayTimeline.push(transitMorning, transitAfternoon, dinnerEvening);

      itineraryDays.push({
        id: `day-${day.dayNumber}`,
        dayNumber: day.dayNumber,
        date: day.dateStr,
        weatherState: day.weatherState,
        weatherSummary: day.weatherSummary,
        isEstimatedWeather: day.isEstimatedWeather,
        cumulativeFatigueLoad: cumulativeFatigue,
        timeline: dayTimeline,
        morning: slotItems.MORNING,
        afternoon: slotItems.AFTERNOON,
        evening: slotItems.EVENING,
      });
      continue;
    }

    // ----------------------------------------------------
    // Scenario 2: Active Linked Multi-Day Expedition Day
    // ----------------------------------------------------
    if (expeditionInfo) {
      const exp = expeditionInfo.candidate;
      if (expeditionInfo.phase === 'ascent') {
        const trekStart = '09:30';
        const trekEnd = '16:30';
        const morningItem: EngineItineraryItem = {
          id: `item-${day.dayNumber}-${exp.id}-ascent`,
          candidateId: exp.id,
          title: `${exp.title} — Base Trail & High Ascent`,
          category: exp.category,
          indoor: false,
          slot: 'MORNING',
          eventKind: 'expedition_phase',
          startTime: trekStart,
          endTime: trekEnd,
          durationMin: 420,
          linkedExpeditionId: expeditionInfo.linkedId,
          expeditionPhase: 'ascent',
          reason: `Multi-day expedition (Phase 1): Day-long continuous alpine trek and ascent.`,
          intensity: 'HIGH',
          typicalDurationMin: 420,
          coords: exp.coords,
        };

        const afternoonContinuation: EngineItineraryItem = {
          id: `item-${day.dayNumber}-${exp.id}-camp`,
          candidateId: exp.id,
          title: `${exp.title} — Ridge Camp & Scenic Leisure`,
          category: 'RELAXATION',
          indoor: false,
          slot: 'AFTERNOON',
          eventKind: 'expedition_phase',
          startTime: '13:30',
          endTime: trekEnd,
          durationMin: 180,
          linkedExpeditionId: expeditionInfo.linkedId,
          expeditionPhase: 'camp',
          continuationOfId: morningItem.id,
          reason: `Continuation of alpine trek through afternoon into high ridge camp.`,
          intensity: 'LOW',
          typicalDurationMin: 180,
          coords: exp.coords,
        };

        const eveningRest: EngineItineraryItem = {
          id: `item-${day.dayNumber}-${exp.id}-night`,
          candidateId: `camp-evening`,
          title: 'Campfire Dinner & Stargazing',
          category: 'FOOD',
          indoor: false,
          slot: 'EVENING',
          eventKind: 'meal',
          startTime: '18:30',
          endTime: '21:00',
          durationMin: 150,
          linkedExpeditionId: expeditionInfo.linkedId,
          reason: `Overnight mountain lodge dinner and recovery rest.`,
          intensity: 'LOW',
          typicalDurationMin: 150,
          coords: exp.coords,
        };

        slotItems.MORNING.push(morningItem);
        slotItems.AFTERNOON.push(afternoonContinuation);
        slotItems.EVENING.push(eveningRest);
        dayTimeline.push(morningItem, afternoonContinuation, eveningRest);

        dayIntensityLoad += 4;
        cumulativeFatigue += 4;

        itineraryDays.push({
          id: `day-${day.dayNumber}`,
          dayNumber: day.dayNumber,
          date: day.dateStr,
          weatherState: day.weatherState,
          weatherSummary: day.weatherSummary,
          isEstimatedWeather: day.isEstimatedWeather,
          cumulativeFatigueLoad: cumulativeFatigue,
          timeline: dayTimeline,
          morning: slotItems.MORNING,
          afternoon: slotItems.AFTERNOON,
          evening: slotItems.EVENING,
        });
        continue;
      } else if (expeditionInfo.phase === 'descent') {
        const descentItem: EngineItineraryItem = {
          id: `item-${day.dayNumber}-${exp.id}-descent`,
          candidateId: exp.id,
          title: `${exp.title} — Summit Sunrise & Valley Descent`,
          category: exp.category,
          indoor: false,
          slot: 'MORNING',
          eventKind: 'expedition_phase',
          startTime: '08:30',
          endTime: '12:30',
          durationMin: 240,
          linkedExpeditionId: expeditionInfo.linkedId,
          expeditionPhase: 'descent',
          reason: `Multi-day expedition (Phase 2): Morning summit viewpoint and gradual valley descent.`,
          intensity: 'MEDIUM',
          typicalDurationMin: 240,
          coords: exp.coords,
        };

        const afternoonRest: EngineItineraryItem = {
          id: `rest-${day.dayNumber}-afternoon`,
          candidateId: `rest-afternoon`,
          title: 'Post-Trek Hot Spring & Spa Recovery',
          category: 'RELAXATION',
          indoor: true,
          slot: 'AFTERNOON',
          eventKind: 'recovery',
          startTime: '14:00',
          endTime: '16:30',
          durationMin: 150,
          reason: `Post-trek recovery buffer to mitigate cumulative physical exertion.`,
          intensity: 'LOW',
          typicalDurationMin: 150,
          coords: exp.coords,
        };

        const eveningDining: EngineItineraryItem = {
          id: `dinner-${day.dayNumber}-evening`,
          candidateId: `dinner-evening`,
          title: 'Celebratory Local Feast & Evening Promenade',
          category: 'FOOD',
          indoor: true,
          slot: 'EVENING',
          eventKind: 'meal',
          startTime: '18:30',
          endTime: '21:00',
          durationMin: 150,
          reason: `Celebratory evening dinner and local cuisine tasting.`,
          intensity: 'LOW',
          typicalDurationMin: 150,
          coords: exp.coords,
        };

        slotItems.MORNING.push(descentItem);
        slotItems.AFTERNOON.push(afternoonRest);
        slotItems.EVENING.push(eveningDining);
        dayTimeline.push(descentItem, afternoonRest, eveningDining);

        cumulativeFatigue = Math.max(0, cumulativeFatigue - 2); // Recovery begins

        itineraryDays.push({
          id: `day-${day.dayNumber}`,
          dayNumber: day.dayNumber,
          date: day.dateStr,
          weatherState: day.weatherState,
          weatherSummary: day.weatherSummary,
          isEstimatedWeather: day.isEstimatedWeather,
          cumulativeFatigueLoad: cumulativeFatigue,
          timeline: dayTimeline,
          morning: slotItems.MORNING,
          afternoon: slotItems.AFTERNOON,
          evening: slotItems.EVENING,
        });
        continue;
      }
    }

    // ----------------------------------------------------
    // Scenario 3: Standard Temporal Day Flow
    // ----------------------------------------------------

    // --- MORNING WINDOW (09:00 - 12:30) ---
    if (day.blockedSlots.includes('MORNING')) {
      const transitItem: EngineItineraryItem = {
        id: `transit-${day.dayNumber}-morning`,
        candidateId: `transit-morning`,
        title: 'Arrival Transit & Hotel Check-in',
        category: 'RELAXATION',
        indoor: true,
        slot: 'MORNING',
        eventKind: 'arrival_checkin',
        startTime: '09:00',
        endTime: '12:00',
        durationMin: 180,
        reason: `Morning window reserved for arrival transit and check-in logistics.`,
        intensity: 'LOW',
        typicalDurationMin: 180,
        coords: anchor?.coords ?? destCoords,
      };
      slotItems.MORNING.push(transitItem);
      dayTimeline.push(transitItem);
    } else {
      let morningAssigned = false;

      // Assign morning anchor if available and preferred for morning
      if (anchor && (!anchor.slotAffinity || anchor.slotAffinity.includes('MORNING'))) {
        const visitDuration = Math.min(240, Math.max(60, anchor.typicalDurationMin));
        const startTime = '09:00';
        const endTime = minutesToTimeStr(9 * 60 + visitDuration);

        const hoursCheck = isVenueOpenDuringInterval(anchor, dayOfWeek, 9 * 60, 9 * 60 + visitDuration);
        if (hoursCheck.isOpen) {
          const isContinuousExcursion = anchor.typicalDurationMin >= 240;
          const anchorWeatherAdvisory =
            day.weatherState === 'RAIN' && !anchor.indoor
              ? ' (Gear advisory: carry light rain protection for outdoor sections).'
              : '';

          const anchorItem: EngineItineraryItem = {
            id: `item-${day.dayNumber}-${anchor.id}`,
            candidateId: anchor.id,
            title: anchor.title,
            category: anchor.category,
            indoor: anchor.indoor,
            slot: 'MORNING',
            eventKind: isContinuousExcursion ? 'expedition_phase' : 'activity',
            startTime,
            endTime: isContinuousExcursion ? minutesToTimeStr(9 * 60 + anchor.typicalDurationMin) : endTime,
            durationMin: isContinuousExcursion ? anchor.typicalDurationMin : visitDuration,
            reason: `Day anchor landmark and iconic city highlight.${anchorWeatherAdvisory}`,
            intensity: anchor.intensity,
            typicalDurationMin: anchor.typicalDurationMin,
            coords: anchor.coords,
            isOpenKnown: hoursCheck.isHoursKnown,
            hoursEvaluated: true,
          };

          slotItems.MORNING.push(anchorItem);
          dayTimeline.push(anchorItem);
          dayCategories.push(anchor.category);
          dayIntensityLoad += anchor.intensity === 'HIGH' ? 3 : anchor.intensity === 'MEDIUM' ? 2 : 1;
          morningAssigned = true;

          // If this is a 4+ hour continuous excursion, handle afternoon continuation block
          if (isContinuousExcursion && !day.blockedSlots.includes('AFTERNOON')) {
            const bufferItem: EngineItineraryItem = {
              id: `buffer-${day.dayNumber}-afternoon`,
              candidateId: `buffer-afternoon`,
              title: `${anchor.title} — Rest & Trail Buffer`,
              category: 'RELAXATION',
              indoor: false,
              slot: 'AFTERNOON',
              eventKind: 'expedition_phase',
              startTime: '13:30',
              endTime: minutesToTimeStr(13 * 60 + 30 + 120),
              durationMin: 120,
              continuationOfId: anchorItem.id,
              reason: `Multi-slot continuation: Anchor activity requires 4+ hours (${anchor.typicalDurationMin}m); afternoon is reserved for relaxed pacing and transit buffer.`,
              intensity: 'LOW',
              typicalDurationMin: 120,
              coords: anchor.coords,
            };

            slotItems.AFTERNOON.push(bufferItem);
            dayTimeline.push(bufferItem);
            dayCategories.push('RELAXATION');

            auditEntries.push({
              dayNumber: day.dayNumber,
              stage: 'ALLOCATION',
              candidateId: bufferItem.id,
              candidateTitle: bufferItem.title,
              verdict: 'SELECTED',
              ruleId: 'MULTI_SLOT_SPAN_BUFFER',
              reason: `Anchor excursion (${anchor.typicalDurationMin}m) spans into afternoon; reserved relaxation buffer.`,
            });
          }
        }
      }

      // If morning still empty, greedy score available candidates
      if (!morningAssigned) {
        const available = day.survivors.filter((c) => !usedCandidateIds.has(c.id));
        const scored = available
          .filter((c) => isVenueOpenDuringInterval(c, dayOfWeek, 9 * 60, 11 * 60 + 30).isOpen)
          .map((candidate) =>
            scoreCandidate({
              candidate,
              persona,
              weatherState: day.weatherState,
              slot: 'MORNING',
              anchorCoords: anchor?.coords,
              categoriesSelectedInDay: dayCategories,
              intensityLoadSoFar: dayIntensityLoad,
            })
          );

        const sorted = sortScoredCandidates(scored);
        if (sorted.length > 0) {
          const best = sorted[0];
          usedCandidateIds.add(best.candidate.id);
          const duration = Math.min(180, Math.max(60, best.candidate.typicalDurationMin));

          const morningItem: EngineItineraryItem = {
            id: `item-${day.dayNumber}-${best.candidate.id}`,
            candidateId: best.candidate.id,
            title: best.candidate.title,
            category: best.candidate.category,
            indoor: best.candidate.indoor,
            slot: 'MORNING',
            eventKind: 'activity',
            startTime: '09:00',
            endTime: minutesToTimeStr(9 * 60 + duration),
            durationMin: duration,
            reason: `Curated morning visit tailored for ${persona} and optimal weather conditions.`,
            intensity: best.candidate.intensity,
            typicalDurationMin: best.candidate.typicalDurationMin,
            coords: best.candidate.coords,
            scoreBreakdown: best.breakdown,
          };

          slotItems.MORNING.push(morningItem);
          dayTimeline.push(morningItem);
          dayCategories.push(best.candidate.category);
          dayIntensityLoad += best.candidate.intensity === 'HIGH' ? 3 : 1;
        } else {
          // Graceful degradation for morning: resolve authentic destination relaxation venue
          const venue = getRelaxationVenueForSlot(destination, 'MORNING', day.dayNumber, day.weatherState);
          const flexItem: EngineItineraryItem = {
            id: `flex-${day.dayNumber}-morning`,
            candidateId: `flex-morning`,
            title: venue.title,
            category: venue.category,
            indoor: venue.indoor,
            slot: 'MORNING',
            eventKind: 'rest',
            startTime: '09:30',
            endTime: '11:30',
            durationMin: 120,
            reason: venue.reason,
            intensity: venue.intensity,
            typicalDurationMin: venue.typicalDurationMin,
            coords: anchor?.coords ?? venue.coords,
            isFlex: true,
            flexReason: `Thin candidate pool for morning under ${day.weatherState} conditions.`,
          };
          slotItems.MORNING.push(flexItem);
          dayTimeline.push(flexItem);

          auditEntries.push({
            dayNumber: day.dayNumber,
            stage: 'DEGRADATION',
            candidateId: flexItem.id,
            candidateTitle: flexItem.title,
            verdict: 'SELECTED',
            ruleId: 'DEGRADATION_THIN_POOL',
            reason: `Thin candidate pool for morning under ${day.weatherState} conditions; scheduled destination relaxation venue: ${venue.title}.`,
          });
        }
      }
    }

    // --- AFTERNOON WINDOW (13:30 - 17:30) ---
    if (day.blockedSlots.includes('AFTERNOON')) {
      if (slotItems.AFTERNOON.length === 0) {
        const transitItem: EngineItineraryItem = {
          id: `transit-${day.dayNumber}-afternoon`,
          candidateId: `transit-afternoon`,
          title: 'Arrival Transit & Hotel Check-in',
          category: 'RELAXATION',
          indoor: true,
          slot: 'AFTERNOON',
          eventKind: 'arrival_checkin',
          startTime: '13:30',
          endTime: '16:30',
          durationMin: 180,
          reason: `Afternoon slot reserved for arrival transit and check-in logistics.`,
          intensity: 'LOW',
          typicalDurationMin: 180,
          coords: anchor?.coords ?? destCoords,
        };
        slotItems.AFTERNOON.push(transitItem);
        dayTimeline.push(transitItem);
      }
    } else if (slotItems.AFTERNOON.length === 0) {
      // Afternoon not yet filled by continuous excursion; allocate anchor if not yet used
      let afternoonAssigned = false;

      if (anchor && !usedCandidateIds.has(anchor.id)) {
        const visitDuration = Math.min(180, Math.max(60, anchor.typicalDurationMin));
        const hoursCheck = isVenueOpenDuringInterval(anchor, dayOfWeek, 13 * 60 + 30, 13 * 60 + 30 + visitDuration);
        if (hoursCheck.isOpen) {
          const anchorItem: EngineItineraryItem = {
            id: `item-${day.dayNumber}-${anchor.id}`,
            candidateId: anchor.id,
            title: anchor.title,
            category: anchor.category,
            indoor: anchor.indoor,
            slot: 'AFTERNOON',
            eventKind: 'activity',
            startTime: '13:30',
            endTime: minutesToTimeStr(13 * 60 + 30 + visitDuration),
            durationMin: visitDuration,
            reason: 'Day anchor landmark and afternoon city highlight.',
            intensity: anchor.intensity,
            typicalDurationMin: anchor.typicalDurationMin,
            coords: anchor.coords,
            isOpenKnown: hoursCheck.isHoursKnown,
            hoursEvaluated: true,
          };

          slotItems.AFTERNOON.push(anchorItem);
          dayTimeline.push(anchorItem);
          dayCategories.push(anchor.category);
          dayIntensityLoad += anchor.intensity === 'HIGH' ? 3 : 2;
          afternoonAssigned = true;
          usedCandidateIds.add(anchor.id);
        }
      }

      if (!afternoonAssigned) {
        const available = day.survivors.filter((c) => !usedCandidateIds.has(c.id));
        const scored = available
          .filter((c) => isVenueOpenDuringInterval(c, dayOfWeek, 14 * 60, 16 * 60 + 30).isOpen)
          .map((candidate) =>
            scoreCandidate({
              candidate,
              persona,
              weatherState: day.weatherState,
              slot: 'AFTERNOON',
              anchorCoords: anchor?.coords,
              categoriesSelectedInDay: dayCategories,
              intensityLoadSoFar: dayIntensityLoad,
            })
          );

        const sorted = sortScoredCandidates(scored);
        if (sorted.length > 0) {
          const best = sorted[0];
          usedCandidateIds.add(best.candidate.id);
          const duration = Math.min(180, Math.max(60, best.candidate.typicalDurationMin));

          const afternoonItem: EngineItineraryItem = {
            id: `item-${day.dayNumber}-${best.candidate.id}`,
            candidateId: best.candidate.id,
            title: best.candidate.title,
            category: best.candidate.category,
            indoor: best.candidate.indoor,
            slot: 'AFTERNOON',
            eventKind: 'activity',
            startTime: '13:30',
            endTime: minutesToTimeStr(13 * 60 + 30 + duration),
            durationMin: duration,
            reason: `Curated afternoon visit tailored for ${persona}.`,
            intensity: best.candidate.intensity,
            typicalDurationMin: best.candidate.typicalDurationMin,
            coords: best.candidate.coords,
            scoreBreakdown: best.breakdown,
          };

          slotItems.AFTERNOON.push(afternoonItem);
          dayTimeline.push(afternoonItem);
          dayCategories.push(best.candidate.category);
          dayIntensityLoad += best.candidate.intensity === 'HIGH' ? 3 : 1;
        } else {
          // Graceful degradation for afternoon: resolve authentic destination relaxation venue
          const venue = getRelaxationVenueForSlot(destination, 'AFTERNOON', day.dayNumber, day.weatherState);
          const flexItem: EngineItineraryItem = {
            id: `flex-${day.dayNumber}-afternoon`,
            candidateId: `flex-afternoon`,
            title: venue.title,
            category: venue.category,
            indoor: venue.indoor,
            slot: 'AFTERNOON',
            eventKind: 'rest',
            startTime: '14:00',
            endTime: '16:00',
            durationMin: 120,
            reason: venue.reason,
            intensity: venue.intensity,
            typicalDurationMin: venue.typicalDurationMin,
            coords: anchor?.coords ?? venue.coords,
            isFlex: true,
            flexReason: `Thin candidate pool for afternoon under ${day.weatherState} conditions.`,
          };
          slotItems.AFTERNOON.push(flexItem);
          dayTimeline.push(flexItem);

          auditEntries.push({
            dayNumber: day.dayNumber,
            stage: 'DEGRADATION',
            candidateId: flexItem.id,
            candidateTitle: flexItem.title,
            verdict: 'SELECTED',
            ruleId: 'DEGRADATION_THIN_POOL',
            reason: `Thin candidate pool for afternoon under ${day.weatherState} conditions; scheduled destination relaxation venue: ${venue.title}.`,
          });
        }
      }
    }

    // --- EVENING WINDOW (18:00 - 21:30) ---
    if (day.blockedSlots.includes('EVENING')) {
      const transitItem: EngineItineraryItem = {
        id: `transit-${day.dayNumber}-evening`,
        candidateId: `transit-evening`,
        title: 'Arrival Logistics & Hotel Rest',
        category: 'RELAXATION',
        indoor: true,
        slot: 'EVENING',
        eventKind: 'arrival_checkin',
        startTime: '19:30',
        endTime: '21:30',
        durationMin: 120,
        reason: `Evening slot reserved for arrival transit and check-in logistics.`,
        intensity: 'LOW',
        typicalDurationMin: 120,
        coords: anchor?.coords ?? destCoords,
      };
      slotItems.EVENING.push(transitItem);
      dayTimeline.push(transitItem);
    } else {
      const available = day.survivors.filter((c) => !usedCandidateIds.has(c.id));
      const scored = available
        .filter((c) => isVenueOpenDuringInterval(c, dayOfWeek, 18 * 60, 20 * 60 + 30).isOpen)
        .map((candidate) =>
          scoreCandidate({
            candidate,
            persona,
            weatherState: day.weatherState,
            slot: 'EVENING',
            anchorCoords: anchor?.coords,
            categoriesSelectedInDay: dayCategories,
            intensityLoadSoFar: dayIntensityLoad,
          })
        );

      const sorted = sortScoredCandidates(scored);
      if (sorted.length > 0) {
        const best = sorted[0];
        usedCandidateIds.add(best.candidate.id);
        const duration = Math.min(180, Math.max(60, best.candidate.typicalDurationMin));

        const eveningItem: EngineItineraryItem = {
          id: `item-${day.dayNumber}-${best.candidate.id}`,
          candidateId: best.candidate.id,
          title: best.candidate.title,
          category: best.candidate.category,
          indoor: best.candidate.indoor,
          slot: 'EVENING',
          eventKind: 'activity',
          startTime: '18:00',
          endTime: minutesToTimeStr(18 * 60 + duration),
          durationMin: duration,
          reason: `Atmospheric evening destination curated for ${persona}.`,
          intensity: best.candidate.intensity,
          typicalDurationMin: best.candidate.typicalDurationMin,
          coords: best.candidate.coords,
          scoreBreakdown: best.breakdown,
        };

        slotItems.EVENING.push(eveningItem);
        dayTimeline.push(eveningItem);
        dayCategories.push(best.candidate.category);
        dayIntensityLoad += best.candidate.intensity === 'HIGH' ? 3 : 1;
      } else {
        // Graceful degradation for evening: resolve authentic destination relaxation venue
        const venue = getRelaxationVenueForSlot(destination, 'EVENING', day.dayNumber, day.weatherState);
        const flexItem: EngineItineraryItem = {
          id: `flex-${day.dayNumber}-evening`,
          candidateId: `flex-evening`,
          title: venue.title,
          category: venue.category,
          indoor: venue.indoor,
          slot: 'EVENING',
          eventKind: 'meal',
          startTime: '18:30',
          endTime: '20:30',
          durationMin: 120,
          reason: venue.reason,
          intensity: venue.intensity,
          typicalDurationMin: venue.typicalDurationMin,
          coords: anchor?.coords ?? venue.coords,
          isFlex: true,
          flexReason: `Thin candidate pool for evening under ${day.weatherState} conditions.`,
        };
        slotItems.EVENING.push(flexItem);
        dayTimeline.push(flexItem);

        auditEntries.push({
          dayNumber: day.dayNumber,
          stage: 'DEGRADATION',
          candidateId: flexItem.id,
          candidateTitle: flexItem.title,
          verdict: 'SELECTED',
          ruleId: 'DEGRADATION_THIN_POOL',
          reason: `Thin candidate pool for evening under ${day.weatherState} conditions; scheduled destination relaxation venue: ${venue.title}.`,
        });
      }
    }

    // Cumulative fatigue tracking
    cumulativeFatigue = Math.max(0, cumulativeFatigue + dayIntensityLoad - 2);

    const { sequencedItems, totalDistanceKm, totalTransitMin } = sequenceDayStops(dayTimeline);

    if (totalDistanceKm > 0) {
      auditEntries.push({
        dayNumber: day.dayNumber,
        stage: 'ALLOCATION',
        candidateId: `route-day-${day.dayNumber}`,
        candidateTitle: `Geographic Route Sequencing`,
        verdict: 'SELECTED',
        ruleId: 'GEOGRAPHIC_ROUTE_SEQUENCING',
        reason: `Sequenced daily stops along non-backtracking trajectory (${totalDistanceKm}km transit, ~${totalTransitMin}m travel buffer).`,
      });
    }

    itineraryDays.push({
      id: `day-${day.dayNumber}`,
      dayNumber: day.dayNumber,
      date: day.dateStr,
      weatherState: day.weatherState,
      weatherSummary: day.weatherSummary,
      isEstimatedWeather: day.isEstimatedWeather,
      weatherSource: day.weatherSource,
      weatherConfidence: day.weatherConfidence,
      weatherResolution: day.weatherResolution,
      cumulativeFatigueLoad: cumulativeFatigue,
      timeline: sequencedItems,
      morning: slotItems.MORNING,
      afternoon: slotItems.AFTERNOON,
      evening: slotItems.EVENING,
    });
  }

  return { itineraryDays, auditEntries };
}
