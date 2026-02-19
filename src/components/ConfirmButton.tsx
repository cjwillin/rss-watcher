"use client";

export function ConfirmButton({
  className,
  confirmText,
  children,
}: {
  className?: string;
  confirmText: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

