"use client";

import { useMemo } from 'react'

interface UserToken {
  name: string;
  status: string;
  claimable: boolean;
}

interface User {
  display: string;
  domain: string;
  hasDomain: boolean;
  tokens: UserToken[];
}

export default function UserProfilePage() {
  const user: User = useMemo(() => ({
    display: '0xA54…AC12',
    domain: 'adminmere.safu',
    hasDomain: true,
    tokens: [
      { name: 'NEXA', status: 'Ended', claimable: true },
      { name: 'Nova', status: 'Trading', claimable: true },
    ],
  }), [])

  const name = user.hasDomain ? user.domain : user.display

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
      <div className="safu-section">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs tracking-[0.18em] uppercase text-[var(--accent-safu)] font-semibold">Profile</div>
            <h1 className="text-2xl font-semibold mt-1">{name}</h1>
            <div className="text-sm text-[var(--subtext)] mt-2">Wallet: {user.display}</div>
          </div>
          <button className="btn-ghost">Edit profile</button>
        </div>

        <div className="mt-6">
          <div className="text-sm font-semibold">Your tokens</div>
          <div className="mt-3 grid md:grid-cols-2 gap-3">
            {user.tokens.map((t) => (
              <div key={t.name} className="rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-5 flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-[var(--subtext)] mt-1">Status: {t.status}</div>
                </div>
                <button className="btn-ghost">Claim fees</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
