'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProofProgress } from './proof-progress';
import { ProofStepLayout } from './proof-step-layout';
import { ProductSelector } from './product-selector';
import { TeamInfoForm } from './team-info-form';
import { DesignPreferencesForm } from './design-preferences-form';
import { ReviewSummary } from './review-summary';
import { PROOF_PRODUCTS } from '@/lib/proof/options';
import { validateStep } from '@/lib/proof/validation';
import { writeProofHandoff } from '@/lib/proof/handoff';
import { EMPTY_PROOF } from '@/lib/proof/types';
import type {
  DesignPreferences,
  ProductOption,
  ProofErrors,
  ProofFormData,
  ProofSubmission,
  TeamInfo,
} from '@/lib/proof/types';

const STEPS = ['Product', 'Team info', 'Preferences', 'Review'] as const;

const STEP_META: { title: string; description: string; nextLabel: string }[] = [
  { title: 'Choose your product', description: 'Pick the design you want a free proof of. You can change this later.', nextLabel: 'Continue' },
  { title: 'Team & contact details', description: 'Tell us who this is for and where to send your proof.', nextLabel: 'Continue' },
  { title: 'Design preferences', description: 'Optional — share colors, size, and any details to guide your proof.', nextLabel: 'Review request' },
  { title: 'Review your request', description: 'Check everything below, then continue into the design studio to add photos and preview your proof.', nextLabel: 'Continue to design studio →' },
];

export interface ProofWizardProps {
  /** Products offered by the selector. Defaults to the shared launch list. */
  products?: ProductOption[];
  /** Preselected product id (e.g. from /proof?product=<slug>). Already validated. */
  initialProductId?: string | null;
}

/**
 * Free Design Proof Wizard. All state is local to this component (no store, no network) —
 * the four steps read and write one ProofFormData object, so moving backward and forward
 * never loses input. Submit is a placeholder: it logs the payload and shows a confirmation.
 */
export function ProofWizard({ products = PROOF_PRODUCTS, initialProductId = null }: ProofWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ProofFormData>(() =>
    initialProductId ? { ...EMPTY_PROOF, productId: initialProductId } : EMPTY_PROOF,
  );
  const [errors, setErrors] = useState<ProofErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingId = 'proof-step-heading';

  // Move focus to the step heading whenever the step changes — keeps keyboard and
  // screen-reader users oriented. Skipped on the very first render.
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) headingRef.current?.focus();
    else mounted.current = true;
  }, [step]);

  const setProduct = useCallback((productId: string) => {
    setData((d) => ({ ...d, productId }));
    setErrors((e) => ({ ...e, productId: undefined }));
  }, []);

  const patchTeam = useCallback((patch: Partial<TeamInfo>) => {
    setData((d) => ({ ...d, team: { ...d.team, ...patch } }));
    // Clear errors for fields being edited so messages don't linger while typing.
    setErrors((e) => {
      const next = { ...e };
      if ('teamName' in patch) next.teamName = undefined;
      if ('contactName' in patch) next.contactName = undefined;
      if ('email' in patch) next.email = undefined;
      return next;
    });
  }, []);

  const patchPreferences = useCallback((patch: Partial<DesignPreferences>) => {
    setData((d) => ({ ...d, preferences: { ...d.preferences, ...patch } }));
  }, []);

  const goBack = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  const goTo = useCallback(
    (target: number) => {
      // Validate every step up to the target so users can't skip required fields by editing.
      for (let s = 0; s < target; s++) {
        const stepErrors = validateStep(s, data);
        if (Object.keys(stepErrors).length > 0) {
          setErrors(stepErrors);
          setStep(s);
          return;
        }
      }
      setErrors({});
      setStep(target);
    },
    [data],
  );

  const handleNext = useCallback(() => {
    const stepErrors = validateStep(step, data);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
    // handleSubmit is stable within this render; intentionally omitted from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, data]);

  function handleSubmit() {
    setSubmitting(true);
    const submission: ProofSubmission = { ...data, submittedAtLabel: 'demo submission' };

    // PLACEHOLDER: no storage, uploads, email, or payment yet.
    // eslint-disable-next-line no-console
    console.log('[proof] submission payload', submission);

    // Hand the compatible answers to the builder, then continue directly into it.
    // The builder consumes this once on mount (see useProofHandoff) — no duplicate entry.
    writeProofHandoff(data);
    router.push('/create');
  }

  const meta = STEP_META[step];

  return (
    <div className="space-y-6">
      <ProofProgress steps={STEPS as unknown as string[]} current={step} />

      <ProofStepLayout
        ref={headingRef}
        headingId={headingId}
        title={meta.title}
        description={meta.description}
        onBack={step > 0 ? goBack : undefined}
        onNext={handleNext}
        nextLabel={meta.nextLabel}
        isSubmitting={submitting}
      >
        {step === 0 && (
          <ProductSelector products={products} value={data.productId} onChange={setProduct} error={errors.productId} />
        )}
        {step === 1 && <TeamInfoForm value={data.team} onChange={patchTeam} errors={errors} />}
        {step === 2 && <DesignPreferencesForm value={data.preferences} onChange={patchPreferences} />}
        {step === 3 && <ReviewSummary data={data} onEdit={goTo} />}
      </ProofStepLayout>
    </div>
  );
}
