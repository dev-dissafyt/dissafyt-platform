'use client';

import React from 'react';

interface OutboundLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  source?: string;
  medium?: string;
  campaign?: string;
  children: React.ReactNode;
}

export function appendUtm(
  url: string,
  source = 'dissafyt',
  medium = 'website',
  campaign = 'flagship'
): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url;
  }
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has('utm_source')) {
      parsed.searchParams.set('utm_source', source);
    }
    if (!parsed.searchParams.has('utm_medium')) {
      parsed.searchParams.set('utm_medium', medium);
    }
    if (!parsed.searchParams.has('utm_campaign')) {
      parsed.searchParams.set('utm_campaign', campaign);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export function OutboundLink({
  href,
  source = 'dissafyt',
  medium = 'website',
  campaign = 'flagship',
  children,
  className = '',
  ...props
}: OutboundLinkProps) {
  const taggedHref = appendUtm(href, source, medium, campaign);

  return (
    <a
      href={taggedHref}
      target="_blank"
      rel="noopener noreferrer"
      className={`transition-colors hover:text-amber-400 ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
