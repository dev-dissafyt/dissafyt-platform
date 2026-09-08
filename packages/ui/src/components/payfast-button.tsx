import * as React from 'react';
import { Button } from './button';

declare const process: any;

const PAYFAST_ACTION = process.env.NEXT_PUBLIC_PAYFAST_HOST || 'https://payment.payfast.io/eng/process';
const DEFAULT_RECEIVER = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || '17675995';
const DEFAULT_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000');

export interface PayfastPlanConfig {
  amount: string;
  itemName: string;
  itemDescription: string;
}

export const PAYFAST_PLANS: Record<string, PayfastPlanConfig> = {
  solo: {
    amount: '100',
    itemName: 'The Solo',
    itemDescription:
      'One fresh cut every month to keep you looking sharp.\n\n- 1 haircut per month\n- Book anytime in the month\n- Priority booking slots\n- Cancel anytime',
  },
  twice: {
    amount: '180',
    itemName: 'The Regular',
    itemDescription:
      'Two cuts a month for the guy who never lets it grow out.\n\n- 2 haircuts per month\n- Best value per cut\n- Priority booking slots\n- Skip the queue\n- Cancel anytime',
  },
  'father-son': {
    amount: '180',
    itemName: 'Father n Son',
    itemDescription:
      'A combo cut for you and your boy — bonding time, sorted.\n\n- 1 combo cut per month\n- Father + son together\n- Great for the little ones\n- Priority booking slots\n- Cancel anytime',
  },
};

export function PayfastButton({
  planId,
  featured,
  receiver = DEFAULT_RECEIVER,
  returnUrl = DEFAULT_SITE_URL,
  cancelUrl = DEFAULT_SITE_URL,
  notifyUrl = `${DEFAULT_SITE_URL}/api/payments/payfast-notify`,
}: {
  planId: string;
  featured?: boolean;
  receiver?: string;
  returnUrl?: string;
  cancelUrl?: string;
  notifyUrl?: string;
}) {
  const config = PAYFAST_PLANS[planId];
  if (!config) return null;

  return (
    <form action={PAYFAST_ACTION} method="post" className="w-full">
      <input type="hidden" name="cmd" value="_paynow" />
      <input type="hidden" name="receiver" value={receiver} />
      <input type="hidden" name="return_url" value={returnUrl} />
      <input type="hidden" name="cancel_url" value={cancelUrl} />
      <input type="hidden" name="notify_url" value={notifyUrl} />
      <input type="hidden" name="amount" value={config.amount} />
      <input type="hidden" name="item_name" value={config.itemName} />
      <input type="hidden" name="item_description" value={config.itemDescription} />
      <input type="hidden" name="subscription_type" value="1" />
      <input type="hidden" name="recurring_amount" value={config.amount} />
      <input type="hidden" name="cycles" value="12" />
      <input type="hidden" name="frequency" value="3" />
      <Button
        type="submit"
        aria-label={`Subscribe to the ${config.itemName} plan via PayFast`}
        className={
          featured
            ? 'w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold'
            : 'w-full bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-700 font-semibold'
        }
      >
        Subscribe with PayFast (R{config.amount}/mo)
      </Button>
    </form>
  );
}

export function PayfastProductButton({
  productName,
  amount,
  description,
  receiver = DEFAULT_RECEIVER,
  returnUrl = DEFAULT_SITE_URL,
  cancelUrl = DEFAULT_SITE_URL,
  notifyUrl = `${DEFAULT_SITE_URL}/api/payments/payfast-notify`,
  className,
}: {
  productName: string;
  amount: number | string;
  description?: string;
  receiver?: string;
  returnUrl?: string;
  cancelUrl?: string;
  notifyUrl?: string;
  className?: string;
}) {
  const formattedAmount = Number(amount).toFixed(2);
  return (
    <form action={PAYFAST_ACTION} method="post" className="w-full">
      <input type="hidden" name="cmd" value="_paynow" />
      <input type="hidden" name="receiver" value={receiver} />
      <input type="hidden" name="return_url" value={returnUrl} />
      <input type="hidden" name="cancel_url" value={cancelUrl} />
      <input type="hidden" name="notify_url" value={notifyUrl} />
      <input type="hidden" name="amount" value={formattedAmount} />
      <input type="hidden" name="item_name" value={productName} />
      <input type="hidden" name="item_description" value={description || productName} />
      <Button
        type="submit"
        className={className || 'w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold'}
      >
        Buy with PayFast (R {formattedAmount})
      </Button>
    </form>
  );
}
