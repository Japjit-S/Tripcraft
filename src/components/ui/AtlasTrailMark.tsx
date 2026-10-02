interface AtlasTrailMarkProps {
  className?: string;
}

export default function AtlasTrailMark({ className = 'h-20 w-24' }: AtlasTrailMarkProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 96 84"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 69C23 69 23 61 33 61C41 61 43 67 51 59C60 50 64 55 70 49C76 43 79 42 87 42"
        stroke="var(--color-tc-sage)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="2 5"
      />
      <circle cx="10" cy="69" r="3.5" fill="var(--color-tc-tangerine)" />
      <ellipse cx="53" cy="73" rx="18" ry="3" fill="var(--color-tc-sage)" opacity="0.45" />
      <path
        d="M53 10L39 29H47L34 45H43L27 62H47V72H58V62H78L63 45H72L59 29H67L53 10Z"
        fill="var(--color-tc-teal)"
        stroke="var(--color-tc-ink)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M53 20L48 28H58L53 20Z" fill="var(--color-tc-saffron)" />
      <path d="M53 38L48 46H58L53 38Z" fill="var(--color-tc-sage)" />
    </svg>
  );
}
