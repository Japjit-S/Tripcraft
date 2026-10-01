import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generateItinerary } from '../../src/lib/engine/index';
import { scoreCandidate } from '../../src/lib/engine/scoring';
import { CandidateActivity } from '../../src/lib/types/engine';
import {
  blockFeasibilityRule,
  cautionFeasibilityRule,
  clearForecast3Days,
  extremeHeatForecast3Days,
  mockCandidates,
  mockDestination,
  rainyForecast3Days,
} from './fixtures';

describe('Deterministic Itinerary Engine', () => {
  it('Rainy + Backpacker selects indoor options and eliminates outdoor walking tour', () => {
    const output = generateItinerary({
      destination: mockDestination,
      startDate: '2026-10-15',
      days: 3,
      persona: 'Backpacker',
      weatherForecast: rainyForecast3Days,
      candidates: mockCandidates,
    });

    assert.equal(output.success, true);
    assert.equal(output.itineraryDays.length, 3);

    // Verify outdoor walking tour is NOT in any day's slots
    for (const day of output.itineraryDays) {
      const allItems = [...day.morning, ...day.afternoon, ...day.evening];
      const hasWalkingTour = allItems.some(
        (item) => item.candidateId === 'pack:jaipur-walking-tour'
      );
      assert.equal(hasWalkingTour, false, 'Walking tour should be removed by rain filter');
    }

    // Verify audit log has the explicit removal entry
    const rainRemoval = output.auditLog.find(
      (entry) =>
        entry.candidateId === 'pack:jaipur-walking-tour' &&
        entry.stage === 'WEATHER_FILTER' &&
        entry.verdict === 'REMOVED' &&
        entry.ruleId === 'WX_RAIN_OUTDOOR'
    );
    assert.ok(rainRemoval, 'Audit log must record WX_RAIN_OUTDOOR removal');

    // Verify indoor cultural options (City Palace, Albert Hall, Anokhi) are scheduled
    const allAssignedIds = output.itineraryDays.flatMap((d) =>
      [...d.morning, ...d.afternoon, ...d.evening].map((i) => i.candidateId)
    );
    assert.ok(
      allAssignedIds.includes('pack:jaipur-city-palace') ||
        allAssignedIds.includes('pack:jaipur-albert-hall'),
      'Indoor options should be selected on rainy days'
    );
  });

  it('Clear + Culture Seeker includes outdoor history-focused landmarks', () => {
    const output = generateItinerary({
      destination: mockDestination,
      startDate: '2026-10-15',
      days: 3,
      persona: 'Culture Seeker',
      weatherForecast: clearForecast3Days,
      candidates: mockCandidates,
    });

    assert.equal(output.success, true);
    assert.equal(output.itineraryDays.length, 3);

    const allAssigned = output.itineraryDays.flatMap((d) => [
      ...d.morning,
      ...d.afternoon,
      ...d.evening,
    ]);

    // High prominence landmarks must be present as day anchors
    const hawaMahal = allAssigned.find(
      (item) => item.candidateId === 'pack:jaipur-hawa-mahal'
    );
    const amberFort = allAssigned.find(
      (item) => item.candidateId === 'pack:jaipur-amber-fort'
    );

    assert.ok(hawaMahal, 'Hawa Mahal must be present in clear Culture Seeker itinerary');
    assert.ok(amberFort, 'Amber Fort must be present in clear Culture Seeker itinerary');

    // Verify anchors are distributed across different days (Pass A)
    const day1Items = [
      ...output.itineraryDays[0].morning,
      ...output.itineraryDays[0].afternoon,
      ...output.itineraryDays[0].evening,
    ];
    const day2Items = [
      ...output.itineraryDays[1].morning,
      ...output.itineraryDays[1].afternoon,
      ...output.itineraryDays[1].evening,
    ];

    const d1Anchor = day1Items.find((i) => i.reason.includes('Day anchor'));
    const d2Anchor = day2Items.find((i) => i.reason.includes('Day anchor'));

    assert.ok(d1Anchor, 'Day 1 must have an anchor');
    assert.ok(d2Anchor, 'Day 2 must have an anchor');
    assert.notEqual(d1Anchor.candidateId, d2Anchor.candidateId, 'Anchors must be on distinct days');
  });

  it('Family persona prioritizes kid-friendly and weather-safe choices', () => {
    const output = generateItinerary({
      destination: mockDestination,
      startDate: '2026-10-15',
      days: 3,
      persona: 'Family',
      weatherForecast: clearForecast3Days,
      candidates: mockCandidates,
    });

    assert.equal(output.success, true);
    const allAssigned = output.itineraryDays.flatMap((d) => [
      ...d.morning,
      ...d.afternoon,
      ...d.evening,
    ]);

    // Kid-friendly science park or low-intensity options should be picked
    const sciencePark = allAssigned.find(
      (item) => item.candidateId === 'pack:jaipur-science-park'
    );
    assert.ok(sciencePark, 'Family itinerary should include kid-friendly activities');
  });

  it('Input validation produces useful typed errors rather than crashes', () => {
    // 1. Invalid city
    const res1 = generateItinerary({
      destination: { ...mockDestination, city: '' },
      startDate: '2026-10-15',
      days: 3,
      persona: 'Culture Seeker',
      weatherForecast: clearForecast3Days,
      candidates: mockCandidates,
    });
    assert.equal(res1.success, false);
    assert.match(res1.blockReason ?? '', /city is required/i);

    // 2. Zero-length duration
    const res2 = generateItinerary({
      destination: mockDestination,
      startDate: '2026-10-15',
      days: 0,
      persona: 'Culture Seeker',
      weatherForecast: clearForecast3Days,
      candidates: mockCandidates,
    });
    assert.equal(res2.success, false);
    assert.match(res2.blockReason ?? '', /must be between 1 and 7/i);

    // 3. 8+ day duration
    const res3 = generateItinerary({
      destination: mockDestination,
      startDate: '2026-10-15',
      days: 8,
      persona: 'Culture Seeker',
      weatherForecast: clearForecast3Days,
      candidates: mockCandidates,
    });
    assert.equal(res3.success, false);
    assert.match(res3.blockReason ?? '', /must be between 1 and 7/i);

    // 4. Malformed date
    const res4 = generateItinerary({
      destination: mockDestination,
      startDate: 'not-a-date',
      days: 3,
      persona: 'Culture Seeker',
      weatherForecast: clearForecast3Days,
      candidates: mockCandidates,
    });
    assert.equal(res4.success, false);
    assert.match(res4.blockReason ?? '', /YYYY-MM-DD/i);

    // 5. Malformed weather payload
    const res5 = generateItinerary({
      destination: mockDestination,
      startDate: '2026-10-15',
      days: 3,
      persona: 'Culture Seeker',
      weatherForecast: [],
      candidates: mockCandidates,
    });
    assert.equal(res5.success, false);
    assert.match(res5.blockReason ?? '', /weather/i);
  });

  it('Byte-identical determinism: same input produces identical output', () => {
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
      'Engine must be 100% deterministic'
    );
  });

  it('Thin pool emits explicit FLEX block and logs DEGRADATION entry', () => {
    // Thin pool with only 1 indoor item during rain
    const thinCandidates = mockCandidates.filter(
      (c) => c.id === 'pack:jaipur-city-palace' || c.id === 'pack:jaipur-hawa-mahal'
    );

    const output = generateItinerary({
      destination: mockDestination,
      startDate: '2026-10-15',
      days: 1,
      persona: 'Culture Seeker',
      weatherForecast: [rainyForecast3Days[0]],
      candidates: thinCandidates,
    });

    assert.equal(output.success, true);
    const day1 = output.itineraryDays[0];
    const allItems = [...day1.morning, ...day1.afternoon, ...day1.evening];

    // Check that at least one slot has an explicit flex item
    const flexItem = allItems.find((i) => i.isFlex === true);
    assert.ok(flexItem, 'Should emit an explicit FLEX block when pool is thin');
    assert.ok(flexItem.flexReason, 'FLEX block must include an explicit reason');

    // Check DEGRADATION audit entry
    const degradationLog = output.auditLog.find(
      (e) => e.stage === 'DEGRADATION' && e.ruleId === 'DEGRADATION_THIN_POOL'
    );
    assert.ok(degradationLog, 'Audit log must record DEGRADATION stage for thin pool');
  });

  it('Feasibility rules: block refuses generation, caution proceeds with warning', () => {
    // 1. Block rule
    const blockOutput = generateItinerary({
      destination: mockDestination,
      startDate: '2026-10-15',
      days: 3,
      persona: 'Culture Seeker',
      weatherForecast: clearForecast3Days,
      candidates: mockCandidates,
      feasibilityRules: [blockFeasibilityRule],
    });
    assert.equal(blockOutput.success, false);
    assert.equal(blockOutput.feasibilityStatus, 'BLOCKED');
    assert.equal(blockOutput.blockReason, blockFeasibilityRule.message);

    // 2. Caution rule
    const cautionOutput = generateItinerary({
      destination: mockDestination,
      startDate: '2026-10-15',
      days: 3,
      persona: 'Culture Seeker',
      weatherForecast: clearForecast3Days,
      candidates: mockCandidates,
      feasibilityRules: [cautionFeasibilityRule],
    });
    assert.equal(cautionOutput.success, true);
    assert.equal(cautionOutput.feasibilityStatus, 'CAUTION');
    assert.ok(cautionOutput.warnings.some((w) => w.includes('advisory')));
  });

  it('Extreme heat removes high-intensity outdoor activities in the afternoon', () => {
    const output = generateItinerary({
      destination: mockDestination,
      startDate: '2026-05-15',
      days: 3,
      persona: 'Backpacker',
      weatherForecast: extremeHeatForecast3Days,
      candidates: mockCandidates,
    });

    assert.equal(output.success, true);
    for (const day of output.itineraryDays) {
      assert.equal(day.weatherState, 'EXTREME_HEAT');
      // Verify no high-intensity outdoor activities were placed in afternoon
      for (const item of day.afternoon) {
        if (!item.indoor) {
          assert.notEqual(
            item.intensity,
            'HIGH',
            'No high-intensity outdoor activities allowed in afternoon heat'
          );
        }
      }
    }
  });

  it('Multi-slot activity spans: anchor with typicalDurationMin >= 240 marks afternoon as relaxed buffer', () => {
    const expeditionCandidate: CandidateActivity = {
      id: 'pack:himalayan-peak-trek',
      title: 'Himalayan Ridge Summit Trek',
      category: 'NATURE',
      indoor: false,
      intensity: 'HIGH',
      typicalDurationMin: 300,
      slotAffinity: ['MORNING'],
      prominence: 0.99,
      coords: { lat: 26.9124, lon: 75.7873 },
      tags: ['trek', 'summit', 'nature', 'mountain'],
    };

    const output = generateItinerary({
      destination: mockDestination,
      startDate: '2026-10-15',
      days: 1,
      persona: 'Backpacker',
      weatherForecast: clearForecast3Days.slice(0, 1),
      candidates: [expeditionCandidate, ...mockCandidates],
    });

    assert.equal(output.success, true);
    const day1 = output.itineraryDays[0];
    assert.equal(day1.morning[0].candidateId, 'pack:himalayan-peak-trek');
    assert.equal(day1.afternoon[0].candidateId, 'buffer-afternoon');
    assert.equal(day1.afternoon[0].category, 'RELAXATION');
    assert.ok(
      output.auditLog.some((e) => e.ruleId === 'MULTI_SLOT_SPAN_BUFFER'),
      'Audit log must record MULTI_SLOT_SPAN_BUFFER rule'
    );
  });

  it('Continuous proximity decay: candidate 25km from anchor receives non-zero proximity score', () => {
    const scoreClose = scoreCandidate({
      candidate: mockCandidates[0],
      persona: 'Culture Seeker',
      weatherState: 'CLEAR',
      slot: 'MORNING',
      anchorCoords: { lat: 26.9239, lon: 75.8267 },
    });
    const scoreFar = scoreCandidate({
      candidate: {
        ...mockCandidates[0],
        coords: { lat: 27.15, lon: 75.8267 }, // ~25 km away
      },
      persona: 'Culture Seeker',
      weatherState: 'CLEAR',
      slot: 'MORNING',
      anchorCoords: { lat: 26.9239, lon: 75.8267 },
    });
    assert.ok(scoreFar.breakdown.proximityToDayAnchor > 0.1, 'Outlying candidate retains smooth non-zero proximity');
    assert.ok(scoreClose.breakdown.proximityToDayAnchor > scoreFar.breakdown.proximityToDayAnchor);
  });
});

