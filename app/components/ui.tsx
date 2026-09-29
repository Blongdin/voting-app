import Link from "next/link";
import type { ReactNode } from "react";

// 화면 공통 부품. 색과 모양은 globals.css의 토큰을 쓴다.

/** 한 화면의 본문 폭과 여백. 휴대폰에서 아래에 붙는 버튼(BottomCTA)을 위한 공간을 남긴다. */
export function Page({ children }: { children: ReactNode }) {
  return <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pt-4 pb-10">{children}</main>;
}

/** 맨 위 줄: 뒤로 가기 링크와 오른쪽 부품. */
export function TopBar({ back, right }: { back?: { href: string; label: string }; right?: ReactNode }) {
  return (
    <div className="flex h-12 items-center justify-between">
      {back ? (
        <Link
          href={back.href}
          className="-ml-2 flex items-center gap-1 rounded-lg px-2 py-1 text-[15px] font-medium text-sub active:bg-fill"
        >
          <span aria-hidden className="text-xl leading-none">‹</span>
          {back.label}
        </Link>
      ) : (
        <span />
      )}
      {right}
    </div>
  );
}

/** 화면 제목. 크고 굵게. */
export function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mt-4 mb-6">
      <h1 className="text-[26px] leading-tight font-bold break-keep text-text">{children}</h1>
      {sub && <div className="mt-2 text-[15px] text-muted">{sub}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl bg-surface p-5 ${className}`}>{children}</section>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 text-[19px] font-bold text-text">{children}</h2>;
}

type ButtonVariant = "primary" | "secondary" | "neutral" | "danger";
type ButtonSize = "large" | "medium" | "small";

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white active:bg-primary-pressed",
  secondary: "bg-primary-soft text-primary active:brightness-95",
  // 회색 바탕 위에 놓이는 보조 버튼이라 흰 면을 쓴다(바탕과 같은 회색이면 글자처럼 보인다).
  neutral: "bg-surface text-sub active:bg-fill",
  danger: "bg-danger-soft text-danger active:brightness-95",
};

const sizeClass: Record<ButtonSize, string> = {
  large: "h-14 w-full rounded-2xl text-[17px]",
  medium: "h-12 rounded-xl px-5 text-[16px]",
  small: "h-9 rounded-lg px-3.5 text-[14px]",
};

/** <button>과 <Link> 모두에 쓰는 버튼 모양. */
export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "large") {
  return `inline-flex items-center justify-center font-semibold transition-[filter,background-color] select-none disabled:cursor-not-allowed disabled:opacity-40 ${variantClass[variant]} ${sizeClass[size]}`;
}

/**
 * 휴대폰에서 화면 아래에 붙어 있는 주요 버튼 자리. 내용이 버튼 뒤로 자연스럽게 사라지도록 위쪽을 흐리게 한다.
 * 넓은 화면에서는 본문 끝에 그대로 놓인다.
 */
export function BottomCTA({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-auto bg-gradient-to-t from-background from-70% to-transparent px-5 pt-6 pb-[max(env(safe-area-inset-bottom),20px)]">
      {children}
    </div>
  );
}

/** 입력 칸 모양. 흰 카드 안에서는 회색 칸, 회색 바탕 위에서는(onBackground) 흰 칸. */
export function inputClass(onBackground = false) {
  return `h-14 w-full rounded-2xl px-4 text-[17px] text-text placeholder:text-muted outline-none ring-primary transition-shadow focus:ring-2 ${onBackground ? "bg-surface" : "bg-fill"}`;
}

export function FieldError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-2 text-[14px] font-medium text-danger">
      {children}
    </p>
  );
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warning" }) {
  const toneClass = tone === "info" ? "bg-primary-soft text-primary" : "bg-danger-soft text-danger";
  return (
    <p role="status" className={`mb-4 rounded-2xl px-4 py-3.5 text-[15px] font-medium ${toneClass}`}>
      {children}
    </p>
  );
}
