import { describe, expect, it } from 'vitest';
import { mapProofToBuilder, PROOF_PRODUCT_MAP } from './mapping';
import { EMPTY_PROOF, type ProofFormData } from './types';

/** Build a ProofFormData with a chosen product + team name (other fields irrelevant here). */
function proof(productId: string | null, teamName = 'Riverside Eagles'): ProofFormData {
  return {
    ...EMPTY_PROOF,
    productId,
    team: { ...EMPTY_PROOF.team, teamName, contactName: 'Coach Kim', email: 'coach@example.com' },
  };
}

describe('mapProofToBuilder — happy paths', () => {
  it('maps a champion-family product to the champion theme + teamName text', () => {
    const out = mapProofToBuilder(proof('team-roster-banner'));
    expect(out.themeId).toBe('champion');
    expect(out.text).toEqual({ teamName: 'Riverside Eagles' });
  });

  it('maps graduation-banner to the graduation theme + school text', () => {
    const out = mapProofToBuilder(proof('graduation-banner', 'Lincoln High'));
    expect(out.themeId).toBe('graduation');
    expect(out.text).toEqual({ school: 'Lincoln High' });
  });

  it('covers every non-null product in the map without throwing', () => {
    for (const [slug, entry] of Object.entries(PROOF_PRODUCT_MAP)) {
      const out = mapProofToBuilder(proof(slug));
      if (entry) {
        expect(out.themeId).toBe(entry.themeId);
        expect(out.text).toEqual({ [entry.nameField]: 'Riverside Eagles' });
      } else {
        expect(out).toEqual({});
      }
    }
  });
});

describe('mapProofToBuilder — unmapped / invalid products', () => {
  it('returns {} for the "not sure" product (intentionally unmapped)', () => {
    expect(mapProofToBuilder(proof('not-sure'))).toEqual({});
  });

  it('returns {} for an unknown/stale product slug', () => {
    expect(mapProofToBuilder(proof('totally-made-up-slug'))).toEqual({});
  });

  it('returns {} for a hostile-looking slug', () => {
    expect(mapProofToBuilder(proof('../../etc/passwd'))).toEqual({});
  });
});

describe('mapProofToBuilder — empty payloads', () => {
  it('returns {} for a pristine EMPTY_PROOF (no product)', () => {
    expect(mapProofToBuilder(EMPTY_PROOF)).toEqual({});
  });

  it('returns {} when productId is null', () => {
    expect(mapProofToBuilder(proof(null))).toEqual({});
  });
});

describe('mapProofToBuilder — invalid theme guard', () => {
  it('returns {} when the product maps to a theme absent from the catalog', () => {
    const out = mapProofToBuilder(proof('team-roster-banner'), {
      productMap: { 'team-roster-banner': { themeId: 'nonexistent-theme', nameField: 'teamName' } },
    });
    expect(out).toEqual({});
  });

  it('returns {} when the catalog is empty', () => {
    const out = mapProofToBuilder(proof('team-roster-banner'), { catalog: {} });
    expect(out).toEqual({});
  });
});

describe('mapProofToBuilder — missing builder field guard', () => {
  it('applies the theme but omits text when the target field is not in the theme', () => {
    const out = mapProofToBuilder(proof('team-roster-banner'), {
      productMap: { 'team-roster-banner': { themeId: 'champion', nameField: 'fieldThatDoesNotExist' } },
    });
    expect(out.themeId).toBe('champion');
    expect(out.text).toBeUndefined();
  });
});

describe('mapProofToBuilder — team name handling', () => {
  it('applies the theme but omits text when team name is empty', () => {
    const out = mapProofToBuilder(proof('team-roster-banner', ''));
    expect(out.themeId).toBe('champion');
    expect(out.text).toBeUndefined();
  });

  it('trims whitespace and omits text when only whitespace is provided', () => {
    const out = mapProofToBuilder(proof('team-roster-banner', '   '));
    expect(out.themeId).toBe('champion');
    expect(out.text).toBeUndefined();
  });

  it('trims surrounding whitespace from a real name', () => {
    const out = mapProofToBuilder(proof('team-roster-banner', '  Eagles  '));
    expect(out.text).toEqual({ teamName: 'Eagles' });
  });
});
