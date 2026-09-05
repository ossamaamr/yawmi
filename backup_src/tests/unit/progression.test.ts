import { canAdvanceProgression, getNextCursor, isProgressionComplete } from '../../src/features/progression/domain/progression.entity';

describe('Progression Entity', () => {
  test('canAdvanceProgression - in_progress with room', () => {
    expect(canAdvanceProgression({
      id: '1', taskId: 't1', currentCursor: 'lesson_1', totalSteps: 10,
      completedSteps: 2, status: 'in_progress', startedAt: 0,
      completedAt: null, createdAt: 0, updatedAt: 0,
    })).toBe(true);
  });

  test('canAdvanceProgression - completed', () => {
    expect(canAdvanceProgression({
      id: '1', taskId: 't1', currentCursor: 'lesson_10', totalSteps: 10,
      completedSteps: 10, status: 'completed', startedAt: 0,
      completedAt: 1, createdAt: 0, updatedAt: 0,
    })).toBe(false);
  });

  test('canAdvanceProgression - at target', () => {
    expect(canAdvanceProgression({
      id: '1', taskId: 't1', currentCursor: 'lesson_10', totalSteps: 10,
      completedSteps: 10, status: 'in_progress', startedAt: 0,
      completedAt: null, createdAt: 0, updatedAt: 0,
    })).toBe(false);
  });

  test('getNextCursor - numbered', () => {
    expect(getNextCursor('lesson_1')).toBe('lesson_2');
    expect(getNextCursor('lesson_9')).toBe('lesson_10');
    expect(getNextCursor('chapter_3')).toBe('chapter_4');
  });

  test('getNextCursor - no number', () => {
    expect(getNextCursor('lesson')).toBe('lesson_1');
  });

  test('isProgressionComplete', () => {
    expect(isProgressionComplete({
      id: '1', taskId: 't1', currentCursor: 'lesson_10', totalSteps: 10,
      completedSteps: 10, status: 'completed', startedAt: 0,
      completedAt: 1, createdAt: 0, updatedAt: 0,
    })).toBe(true);

    expect(isProgressionComplete({
      id: '1', taskId: 't1', currentCursor: 'lesson_5', totalSteps: 10,
      completedSteps: 5, status: 'in_progress', startedAt: 0,
      completedAt: null, createdAt: 0, updatedAt: 0,
    })).toBe(false);
  });
});
