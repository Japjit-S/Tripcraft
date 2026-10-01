import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateItinerary } from '../../src/lib/engine';
import {
  timeStrToMinutes,
  minutesToTimeStr,
  estimateTransitMinutes,
  isVenueOpenDuringInterval,
} from '../../src/lib/engine/timeline';
import { upgradeLegacyTrip } from '../../src/lib/tripStore';
import { CandidateActivity, Trip } from '../../src/lib/types';
import { mockDestination, mockCandidates, clearForecast3Days } from './fixtures';

describe('Temporal Model & Interval Scheduling Core (Stage 1)', () => {
  it('Deterministic time arithmetic and transit estimation utility functions', () => {
    assert.equal(timeStrToMinutes('08:30'), 510);
    assert.equal(timeStrToMinutes('00:00'), 0);
    assert.equal(timeStrToMinutes('23:59'), 1439);
    assert.equal(timeStrToMinutes('invalid'), null);

    assert.equal(minutesToTimeStr(510), '08:30');
    assert.equal(minutesToTimeStr(0), '00:00');
    assert.equal(minutesToTimeStr(1439), '23:59');

    // 10km transit between coords
    const transitMin = estimateTransitMinutes(
      { lat: 26.9124, lon: 75.7873 },
      { lat: 26.9855, lon: 75.8513 }
    );
    assert.ok(transitMin >= 15, 'Transit time should be at least 15 minutes for 10km');
    assert.ok(transitMin <= 90, 'Transit time should not exceed 90 minutes for 10km intra-city');
  });

  it('Byte-identical determinism: same input produces identical temporal outputs', () => {
    const input = {
      destination: mockDestination,
      startDate: '2026-10-15',
      days: 3,
      persona: 'Culture Seeker' as const,
      weatherForecast: clearForecast3Days,
      candidates: mockCandidates,
    };

    const run1 = generateItinerary(input);
    const run2 = generateItinerary(input);

    assert.equal(
      JSON.stringify(run1),
      JSON.stringify(run2),
      'Engine must produce byte-identical temporal outputs for identical inputs'
    );
    assert.equal(run1.version, 2, 'Output must declare version 2');
    assert.ok(run1.itineraryDays[0].timeline && run1.itineraryDays[0].timeline.length > 0);
  });

  it('Late arrival on Day 1 (20:00) blocks daytime sightseeing and defers primary anchor to Day 2', () => {
    const output = generateItinerary({
      destination: mockDestination,
      startDate: '2026-10-15',
      days: 3,
      persona: 'Culture Seeker',
      arrivalAt: '20:00',
      weatherForecast: clearForecast3Days,
      candidates: mockCandidates,
    });

    assert.equal(output.success, true);
    const day1 = output.itineraryDays[0];
    const day2 = output.itineraryDays[1];

    // Day 1: morning and afternoon must be arrival/transit logistics, NOT sightseeing
    assert.equal(day1.morning.length, 1);
    assert.equal(day1.morning[0].eventKind, 'arrival_checkin');
    assert.equal(day1.afternoon.length, 1);
    assert.equal(day1.afternoon[0].eventKind, 'arrival_checkin');

    // Day 1 evening should be meal/arrival rest, starting at or after 20:00
    assert.equal(day1.evening.length, 1);
    assert.equal(day1.evening[0].eventKind, 'meal');
    const eveningStart = timeStrToMinutes(day1.evening[0].startTime);
    assert.ok(eveningStart !== null && eveningStart >= 20 * 60, 'Day 1 evening starts after 20:00 arrival');

    // Primary daytime anchor (Hawa Mahal or Amber Fort) must NOT be placed on Day 1 night;
    // it must be scheduled as anchor on Day 2
    const day1CandidateIds = day1.timeline?.map((t) => t.candidateId);
    assert.ok(!day1CandidateIds?.includes('pack:jaipur-hawa-mahal'));
    assert.ok(!day1CandidateIds?.includes('pack:jaipur-amber-fort'));

    const day2CandidateIds = day2.timeline?.map((t) => t.candidateId);
    assert.ok(
      day2CandidateIds?.includes('pack:jaipur-hawa-mahal') ||
      day2CandidateIds?.includes('pack:jaipur-amber-fort'),
      'Primary anchor must be scheduled on Day 2 after late arrival deferral'
    );
  });

  it('Continuous 4+ hour excursions consume morning and link an afternoon relaxation buffer', () => {
    const trekCandidate: CandidateActivity = {
      id: 'pack:jaipur-nahargarh-long-trek',
      title: 'Nahargarh Ridge Eco-Trek & Fort Excursion',
      category: 'NATURE',
      indoor: false,
      intensity: 'HIGH',
      typicalDurationMin: 270, // 4.5 hours
      slotAffinity: ['MORNING', 'AFTERNOON'],
      prominence: 0.99, // Highest prominence to guarantee selection as Day 1 anchor
      coords: { lat: 26.9388, lon: 75.8155 },
      tags: ['trek', 'nature', 'scenic', 'heritage'],
    };

    const candidates = [trekCandidate, ...mockCandidates];

    const output = generateItinerary({
      destination: mockDestination,
      startDate: '2026-10-15',
      days: 2,
      persona: 'Backpacker',
      weatherForecast: clearForecast3Days.slice(0, 2),
      candidates,
    });

    assert.equal(output.success, true);
    const day1 = output.itineraryDays[0];

    const morningAnchor = day1.morning[0];
    assert.equal(morningAnchor.candidateId, trekCandidate.id);
    assert.equal(morningAnchor.durationMin, 270);
    assert.equal(morningAnchor.eventKind, 'expedition_phase');

    const afternoonBuffer = day1.afternoon[0];
    assert.ok(afternoonBuffer, 'Afternoon buffer must exist');
    assert.equal(afternoonBuffer.continuationOfId, morningAnchor.id);
    assert.equal(afternoonBuffer.eventKind, 'expedition_phase');

    // Audit trail should record MULTI_SLOT_SPAN_BUFFER
    const multiSlotAudit = output.auditLog.find((a) => a.ruleId === 'MULTI_SLOT_SPAN_BUFFER');
    assert.ok(multiSlotAudit, 'Audit log must record MULTI_SLOT_SPAN_BUFFER rule execution');
  });

  it('Multi-day expedition links ascent and descent across consecutive days with shared linkedExpeditionId', () => {
    const expeditionCandidate: CandidateActivity = {
      id: 'pack:aravali-multi-day-traverse',
      title: 'Aravali Wilderness Highland Traverse',
      category: 'NATURE',
      indoor: false,
      intensity: 'HIGH',
      typicalDurationMin: 400, // Long trek
      slotAffinity: ['MORNING', 'AFTERNOON'],
      prominence: 0.98,
      coords: { lat: 26.95, lon: 75.83 },
      tags: ['trek', 'expedition', 'mountain', 'hiking'],
    };

    const candidates = [expeditionCandidate, ...mockCandidates];

    const output = generateItinerary({
      destination: mockDestination,
      startDate: '2026-10-15',
      days: 3,
      persona: 'Backpacker',
      weatherForecast: clearForecast3Days,
      candidates,
    });

    assert.equal(output.success, true);
    const day1 = output.itineraryDays[0];
    const day2 = output.itineraryDays[1];

    const day1Ascent = day1.timeline?.find((item) => item.expeditionPhase === 'ascent');
    const day2Descent = day2.timeline?.find((item) => item.expeditionPhase === 'descent');

    assert.ok(day1Ascent, 'Day 1 must feature expedition ascent');
    assert.ok(day2Descent, 'Day 2 must feature expedition descent');
    assert.ok(day1Ascent?.linkedExpeditionId, 'Day 1 ascent must have a linkedExpeditionId');
    assert.equal(
      day1Ascent?.linkedExpeditionId,
      day2Descent?.linkedExpeditionId,
      'Both days must share the exact same linkedExpeditionId'
    );

    // Audit trail must record MULTI_DAY_EXPEDITION_LINKING
    const expeditionAudit = output.auditLog.find((a) => a.ruleId === 'MULTI_DAY_EXPEDITION_LINKING');
    assert.ok(expeditionAudit, 'Audit log must record MULTI_DAY_EXPEDITION_LINKING');
  });

  it('Evaluates venue opening hours interval compliance', () => {
    const candidateWithHours: CandidateActivity = {
      id: 'pack:jaipur-timed-museum',
      title: 'Jaipur Horology Museum',
      category: 'CULTURE',
      indoor: true,
      intensity: 'LOW',
      typicalDurationMin: 90,
      slotAffinity: ['MORNING', 'AFTERNOON'],
      prominence: 0.85,
      coords: { lat: 26.91, lon: 75.8 },
      openingHours: {
        monday: [{ open: '09:00', close: '17:00' }],
        tuesday: [{ open: '09:00', close: '17:00' }],
        wednesday: [{ open: '09:00', close: '17:00' }],
        thursday: [{ open: '09:00', close: '17:00' }],
        friday: [{ open: '09:00', close: '17:00' }],
        saturday: [{ open: '10:00', close: '14:00' }],
        sunday: [{ open: '10:00', close: '14:00' }],
      },
      tags: ['museum', 'timed'],
    };

    // Thursday (weekday) inside hours (10:00 - 12:00)
    const weekdayOpen = isVenueOpenDuringInterval(candidateWithHours, 'thursday', 10 * 60, 12 * 60);
    assert.equal(weekdayOpen.isOpen, true);
    assert.equal(weekdayOpen.isHoursKnown, true);

    // Thursday outside hours (18:00 - 20:00)
    const weekdayEvening = isVenueOpenDuringInterval(candidateWithHours, 'thursday', 18 * 60, 20 * 60);
    assert.equal(weekdayEvening.isOpen, false);

    // Sunday outside hours (15:00 - 17:00)
    const sundayAfternoon = isVenueOpenDuringInterval(candidateWithHours, 'sunday', 15 * 60, 17 * 60);
    assert.equal(sundayAfternoon.isOpen, false);
  });

  it('Cumulative fatigue load triggers morning recovery buffer after successive high-intensity days', () => {
    const highIntensityCandidates: CandidateActivity[] = [
      {
        id: 'pack:intense-1',
        title: 'Intense Mountain Ascent Day 1',
        category: 'NATURE',
        indoor: false,
        intensity: 'HIGH',
        typicalDurationMin: 180,
        slotAffinity: ['MORNING'],
        prominence: 0.99,
        coords: { lat: 26.91, lon: 75.81 },
        tags: ['hiking'],
      },
      {
        id: 'pack:intense-2',
        title: 'Intense Scramble Afternoon Day 1',
        category: 'NATURE',
        indoor: false,
        intensity: 'HIGH',
        typicalDurationMin: 150,
        slotAffinity: ['AFTERNOON'],
        prominence: 0.95,
        coords: { lat: 26.92, lon: 75.82 },
        tags: ['hiking'],
      },
      {
        id: 'pack:intense-3',
        title: 'Intense Boulder Climb Day 2',
        category: 'NATURE',
        indoor: false,
        intensity: 'HIGH',
        typicalDurationMin: 180,
        slotAffinity: ['MORNING'],
        prominence: 0.94,
        coords: { lat: 26.93, lon: 75.83 },
        tags: ['climbing'],
      },
      {
        id: 'pack:intense-4',
        title: 'Intense Ridge Traverse Afternoon Day 2',
        category: 'NATURE',
        indoor: false,
        intensity: 'HIGH',
        typicalDurationMin: 150,
        slotAffinity: ['AFTERNOON'],
        prominence: 0.93,
        coords: { lat: 26.94, lon: 75.84 },
        tags: ['hiking'],
      },
      ...mockCandidates,
    ];

    const output = generateItinerary({
      destination: mockDestination,
      startDate: '2026-10-15',
      days: 3,
      persona: 'Backpacker',
      weatherForecast: clearForecast3Days,
      candidates: highIntensityCandidates,
    });

    assert.equal(output.success, true);
    // Audit entries should show fatigue recovery rule on Day 3
    const recoveryAudit = output.auditLog.find((a) => a.ruleId === 'CUMULATIVE_FATIGUE_RECOVERY');
    assert.ok(recoveryAudit, 'Recovery buffer rule must be logged in audit trail');
    assert.equal(recoveryAudit.verdict, 'SELECTED');
  });

  it('upgradeLegacyTrip transforms version 1 slot-only trips into temporal timeline model without losing data', () => {
    const legacyTrip = {
      id: 'trip-legacy-123',
      destination: 'Jaipur',
      destinationCountry: 'India',
      destinationCountryCode: 'IN',
      startDate: '2026-10-15',
      days: 1,
      persona: 'Culture Seeker' as const,
      originCity: 'New Delhi',
      arrivalMode: 'train' as const,
      arrivalAt: '10:00',
      arrivalTime: '10:00',
      bannerUrl: '/illustrations/jaipur.svg',
      itineraryDays: [
        {
          id: 'day-1',
          dayNumber: 1,
          date: '2026-10-15',
          weatherState: 'CLEAR' as const,
          weatherSummary: 'Sunny and warm',
          morning: [
            {
              id: 'item-1-hawa-mahal',
              candidateId: 'pack:jaipur-hawa-mahal',
              title: 'Hawa Mahal',
              category: 'LANDMARK' as const,
              indoor: false,
              slot: 'MORNING' as const,
              reason: 'Curated anchor landmark.',
              intensity: 'LOW' as const,
              typicalDurationMin: 60,
              coords: { lat: 26.9239, lon: 75.8267 },
            },
          ],
          afternoon: [
            {
              id: 'item-1-city-palace',
              candidateId: 'pack:jaipur-city-palace',
              title: 'City Palace',
              category: 'CULTURE' as const,
              indoor: true,
              slot: 'AFTERNOON' as const,
              reason: 'Indoor culture anchor.',
              intensity: 'MEDIUM' as const,
              typicalDurationMin: 120,
              coords: { lat: 26.9258, lon: 75.8236 },
            },
          ],
          evening: [
            {
              id: 'item-1-chokhi-dhani',
              candidateId: 'pack:jaipur-chokhi-dhani',
              title: 'Chokhi Dhani Ethnic Resort & Dining',
              category: 'FOOD' as const,
              indoor: false,
              slot: 'EVENING' as const,
              reason: 'Dinner atmosphere.',
              intensity: 'LOW' as const,
              typicalDurationMin: 180,
              coords: { lat: 26.766, lon: 75.836 },
            },
          ],
        },
      ],
    } as unknown as Trip;

    const upgraded = upgradeLegacyTrip(legacyTrip);

    assert.equal(upgraded.version, 2, 'Upgraded trip must be version 2');
    assert.equal(upgraded.bannerUrl, '/illustrations/jaipur.svg', 'Illustration preserved');

    const day1 = upgraded.itineraryDays[0];
    assert.ok(Array.isArray(day1.timeline), 'Timeline array must be present');
    assert.equal(day1.timeline.length, 3, 'Timeline must contain all 3 slot items');

    const morningItem = day1.timeline[0];
    assert.equal(morningItem.startTime, '09:00');
    assert.equal(morningItem.endTime, '10:00');
    assert.equal(morningItem.durationMin, 60);
    assert.equal(morningItem.eventKind, 'activity');

    const afternoonItem = day1.timeline[1];
    assert.equal(afternoonItem.startTime, '13:30');
    assert.equal(afternoonItem.endTime, '15:30');
    assert.equal(afternoonItem.durationMin, 120);

    const eveningItem = day1.timeline[2];
    assert.equal(eveningItem.eventKind, 'meal');
    assert.equal(eveningItem.startTime, '18:30');
  });
});
