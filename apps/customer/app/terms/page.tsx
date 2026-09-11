import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms and Conditions // Dissafyt Platform & Ace of Fyt Cape Town',
  description: 'Terms of Service, Appointment Policies, Cancellation Rules, and E-commerce Conditions for Dissafyt Platform and Ace of Fyt Barbershop.',
};

export default function TermsAndConditionsPage() {
  const lastUpdated = 'September 11, 2026';

  return (
    <div className="min-h-screen bg-black text-zinc-300 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="border-b border-zinc-800 pb-8">
          <div className="flex items-center space-x-2 text-xs font-mono text-amber-500 uppercase tracking-widest mb-3">
            <span>LEGAL & POLICIES</span>
            <span>//</span>
            <span>DISSAFYT PLATFORM & ACE OF FYT GUILD</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
            Terms & Conditions
          </h1>
          <p className="mt-3 text-sm text-zinc-500 font-mono">
            Effective Date & Last Modified: {lastUpdated}
          </p>
        </div>

        {/* 1. Agreement to Terms */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            1. Agreement to Terms
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            These Terms and Conditions (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;Client&quot;, &quot;User&quot;, &quot;you&quot;) and <strong>Dissafyt</strong> (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), governing your use of the Dissafyt web platform (<code className="text-amber-400 font-mono">https://www.dissafyt.com</code>), appointment booking services at <strong>Ace of Fyt Barbershop</strong>, our e-commerce streetwear store, and interactions with our official <strong>WhatsApp Business Concierge</strong>.
          </p>
          <p className="text-sm leading-relaxed text-zinc-400">
            By booking a haircut, purchasing merchandise, registering an account, or interacting with our WhatsApp flows, you explicitly accept and agree to be bound by these Terms and our <Link href="/privacy" className="text-amber-400 underline">Privacy Policy</Link>. If you do not agree to these Terms, please do not use our services.
          </p>
        </section>

        {/* 2. Barbershop Services & Appointments */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            2. Barbershop Services & Studio Appointments
          </h2>
          <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400 ml-2">
            <li>
              <strong className="text-white">Studio Location:</strong> All in-person grooming sessions take place at Ace of Fyt Flagship Studio, Cape Town, Western Cape, South Africa.
            </li>
            <li>
              <strong className="text-white">Punctuality:</strong> We pride ourselves on precision and respect for everyone&apos;s schedule. Please arrive <strong>5 minutes prior</strong> to your scheduled appointment time.
            </li>
            <li>
              <strong className="text-white">Late Arrivals:</strong> If you arrive more than 10 minutes past your scheduled start time, we may need to modify your service to avoid delaying following clients, or reschedule your appointment.
            </li>
            <li>
              <strong className="text-white">Service Allocation:</strong> While we endeavor to fulfill requests for specific master barbers (including Curtis Lee), we reserve the right in rare operational contingencies to reassign a cut to another qualified master barber of equivalent skill.
            </li>
          </ul>
        </section>

        {/* 3. Cancellation & Rescheduling Policy */}
        <section className="space-y-4 p-6 rounded-lg border border-zinc-800 bg-zinc-900/50">
          <h2 className="text-xl font-bold text-amber-400 uppercase tracking-wider">
            3. Rescheduling & Cancellation Policy
          </h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            We understand plans change. We provide seamless, automated 24/7 self-service cancellation and rescheduling directly inside WhatsApp:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-zinc-300 ml-2">
            <li>
              <strong className="text-white">Minimum Notice:</strong> We require at least <strong>two (2) hours advance notice</strong> for any appointment cancellation or reschedule to allow another client the opportunity to book the chair.
            </li>
            <li>
              <strong className="text-white">How to Cancel or Reschedule:</strong> Simply tap <strong>&quot;Appointment Help&quot;</strong> in our WhatsApp chat menu or message &quot;cancel&quot; / &quot;reschedule&quot; to <span className="font-mono text-amber-400">+27 81 808 2570</span>.
            </li>
            <li>
              <strong className="text-white">No-Shows:</strong> Repeated failure to attend scheduled appointments without prior notice (&quot;no-shows&quot;) may result in forfeiture of advance deposits or a requirement to prepay future chair bookings.
            </li>
          </ul>
        </section>

        {/* 4. Pricing, Payments & PayFast */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            4. Pricing, Currency & Payment Terms
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            All prices displayed on our platform, in WhatsApp Flows, and at the studio are quoted in <strong>South African Rand (ZAR)</strong> and include Value Added Tax (VAT) where applicable.
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400 ml-2">
            <li>
              <strong className="text-white">Payment Options:</strong> Clients may settle payments online via our automated PayFast &quot;Pay-Me&quot; links (supporting Visa, Mastercard, Instant EFT, SnapScan, and Masterpass) or via credit/debit card machine in the studio chair.
            </li>
            <li>
              <strong className="text-white">Secure Gateway:</strong> Online transactions are handled exclusively through PayFast (Pty) Ltd. We do not store sensitive payment card details on our servers.
            </li>
            <li>
              <strong className="text-white">Price Modifications:</strong> We reserve the right to revise service and merchandise prices at any time. Any changes will not affect confirmed bookings already made.
            </li>
          </ul>
        </section>

        {/* 5. VIP Monthly Memberships */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            5. VIP Guild Memberships & Subscriptions
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            Dissafyt offers recurring VIP monthly memberships that grant allocated chair sessions, product discounts, and priority booking:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400 ml-2">
            <li>Memberships are billed monthly in advance via PayFast recurring subscription.</li>
            <li>Monthly haircut quotas must be utilized within the corresponding billing period and do not roll over to subsequent months unless explicitly stated.</li>
            <li>You may pause or cancel your subscription at any time via your member portal or by contacting concierge support.</li>
          </ul>
        </section>

        {/* 6. Dissafyt Streetwear Lab & Deliveries */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            6. Streetwear Merchandise, Shipping & Returns
          </h2>
          <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400 ml-2">
            <li>
              <strong className="text-white">Orders & Fulfilment:</strong> Orders placed on our shop are processed within 1–2 business days from our Cape Town studio lab.
            </li>
            <li>
              <strong className="text-white">Nationwide Shipping:</strong> Deliveries across South Africa are dispatched via reputable couriers with end-to-end tracking. Delivery times generally range from 2 to 4 business days.
            </li>
            <li>
              <strong className="text-white">Returns & Exchanges:</strong> Unworn apparel in original packaging with tags attached may be returned or exchanged within fourteen (14) days of receipt. Due to health regulations, opened grooming consumables cannot be returned once unsealed.
            </li>
          </ul>
        </section>

        {/* 7. WhatsApp & Acceptable Use */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            7. WhatsApp Channel & Acceptable Use
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            When communicating through our WhatsApp Business channel or submitting WhatsApp Flows, you agree to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400 ml-2">
            <li>Provide accurate contact details and legitimate appointment dates.</li>
            <li>Treat all studio staff and master barbers with courtesy and mutual respect.</li>
            <li>Refrain from transmitting unlawful, abusive, harassing, defamatory, or fraudulent messages.</li>
            <li>We reserve the right to suspend or block users who engage in abusive communications or repeated malicious bookings.</li>
          </ul>
        </section>

        {/* 8. Limitation of Liability */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            8. Limitation of Liability
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            To the maximum extent permitted by South African law (including the Consumer Protection Act, 2008), Dissafyt, its directors, barbers, and contractors shall not be liable for any indirect, incidental, or consequential damages resulting from your use of our digital platforms or services.
          </p>
        </section>

        {/* 9. Governing Law */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            9. Governing Law & Jurisdiction
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            These Terms are governed by and construed in accordance with the laws of the Republic of South Africa. Any disputes arising in connection with these Terms shall be subject to the exclusive jurisdiction of the Western Cape High Court, Cape Town.
          </p>
        </section>

        {/* 10. Contact Us */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            10. Contact Information
          </h2>
          <div className="p-4 rounded border border-zinc-800 bg-zinc-900/40 text-xs text-zinc-300 space-y-1 font-mono">
            <p><strong className="text-white">Business Name:</strong> Dissafyt Platform & Ace of Fyt Barbershop</p>
            <p><strong className="text-white">Studio Address:</strong> Ace of Fyt Flagship Studio, Cape Town, Western Cape, South Africa</p>
            <p><strong className="text-white">Telephone / WhatsApp:</strong> +27 81 808 2570</p>
            <p><strong className="text-white">Email:</strong> support@dissafyt.com // legal@dissafyt.com</p>
          </div>
        </section>

        {/* Navigation Back */}
        <div className="pt-8 border-t border-zinc-800 flex items-center justify-between text-xs">
          <Link href="/" className="text-zinc-500 hover:text-white transition-colors">
            &larr; Back to Dissafyt Home
          </Link>
          <Link href="/privacy" className="text-amber-400 hover:underline">
            View Privacy Policy &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
