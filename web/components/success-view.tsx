'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import { ProcessingStatus } from './processing-status';
import { getStoredEmail } from '@/lib/utils';

export function SuccessView() {
  const search = useSearchParams();
  const sessionId = search.get('session_id') ?? '';
  const projectId = search.get('project_id') ?? '';
  const [readyUrl, setReadyUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    setEmail(getStoredEmail());
  }, []);

  if (!sessionId && !projectId) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-gold/30 bg-white p-10 text-center">
        <h1 className="text-3xl">No order to show.</h1>
        <p className="mt-2 text-obsidian/65">
          We couldn&apos;t find your session. If you just paid, please check your email for the receipt.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/create">Design another banner</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-sage/30 bg-white p-8 text-center shadow-lift">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage/15 text-2xl text-sage">
          ✓
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-sage">
          Payment received
        </p>
        <h1 className="mt-3 text-balance text-4xl sm:text-5xl">Thank you — you&apos;re all set.</h1>
        <p className="mt-3 text-pretty text-obsidian/70">
          {email
            ? <>A receipt is on its way to <strong>{email}</strong>. Your banner is rendering now and the download links will appear right here.</>
            : <>A receipt is on its way to the email you used at checkout. Your banner is rendering now and the download links will appear right here.</>}
        </p>
      </div>

      {projectId ? (
        <div className="mt-6">
          <ProcessingStatus
            projectId={projectId}
            onReady={(s) => {
              if (s.downloadUrl) setReadyUrl(s.downloadUrl);
              if (s.videoUrl) setVideoUrl(s.videoUrl);
            }}
          />
        </div>
      ) : (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-gold/20 bg-white p-5">
          <Spinner />
          <p className="text-sm text-obsidian/70">
            Confirming with our server… you&apos;ll get an email the moment your files are ready.
          </p>
        </div>
      )}

      {(readyUrl || videoUrl) && (
        <div className="mt-6 rounded-2xl border border-gold/30 bg-ivory p-6">
          <h2 className="text-xl">Your downloads</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {readyUrl && (
              <Button asChild variant="gold">
                <a href={readyUrl} download>
                  ⬇ Download banner
                </a>
              </Button>
            )}
            {videoUrl && (
              <Button asChild variant="primary">
                <a href={videoUrl} download>
                  ⬇ Download video slideshow
                </a>
              </Button>
            )}
          </div>
          <p className="mt-3 text-xs text-obsidian/55">
            Links are private and expire after 7 days — save the files to your device.
          </p>
        </div>
      )}

      <div className="mt-8 text-center">
        <Button asChild variant="ghost">
          <Link href="/create">Design another banner</Link>
        </Button>
      </div>
    </div>
  );
}
