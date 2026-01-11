import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width="1em"
      height="1em"
      {...props}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <g fill="url(#logo-gradient)">
        <path d="M76 40h72a60 60 0 010 120H76a36 36 0 01-36-36V76a36 36 0 0136-36zm0 24v72h60a36 36 0 000-72H76z" />
        <path d="M180 96h36v120h-36V96z" />
      </g>
    </svg>
  );
}
