export type TaxBracket = { upTo: number; rate: number };
export type TaxConfig = {
  year: number;
  version: string;
  source: string;
  validFrom: string;
  validTo: string;
  single: readonly TaxBracket[];
  additional: readonly TaxBracket[];
};

/** ITA instruction 1/2026. The additional-home temporary rule expires 2026-12-31. */
export const TAX_2026: TaxConfig = {
  year: 2026,
  version: 'ita-1-2026',
  source: 'https://www.gov.il/BlobFolder/policy/inst-01-2026/he/realestate_inst-01-2026.pdf',
  validFrom: '2026-01-01',
  validTo: '2026-12-31',
  single: [
    { upTo: 1_978_745, rate: 0 },
    { upTo: 2_347_040, rate: 0.035 },
    { upTo: 6_055_070, rate: 0.05 },
    { upTo: 20_183_565, rate: 0.08 },
    { upTo: Infinity, rate: 0.1 },
  ],
  additional: [
    { upTo: 6_055_070, rate: 0.08 },
    { upTo: Infinity, rate: 0.1 },
  ],
};
