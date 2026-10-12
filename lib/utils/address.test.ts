import { formatArea, formatStreet } from './address';

const address = {
  city: { he: 'תל אביב-יפו', en: 'Tel Aviv-Yafo' },
  neighborhood: { he: 'הצפון הישן', en: 'Old North' },
  street: { he: 'דיזנגוף', en: 'Dizengoff' },
  number: '120',
};

describe('address formatting', () => {
  it('formats the street in each language', () => {
    expect(formatStreet(address, 'en')).toBe('Dizengoff 120');
    expect(formatStreet(address, 'he')).toBe('דיזנגוף 120');
  });

  it('omits a missing house number', () => {
    expect(formatStreet({ ...address, number: undefined }, 'en')).toBe('Dizengoff');
  });

  it('formats neighborhood and city', () => {
    expect(formatArea(address, 'en')).toBe('Old North, Tel Aviv-Yafo');
    expect(formatArea({ ...address, neighborhood: undefined }, 'he')).toBe('תל אביב-יפו');
  });
});
