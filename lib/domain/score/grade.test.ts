import { scoreBand, scoreGrade } from './grade';

describe('scoreGrade', () => {
  it.each([
    [100, 'excellent'],
    [80, 'excellent'],
    [79, 'good'],
    [65, 'good'],
    [64, 'fair'],
    [50, 'fair'],
    [49, 'low'],
    [0, 'low'],
  ])('grades %i as %s', (total, grade) => {
    expect(scoreGrade(total)).toBe(grade);
  });
});

describe('scoreBand', () => {
  it('splits scores into three color bands', () => {
    expect(scoreBand(90)).toBe('high');
    expect(scoreBand(65)).toBe('high');
    expect(scoreBand(64)).toBe('mid');
    expect(scoreBand(50)).toBe('mid');
    expect(scoreBand(49)).toBe('low');
  });
});
