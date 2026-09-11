import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'User Data Deletion Instructions // Dissafyt Platform',
  description: 'Instructions on how users can request the deletion of their personal data from the Dissafyt Platform in compliance with Meta Platform Policies and POPIA.',
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-300 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="border-b border-zinc-800 pb-8">
          <div className="flex items-center space-x-2 text-xs font-mono text-amber-500 uppercase tracking-widest mb-3">
            <span>META PLATFORM & POPIA COMPLIANCE</span>
            <span>//</span>
            <span>USER DATA DELETION</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase">
            User Data Deletion Instructions
          </h1>
          <p className="mt-3 text-sm text-zinc-500 font-mono">
            How to request removal of your account, booking data, and WhatsApp history
          </p>
        </div>

        <section className="space-y-4">
          <p className="text-sm leading-relaxed text-zinc-400">
            Dissafyt and Ace of Fyt respect your right to privacy and data control. In accordance with Meta Platform Developer Policies and the South African Protection of Personal Information Act (POPIA), you have the absolute right to request the deletion of your personal data collected via our website, WhatsApp flows, and customer apps.
          </p>
        </section>

        <section className="space-y-4 p-6 rounded-lg border border-zinc-800 bg-zinc-900/40">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            Step-by-Step Deletion Request Process
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-sm text-zinc-300 ml-2 leading-relaxed">
            <li>
              <strong>Via Email (Recommended):</strong> Send an email to{' '}
              <a href="mailto:privacy@dissafyt.com" className="text-amber-400 underline font-mono">
                privacy@dissafyt.com
              </a>{' '}
              or{' '}
              <a href="mailto:support@dissafyt.com" className="text-amber-400 underline font-mono">
                support@dissafyt.com
              </a>{' '}
              with the subject line: <code className="text-amber-400 font-mono bg-zinc-800 px-2 py-0.5 rounded">&quot;User Data Deletion Request&quot;</code>.
            </li>
            <li>
              <strong>Information to Include:</strong> In your message, specify your registered <strong>full name</strong>, <strong>email address</strong>, and the <strong>mobile telephone number</strong> used for WhatsApp appointments.
            </li>
            <li>
              <strong>Via WhatsApp Concierge:</strong> You may also message our studio line directly on WhatsApp at{' '}
              <span className="font-mono text-amber-400">+27 81 808 2570</span> stating &quot;Please delete my account and data&quot;.
            </li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            What Happens When You Request Deletion
          </h2>
          <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400 ml-2 leading-relaxed">
            <li>We verify the identity of the account holder to prevent unauthorized deletion.</li>
            <li>Your user profile, authentication records, and personal identifiers are permanently scrubbed from our database.</li>
            <li>WhatsApp interaction logs, OTP verification records, and customer review links are dissociated or removed.</li>
            <li>We will confirm the completion of your deletion request via email or message within thirty (30) business days.</li>
            <li><em>Note: Legally mandated financial accounting records (such as PayFast invoice logs required by the South African Revenue Service) will be securely retained for statutory audit periods.</em></li>
          </ul>
        </section>

        <div className="pt-8 border-t border-zinc-800 flex items-center justify-between text-xs">
          <Link href="/" className="text-zinc-500 hover:text-white transition-colors">
            &larr; Back to Home
          </Link>
          <div className="space-x-4">
            <Link href="/privacy" className="text-amber-400 hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-amber-400 hover:underline">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
