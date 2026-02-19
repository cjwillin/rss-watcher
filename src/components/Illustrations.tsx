export function IllusSignal() {
  return (
    <svg viewBox="0 0 520 320" role="img" aria-label="Signal scanning illustration">
      <defs>
        <linearGradient id="rw_grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgba(31,111,235,.85)" />
          <stop offset="1" stopColor="rgba(21,183,158,.75)" />
        </linearGradient>
        <radialGradient id="rw_glow" cx="50%" cy="35%" r="70%">
          <stop offset="0" stopColor="rgba(31,111,235,.22)" />
          <stop offset="1" stopColor="rgba(31,111,235,0)" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="520" height="320" rx="22" fill="rgba(255,255,255,.28)" />
      <rect x="0" y="0" width="520" height="320" rx="22" fill="url(#rw_glow)" />

      <g opacity=".9">
        <path
          d="M 60 244 C 120 160, 160 170, 210 132 C 265 90, 315 78, 372 92 C 430 108, 468 150, 478 198"
          fill="none"
          stroke="rgba(11,12,14,.18)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M 60 244 C 120 160, 160 170, 210 132 C 265 90, 315 78, 372 92 C 430 108, 468 150, 478 198"
          fill="none"
          stroke="url(#rw_grad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="0 14"
        />
      </g>

      <g>
        <circle cx="372" cy="92" r="11" fill="rgba(11,12,14,.82)" />
        <circle cx="372" cy="92" r="26" fill="rgba(31,111,235,.12)" />
        <circle cx="372" cy="92" r="42" fill="rgba(31,111,235,.08)" />
      </g>

      <g>
        <rect x="70" y="54" width="176" height="44" rx="14" fill="rgba(255,255,255,.65)" stroke="rgba(11,12,14,.10)" />
        <rect x="86" y="70" width="92" height="12" rx="999" fill="rgba(11,12,14,.14)" />
        <rect x="186" y="70" width="44" height="12" rx="999" fill="rgba(21,183,158,.35)" />
      </g>

      <g>
        <rect x="312" y="214" width="158" height="56" rx="16" fill="rgba(255,255,255,.65)" stroke="rgba(11,12,14,.10)" />
        <rect x="328" y="232" width="88" height="12" rx="999" fill="rgba(11,12,14,.14)" />
        <rect x="328" y="250" width="128" height="10" rx="999" fill="rgba(31,111,235,.25)" />
      </g>
    </svg>
  );
}

export function IllusInbox() {
  return (
    <svg viewBox="0 0 520 320" role="img" aria-label="Inbox alerts illustration">
      <defs>
        <linearGradient id="rw_grad2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgba(21,183,158,.85)" />
          <stop offset="1" stopColor="rgba(31,111,235,.70)" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="520" height="320" rx="22" fill="rgba(255,255,255,.28)" />

      <g transform="translate(86 64)">
        <rect x="0" y="0" width="348" height="210" rx="20" fill="rgba(255,255,255,.62)" stroke="rgba(11,12,14,.10)" />
        <path
          d="M 22 178 L 80 120 H 268 L 326 178"
          fill="rgba(11,12,14,.03)"
          stroke="rgba(11,12,14,.10)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        <g transform="translate(28 28)">
          <rect x="0" y="0" width="292" height="46" rx="14" fill="rgba(255,255,255,.7)" stroke="rgba(11,12,14,.08)" />
          <circle cx="18" cy="23" r="6" fill="rgba(31,111,235,.75)" />
          <rect x="34" y="16" width="152" height="10" rx="999" fill="rgba(11,12,14,.14)" />
          <rect x="34" y="30" width="104" height="8" rx="999" fill="rgba(11,12,14,.10)" />
          <rect x="228" y="18" width="48" height="18" rx="999" fill="rgba(21,183,158,.20)" />
        </g>

        <g transform="translate(28 86)">
          <rect x="0" y="0" width="292" height="46" rx="14" fill="rgba(255,255,255,.7)" stroke="rgba(11,12,14,.08)" />
          <circle cx="18" cy="23" r="6" fill="rgba(21,183,158,.75)" />
          <rect x="34" y="16" width="176" height="10" rx="999" fill="rgba(11,12,14,.14)" />
          <rect x="34" y="30" width="124" height="8" rx="999" fill="rgba(11,12,14,.10)" />
          <rect x="230" y="18" width="46" height="18" rx="999" fill="rgba(31,111,235,.18)" />
        </g>

        <g transform="translate(28 144)">
          <rect x="0" y="0" width="292" height="46" rx="14" fill="rgba(255,255,255,.7)" stroke="rgba(11,12,14,.08)" />
          <circle cx="18" cy="23" r="6" fill="url(#rw_grad2)" />
          <rect x="34" y="16" width="140" height="10" rx="999" fill="rgba(11,12,14,.14)" />
          <rect x="34" y="30" width="164" height="8" rx="999" fill="rgba(11,12,14,.10)" />
          <rect x="206" y="18" width="70" height="18" rx="999" fill="rgba(217,45,32,.10)" />
        </g>
      </g>

      <g>
        <circle cx="432" cy="72" r="10" fill="rgba(11,12,14,.82)" />
        <circle cx="432" cy="72" r="28" fill="rgba(21,183,158,.10)" />
        <circle cx="432" cy="72" r="44" fill="rgba(21,183,158,.06)" />
      </g>
    </svg>
  );
}

