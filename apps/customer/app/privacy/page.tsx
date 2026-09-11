import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy // Dissafyt Platform & Ace of Fyt Cape Town',
  description: 'Privacy Policy and Data Protection practices for Dissafyt Platform, Ace of Fyt Barbershop, and WhatsApp Business interactions in compliance with POPIA.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'September 11, 2026';

  return (
    <div className="min-h-screen bg-black text-zinc-300 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="border-b border-zinc-800 pb-8">
          <div className="flex items-center space-x-2 text-xs font-mono text-amber-500 uppercase tracking-widest mb-3">
            <span>LEGAL & COMPLIANCE</span>
            <span>//</span>
            <span>POPIA & META PLATFORM STANDARDS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-zinc-500 font-mono">
            Effective Date & Last Modified: {lastUpdated}
          </p>
        </div>

        {/* Introduction */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            1. Introduction & Overview
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            Welcome to <strong>Dissafyt</strong> (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;), operating the Dissafyt Platform and the <strong>Ace of Fyt Barbershop</strong> flagship studio in Cape Town, Western Cape, South Africa.
          </p>
          <p className="text-sm leading-relaxed text-zinc-400">
            We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains what personal data we collect, how we process it, the measures we take to safeguard it, and your rights under the <strong>Protection of Personal Information Act, 2013 (POPIA)</strong> of South Africa, the European Union General Data Protection Regulation (GDPR) where applicable, and <strong>Meta Platforms Inc. Developer & WhatsApp Business Policies</strong>.
          </p>
          <p className="text-sm leading-relaxed text-zinc-400">
            By accessing our websites (<code className="text-amber-400 font-mono">https://www.dissafyt.com</code>), using our client web applications, booking services, purchasing merchandise, or engaging with our official <strong>WhatsApp Business Concierge</strong>, you acknowledge that you have read and agree to this Privacy Policy.
          </p>
        </section>

        {/* Data We Collect */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            2. Personal Information We Collect
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            We only collect personal information that is reasonably necessary to fulfill appointments, process orders, verify accounts, and deliver our services:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400 ml-2">
            <li>
              <strong className="text-white">Account & Contact Information:</strong> Full name, email address, international mobile telephone number (E.164), and encrypted authentication credentials.
            </li>
            <li>
              <strong className="text-white">Barbershop Appointments & Preferences:</strong> Selected haircut or grooming service, assigned master barber, appointment date and time, appointment notes, attendance status, and membership tier.
            </li>
            <li>
              <strong className="text-white">WhatsApp & Interactive Flow Data:</strong> Inbound messages, interactive button choices, WhatsApp Flow data exchanges (such as appointment selections, account details, feedback star ratings, and concierge support tickets), and temporary one-time password (OTP) verification tokens.
            </li>
            <li>
              <strong className="text-white">Billing & Payment Records:</strong> Payment status, transaction reference numbers, order amounts, and payment timestamps. <em>Note: All credit card, Instant EFT, SnapScan, and card machine transactions are processed directly by our PCI-DSS Level 1 certified payment gateway, PayFast (Pty) Ltd. We never store or transmit raw credit card numbers on our servers.</em>
            </li>
            <li>
              <strong className="text-white">Shipping & Delivery Details:</strong> Physical delivery address and recipient details for streetwear apparel orders.
            </li>
            <li>
              <strong className="text-white">Technical & Usage Information:</strong> IP address, device type, browser characteristics, and non-sensitive server logs to detect fraud and ensure system reliability.
            </li>
          </ul>
        </section>

        {/* How We Use Your Information */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            3. How We Use Your Information
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            We use your personal information strictly for legitimate commercial, operational, and customer-service purposes:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400 ml-2">
            <li>Scheduling, managing, and confirming chair sessions with our master barbers.</li>
            <li>Sending automated WhatsApp booking confirmations, calendar updates, and 2-hour pre-appointment reminders.</li>
            <li>Providing instant self-service rescheduling and cancellation capabilities.</li>
            <li>Generating secure PayFast &quot;Pay-Me&quot; links for online settlement.</li>
            <li>Facilitating direct customer-to-barber concierge chats with Curtis Lee.</li>
            <li>Reviewing post-haircut feedback to maintain studio service excellence.</li>
            <li>Delivering e-commerce orders and processing warranty/returns.</li>
            <li>Preventing fraudulent bookings and unauthorized access to member accounts.</li>
          </ul>
        </section>

        {/* WhatsApp & Meta Cloud API Disclosure */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            4. WhatsApp Messaging & Meta Cloud API Disclosure
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            Our WhatsApp customer service operates using the official <strong>Meta WhatsApp Cloud API</strong> and <strong>WhatsApp Business Platform</strong>:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400 ml-2">
            <li>
              <strong className="text-white">End-to-End & Payload Encryption:</strong> Data exchanged within native WhatsApp Flows is encrypted using military-grade RSA-OAEP (2048-bit) and AES-128-GCM encryption between Meta&apos;s infrastructure and our secure backend endpoint.
            </li>
            <li>
              <strong className="text-white">Transactional & Service Messaging:</strong> We only message users who have initiated contact, scheduled an appointment, requested an OTP verification code, or explicitly opted in. We do not engage in unsolicited spam messaging.
            </li>
            <li>
              <strong className="text-white">Opt-Out:</strong> You may opt out of WhatsApp notifications at any time by replying &quot;STOP&quot; in the WhatsApp conversation or by contacting our concierge.
            </li>
          </ul>
        </section>

        {/* Third-Party Service Providers */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            5. Third-Party Service Providers & Data Processors
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            We do not sell, rent, or trade your personal information to third parties. We share data only with trusted infrastructure providers who are bound by strict confidentiality and data protection agreements:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="p-4 rounded border border-zinc-800 bg-zinc-900/50">
              <h3 className="font-bold text-white text-sm">Meta Platforms, Inc.</h3>
              <p className="text-xs text-zinc-400 mt-1">
                WhatsApp Business Cloud API infrastructure for automated messaging and native encrypted flows.
              </p>
            </div>
            <div className="p-4 rounded border border-zinc-800 bg-zinc-900/50">
              <h3 className="font-bold text-white text-sm">Supabase, Inc.</h3>
              <p className="text-xs text-zinc-400 mt-1">
                SOC2-compliant encrypted database hosting, user authentication, and row-level security (RLS).
              </p>
            </div>
            <div className="p-4 rounded border border-zinc-800 bg-zinc-900/50">
              <h3 className="font-bold text-white text-sm">PayFast (Pty) Ltd</h3>
              <p className="text-xs text-zinc-400 mt-1">
                PCI-DSS Level 1 compliant South African payment gateway for Visa, Mastercard, Instant EFT, and SnapScan.
              </p>
            </div>
            <div className="p-4 rounded border border-zinc-800 bg-zinc-900/50">
              <h3 className="font-bold text-white text-sm">Vercel Inc.</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Global edge compute and cloud hosting infrastructure with TLS 1.3 encryption.
              </p>
            </div>
          </div>
        </section>

        {/* Data Retention & Security */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            6. Data Retention & Security Measures
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            We employ modern industry-standard security safeguards including TLS 1.3 transport encryption, AES-GCM data encryption, automated cryptographic audit trails, and strict PostgreSQL Row Level Security (RLS) policies.
          </p>
          <p className="text-sm leading-relaxed text-zinc-400">
            We retain personal data only for as long as necessary to maintain your account, fulfill appointments, comply with financial audit obligations (South African SARS compliance), or until you request its deletion.
          </p>
        </section>

        {/* User Rights & Data Deletion */}
        <section id="data-deletion" className="space-y-4 p-6 rounded-lg border border-amber-500/30 bg-amber-950/10">
          <h2 className="text-xl font-bold text-amber-400 uppercase tracking-wider">
            7. User Rights & Data Deletion Instructions
          </h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            Under POPIA and international data protection standards, you have the right to access, rectify, or request the erasure of your personal data held by Dissafyt.
          </p>
          <h3 className="font-bold text-white text-sm mt-4">How to Request Deletion of Your Data:</h3>
          <p className="text-sm leading-relaxed text-zinc-300">
            If you wish to delete your account, booking history, or phone record from our systems:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-300 ml-2">
            <li>
              Send an email to <a href="mailto:privacy@dissafyt.com" className="text-amber-400 underline font-mono">privacy@dissafyt.com</a> with the subject line <em>&quot;Data Deletion Request&quot;</em> and your registered phone number or email address.
            </li>
            <li>
              Alternatively, send a WhatsApp message to our concierge line at <strong>+27 81 808 2570</strong> requesting account deletion.
            </li>
            <li>
              Or visit our dedicated <Link href="/data-deletion" className="text-amber-400 underline">User Data Deletion Instructions Page</Link>.
            </li>
          </ol>
          <p className="text-xs text-zinc-400 mt-2">
            Upon verification of your identity, we will permanently purge your profile, WhatsApp logs, and personal identifiers within thirty (30) business days, retaining only legally mandated fiscal transaction records.
          </p>
        </section>

        {/* Contact Information */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            8. Contact Us & Information Officer
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            For any questions, concerns, or access requests regarding this Privacy Policy or our data handling practices, please contact:
          </p>
          <div className="p-4 rounded border border-zinc-800 bg-zinc-900/40 text-xs text-zinc-300 space-y-1 font-mono">
            <p><strong className="text-white">Organization:</strong> Dissafyt Platform / Ace of Fyt Barbershop</p>
            <p><strong className="text-white">Information Officer:</strong> Curtis Lee</p>
            <p><strong className="text-white">Studio Address:</strong> Ace of Fyt Flagship Studio, Cape Town, Western Cape, South Africa</p>
            <p><strong className="text-white">WhatsApp / Phone:</strong> +27 81 808 2570</p>
            <p><strong className="text-white">Email:</strong> privacy@dissafyt.com // support@dissafyt.com</p>
          </div>
        </section>

        {/* Navigation Back */}
        <div className="pt-8 border-t border-zinc-800 flex items-center justify-between text-xs">
          <Link href="/" className="text-zinc-500 hover:text-white transition-colors">
            &larr; Back to Dissafyt Home
          </Link>
          <Link href="/terms" className="text-amber-400 hover:underline">
            View Terms & Conditions &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
