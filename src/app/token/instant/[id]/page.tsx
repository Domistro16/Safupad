'use client'

import { useEffect, useRef } from 'react'

export default function InstantLaunchTokenPage() {
  const rootRef = useRef(null)

  useEffect(() => {
    const root = document.documentElement
    const scope = rootRef.current
    if (!scope) return

    const toggle = scope.querySelector('#darkToggle')

    const stored = (() => { try { return localStorage.getItem('safu-theme') } catch { return null } })()
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial = stored || (prefersDark ? 'dark' : 'light')
    if (initial === 'dark') root.classList.add('dark')
    if (toggle) toggle.textContent = root.classList.contains('dark') ? '☀️' : '🌙'
    if (toggle) {
      const onToggle = () => {
        root.classList.toggle('dark')
        const next = root.classList.contains('dark') ? 'dark' : 'light'
        try { localStorage.setItem('safu-theme', next) } catch {}
        toggle.textContent = next === 'dark' ? '☀️' : '🌙'
      }
      toggle.addEventListener('click', onToggle)
      return () => toggle.removeEventListener('click', onToggle)
    }
  }, [])

  useEffect(() => {
    const scope = rootRef.current
    if (!scope) return

    // Tabs (Market)
    const marketSection = scope.querySelector('#marketSection')
    if (marketSection) {
      const tabBtns = marketSection.querySelectorAll('.tab-btn[data-tab]')
      const panels = marketSection.querySelectorAll('.tab-panel')
      tabBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const tab = btn.getAttribute('data-tab')
          tabBtns.forEach((b) => b.classList.remove('is-active'))
          btn.classList.add('is-active')
          panels.forEach((p) => p.classList.add('hidden'))
          const panel = marketSection.querySelector(`.tab-panel[data-panel="${tab}"]`)
          if (panel) panel.classList.remove('hidden')
        })
      })
    }

    // Chart Series + Smooth Morph
    const pxLine = scope.querySelector('#pxLine')
    const pxArea = scope.querySelector('#pxArea')
    const lineAnim = scope.querySelector('#lineAnim')
    const areaAnim = scope.querySelector('#areaAnim')
    const pxLabel = scope.querySelector('#pxLabel')
    const pxChg = scope.querySelector('#pxChg')

    const tfSeries = {
      '1m':  { d: 'M0,22 L6,19 L12,24 L18,15 L24,17 L30,21 L36,26 L42,24 L48,28 L54,27 L60,31 L66,29 L72,33 L78,32 L84,34 L90,33 L96,35 L100,34', px: '$0.000698', chg: '▼ 65.93%', seed: 1 },
      '5m':  { d: 'M0,18 L7,20 L14,16 L21,19 L28,15 L35,17 L42,23 L49,21 L56,26 L63,24 L70,28 L77,27 L84,30 L91,29 L100,31', px: '$0.000705', chg: '▼ 62.10%', seed: 2 },
      '15m': { d: 'M0,14 L8,16 L16,18 L24,13 L32,15 L40,19 L48,22 L56,21 L64,24 L72,26 L80,25 L88,28 L96,29 L100,28', px: '$0.000732', chg: '▼ 41.02%', seed: 3 },
      '1h':  { d: 'M0,10 L10,12 L20,16 L30,14 L40,18 L50,22 L60,24 L70,23 L80,26 L90,28 L100,30', px: '$0.000801', chg: '▼ 28.44%', seed: 4 },
      '4h':  { d: 'M0,8 L12,10 L24,12 L36,15 L48,18 L60,20 L72,22 L84,24 L96,26 L100,27', px: '$0.000892', chg: '▼ 12.66%', seed: 5 },
      '1d':  { d: 'M0,9 L11,11 L22,14 L33,16 L44,18 L55,21 L66,24 L77,26 L88,29 L100,31', px: '$0.000944', chg: '▲ 4.21%',  seed: 6 },
      'all': { d: 'M0,6 L12,9 L24,12 L36,16 L48,19 L60,23 L72,26 L84,30 L96,33 L100,34', px: '$0.001120', chg: '▲ 18.04%', seed: 7 }
    }

    let activeTF = '1m'

    function lineToArea(d){
      const pts = d.replace(/^M/, 'L')
      return `M0,40 ${pts} L100,40 Z`
    }

    function setTF(key){
      const s = tfSeries[key] || tfSeries['1m']
      activeTF = key

      if (pxLabel) pxLabel.textContent = s.px
      if (pxChg) {
        pxChg.textContent = s.chg
        const up = s.chg.includes('▲')
        pxChg.classList.toggle('text-emerald-500', up)
        pxChg.classList.toggle('text-rose-500', !up)
      }

      if (!pxLine || !pxArea) return
      const fromD = pxLine.getAttribute('d') || s.d
      const toD = s.d

      if (lineAnim) {
        lineAnim.setAttribute('values', `${fromD};${toD}`)
        try { lineAnim.beginElement() } catch {}
      }
      if (areaAnim) {
        areaAnim.setAttribute('values', `${pxArea.getAttribute('d') || lineToArea(fromD)};${lineToArea(toD)}`)
        try { areaAnim.beginElement() } catch {}
      }

      pxLine.setAttribute('d', toD)
      pxArea.setAttribute('d', lineToArea(toD))
    }

    scope.querySelectorAll('.tf-btn[data-tf]').forEach((b) => {
      b.addEventListener('click', () => {
        scope.querySelectorAll('.tf-btn[data-tf]').forEach((x) => x.classList.remove('is-active'))
        b.classList.add('is-active')
        setTF(b.getAttribute('data-tf') || '1m')
      })
    })
    setTF('1m')

    // Crosshair + Dot + Hover Price
    const svg = scope.querySelector('#priceSvg')
    const crossV = scope.querySelector('#crossV')
    const dot = scope.querySelector('#priceDot')
    const priceText = scope.querySelector('#hoverPrice')
    const priceBg = scope.querySelector('#hoverPriceBg')
    const priceGroup = scope.querySelector('#hoverPriceGroup')

    function basePrice(){
      if (!pxLabel) return 0
      const n = parseFloat(pxLabel.textContent.replace(/[^0-9.]/g, ''))
      return Number.isFinite(n) ? n : 0
    }
    function sampleY(x){
      const seed = (tfSeries[activeTF]?.seed || 1)
      const wobble = Math.sin((x / 8) + seed) * 5 + Math.sin((x / 3.5) + seed * 0.6) * 1.6
      const center = 20 + (seed - 4) * 0.65
      return Math.max(3, Math.min(37, center + wobble))
    }
    function samplePriceAt(x){
      const b = basePrice()
      const seed = (tfSeries[activeTF]?.seed || 1)
      const pct = (Math.sin((x / 13) + seed) * 0.018) + (Math.sin((x / 5.2) + seed * 0.4) * 0.006)
      return b * (1 + pct)
    }

    const onMove = (e) => {
      if (!svg || !crossV || !dot || !priceText || !priceBg || !priceGroup) return
      const r = svg.getBoundingClientRect()
      const x = ((e.clientX - r.left) / r.width) * 100
      const clampedX = Math.max(0, Math.min(100, x))

      crossV.setAttribute('x1', clampedX)
      crossV.setAttribute('x2', clampedX)
      crossV.style.opacity = '1'

      const y = sampleY(clampedX)
      dot.setAttribute('cx', clampedX)
      dot.setAttribute('cy', y)

      const p = samplePriceAt(clampedX)
      priceText.textContent = `$${p.toFixed(6)}`

      const textWidth = priceText.getComputedTextLength()
      const pad = 1.6
      const boxW = textWidth + pad * 2
      const boxH = 4.2

      const px = Math.max(1, Math.min(100 - boxW - 1, clampedX - boxW / 2))
      const py = Math.max(1, y - 7.2)

      priceBg.setAttribute('width', boxW)
      priceBg.setAttribute('height', boxH)
      priceBg.setAttribute('x', px)
      priceBg.setAttribute('y', py)

      priceText.setAttribute('x', px + pad)
      priceText.setAttribute('y', py + 3.05)

      priceGroup.setAttribute('opacity', '1')
    }
    const onLeave = () => {
      if (crossV) crossV.style.opacity = '0'
      if (priceGroup) priceGroup.setAttribute('opacity', '0')
    }
    if (svg) {
      svg.addEventListener('mousemove', onMove)
      svg.addEventListener('mouseleave', onLeave)
    }

    // Pagination: Transactions + Holders
    function paginate(data, page, size) {
      const start = page * size
      return data.slice(start, start + size)
    }

    const txData = Array.from({ length: 63 }).map((_, i) => {
      const sell = i % 3 === 0
      const wallet = `0x${(100000 + i).toString(16).slice(0, 6)}…`
      return {
        type: sell ? 'Sell' : 'Buy',
        wallet,
        valLeft: sell ? `${(80 + i)}k NXRA` : `${(0.12 + i / 110).toFixed(2)} BNB`,
        valRight: sell ? `${(0.08 + i / 350).toFixed(2)} BNB` : `${(110 + i) }k NXRA`
      }
    })
    const holderData = Array.from({ length: 48 }).map((_, i) => ({
      w: `0x${(200000 + i * 17).toString(16).slice(0, 6)}…`,
      p: `${(Math.max(0.4, 6.2 - i * 0.11)).toFixed(2)}%`
    }))

    function setupList({ listId, pagesId, prevId, nextId, data, kind }) {
      let page = 0
      const size = 20
      const list = scope.querySelector(`#${listId}`)
      const pages = scope.querySelector(`#${pagesId}`)
      const prev = scope.querySelector(`#${prevId}`)
      const next = scope.querySelector(`#${nextId}`)
      if (!list || !pages || !prev || !next) return

      const maxPage = Math.max(0, Math.ceil(data.length / size) - 1)

      function render() {
        list.innerHTML = ''
        const slice = paginate(data, page, size)
        slice.forEach((d) => {
          const row = document.createElement('div')
          row.className = 'flex justify-between items-center gap-3 px-3 py-2 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)]'
          row.style.background = 'color-mix(in srgb, var(--surface) 92%, transparent)'

          if (kind === 'tx') {
            row.innerHTML = `
              <div class="min-w-0">
                <div class="text-[11px] font-extrabold ${d.type === 'Sell' ? 'text-rose-500' : 'text-emerald-500'}">${d.type}</div>
                <div class="text-[11px] text-[var(--subtext)] truncate">${d.wallet}</div>
              </div>
              <div class="text-right">
                <div class="text-[11px] font-extrabold">${d.valLeft}</div>
                <div class="text-[11px] text-[var(--subtext)]">${d.valRight}</div>
              </div>
            `
          } else {
            row.innerHTML = `
              <div class="text-[11px] font-extrabold">${d.w}</div>
              <div class="text-[11px] font-extrabold">${d.p}</div>
            `
          }
          list.appendChild(row)
        })

        pages.innerHTML = ''
        const windowSize = 5
        const start = Math.max(0, Math.min(maxPage - (windowSize - 1), page - 2))
        const end = Math.min(maxPage, start + (windowSize - 1))

        for (let i = start; i <= end; i++) {
          const b = document.createElement('button')
          b.textContent = String(i + 1)
          b.className = 'pill' + (i === page ? ' is-active' : '')
          b.onclick = () => { page = i; render() }
          pages.appendChild(b)
        }

        prev.disabled = page === 0
        next.disabled = page === maxPage
      }

      prev.onclick = () => { if (page > 0) { page--; render() } }
      next.onclick = () => { if (page < maxPage) { page++; render() } }
      render()
    }

    setupList({ listId: 'txList', pagesId: 'txPages', prevId: 'txPrev', nextId: 'txNext', data: txData, kind: 'tx' })
    setupList({ listId: 'holderList', pagesId: 'hPages', prevId: 'hPrev', nextId: 'hNext', data: holderData, kind: 'holders' })

    // Trade: Buy/Sell + Calculations
    let mode = 'buy'
    let currency = 'BNB'

    const rateBNB = 125000
    const rateUSD1 = 900
    const sellBNBPerNXRA = 0.000008

    const amountInput = scope.querySelector('#amountInput')
    const slider = scope.querySelector('#amountSlider')
    const label = scope.querySelector('#amountLabel')
    const action = scope.querySelector('#actionBtn')
    const preview = scope.querySelector('#previewText')

    function recalc(v){
      if (!preview) return
      const val = Number.isFinite(v) ? v : 0
      if (mode === 'buy') {
        const r = currency === 'USD1' ? rateUSD1 : rateBNB
        const out = Math.max(0, val * r)
        preview.innerHTML = `You receive ≈ <span class="font-semibold">${out.toLocaleString()}</span> NXRA`
      } else {
        const bnbOut = Math.max(0, val * sellBNBPerNXRA)
        preview.innerHTML = `You receive ≈ <span class="font-semibold">${bnbOut.toFixed(4)}</span> BNB`
      }
    }

    function setMode(nextMode){
      mode = nextMode
      if (!amountInput || !slider || !label || !action || !preview) return

      if (mode === 'buy') {
        label.textContent = `Amount (${currency})`
        slider.max = '15'
        slider.step = '0.01'
        amountInput.step = '0.01'
        amountInput.value = '1'
        slider.value = '1'
        action.textContent = 'Buy NXRA'
      } else {
        label.textContent = 'Amount (NXRA)'
        slider.max = '1000000'
        slider.step = '1000'
        amountInput.step = '1'
        amountInput.value = '100000'
        slider.value = '100000'
        action.textContent = 'Sell NXRA'
      }
      recalc(parseFloat(amountInput.value || '0'))
    }

    function syncFromInput(){
      if (!amountInput || !slider) return
      const v = parseFloat(amountInput.value || '0')
      slider.value = String(Number.isFinite(v) ? v : 0)
      recalc(Number.isFinite(v) ? v : 0)
    }
    function syncFromSlider(){
      if (!amountInput || !slider) return
      const v = parseFloat(slider.value || '0')
      amountInput.value = String(Number.isFinite(v) ? v : 0)
      recalc(Number.isFinite(v) ? v : 0)
    }

    scope.querySelectorAll('#tradeTabs .tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        scope.querySelectorAll('#tradeTabs .tab-btn').forEach((b) => b.classList.remove('is-active'))
        btn.classList.add('is-active')
        setMode(btn.getAttribute('data-trade') || 'buy')
      })
    })

    scope.querySelectorAll('#currencyToggle .pill').forEach((p) => {
      p.addEventListener('click', () => {
        scope.querySelectorAll('#currencyToggle .pill').forEach((x) => x.classList.remove('is-active'))
        p.classList.add('is-active')
        currency = p.getAttribute('data-currency') || 'BNB'
        if (mode === 'buy' && label) label.textContent = `Amount (${currency})`
        syncFromInput()
      })
    })

    scope.querySelectorAll('#quickBtns .pill').forEach((b) => {
      b.addEventListener('click', () => {
        const pct = parseFloat(b.getAttribute('data-pct') || '0')
        const max = mode === 'buy' ? 15 : 1000000
        const val = (max * pct) / 100
        if (!amountInput || !slider) return
        amountInput.value = mode === 'buy' ? val.toFixed(2) : String(Math.round(val))
        slider.value = amountInput.value
        recalc(parseFloat(amountInput.value || '0'))
      })
    })

    if (amountInput) amountInput.addEventListener('input', syncFromInput)
    if (slider) slider.addEventListener('input', syncFromSlider)
    setMode('buy')

    // cleanup
    return () => {
      if (svg) {
        svg.removeEventListener('mousemove', onMove)
        svg.removeEventListener('mouseleave', onLeave)
      }
    }
  }, [])

  return (
    <div ref={rootRef}>
      <nav className="w-full px-6 lg:px-10 py-4 bg-[var(--surface)] backdrop-blur border-b border-[var(--border-soft)] sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <span>✦ SafuPad</span>
          <span className="hidden sm:inline text-[11px] px-2 py-1 rounded-full bg-black text-white border border-white/15 tracking-[0.16em] uppercase">Instant</span>
        </div>
        <div className="hidden md:flex gap-6 items-center text-sm font-medium">
          <button className="opacity-70 hover:opacity-100">Launch</button>
          <button className="opacity-70 hover:opacity-100">Explore</button>
          <button className="opacity-70 hover:opacity-100">Docs</button>
          <button id="darkToggle" className="px-3 py-1.5 rounded-full border border-[var(--border-soft)] bg-[var(--surface)]">🌙</button>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 lg:px-10 py-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-soft)] flex items-center justify-center font-black tracking-tight">NX</div>
            <div className="min-w-0">
              <div className="text-2xl font-semibold truncate">NEXA <span className="text-sm text-[var(--subtext)] font-semibold">$NXRA</span></div>
              <div className="text-sm text-[var(--subtext)]">Instant launch · Bonding curve market</div>
            </div>
          </div>
          <span className="pill-live flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>Live</span>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 lg:px-10 pb-24 grid lg:grid-cols-[1.25fr_0.75fr] gap-8">
        <div className="space-y-6">
          <div className="safu-section" id="marketSection">
            <div className="mb-5">
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span>Bonding Curve Progress</span>
                <span id="gradPct">64%</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden border border-[var(--border-soft)]">
                <div id="gradBar" className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-500 transition-all" style={{width:'64%'}}></div>
              </div>
            </div>

            <div className="flex gap-2 items-center mb-4">
              <button className="tab-btn is-active" data-tab="chart">Chart</button>
              <button className="tab-btn" data-tab="tx">Transactions</button>
              <button className="tab-btn" data-tab="holders">Holders</button>
            </div>

            <div className="space-y-0">
              <div className="tab-panel" data-panel="chart">
                <div className="rounded-xl bg-[var(--surface-soft)] border border-[var(--border-soft)] p-4 flex flex-col overflow-hidden h-[22rem]">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold" id="pxLabel">$0.000698</div>
                    <div className="text-xs font-semibold text-rose-500" id="pxChg">▼ 65.93%</div>
                  </div>

                  <div className="flex-1 mt-3 relative">
                    <svg id="priceSvg" viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full" style={{cursor:'crosshair'}}>
                      <defs>
                        <linearGradient id="pxFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.16" />
                          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      <line id="crossV" className="chart-crosshair" x1="0" y1="0" x2="0" y2="40" stroke="rgba(0,0,0,.12)" strokeWidth="0.3" opacity="0" />
                      <path d="M0 20 H100" stroke="rgba(0,0,0,0.08)" strokeDasharray="3 3" strokeWidth="0.7" />

                      <path id="pxArea" d="M0,40 L0,22 L6,19 L12,24 L18,15 L24,17 L30,21 L36,26 L42,24 L48,28 L54,27 L60,31 L66,29 L72,33 L78,32 L84,34 L90,33 L96,35 L100,34 L100,40 Z" fill="url(#pxFill)">
                        <animate id="areaAnim" attributeName="d" dur="0.48s" fill="freeze" begin="indefinite" />
                      </path>

                      <path id="pxLine" d="M0,22 L6,19 L12,24 L18,15 L24,17 L30,21 L36,26 L42,24 L48,28 L54,27 L60,31 L66,29 L72,33 L78,32 L84,34 L90,33 L96,35 L100,34" fill="none" stroke="var(--accent)" strokeWidth="0.55" strokeLinecap="round" strokeLinejoin="round">
                        <animate id="lineAnim" attributeName="d" dur="0.48s" fill="freeze" begin="indefinite" />
                      </path>

                      <circle id="priceDot" cx="50" cy="20" r="0.9" fill="var(--accent)">
                        <animate attributeName="r" values="0.9;1.6;0.9" dur="1.4s" repeatCount="indefinite" />
                      </circle>

                      <g id="hoverPriceGroup" opacity="0">
                        <rect id="hoverPriceBg" className="chart-label-bg" x="0" y="0" rx="2" ry="2" width="14" height="4" fill="rgba(0,0,0,.75)" />
                        <text id="hoverPrice" x="0" y="0" fill="#fff" fontSize="1.6" fontWeight="800"></text>
                      </g>
                    </svg>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[var(--border-soft)] flex items-center justify-center gap-2 flex-wrap" id="tfRow">
                    <button className="tf-btn is-active" data-tf="1m">1m</button>
                    <button className="tf-btn" data-tf="5m">5m</button>
                    <button className="tf-btn" data-tf="15m">15m</button>
                    <button className="tf-btn" data-tf="1h">1h</button>
                    <button className="tf-btn" data-tf="4h">4h</button>
                    <button className="tf-btn" data-tf="1d">1d</button>
                    <button className="tf-btn" data-tf="all">All</button>
                  </div>
                </div>
              </div>

              <div className="tab-panel hidden" data-panel="tx">
                <div id="txList" className="space-y-2 text-xs"></div>
                <div className="flex justify-between items-center mt-3 text-xs">
                  <button id="txPrev" className="pill">Prev</button>
                  <div id="txPages" className="flex gap-1 flex-wrap justify-center"></div>
                  <button id="txNext" className="pill">Next</button>
                </div>
              </div>

              <div className="tab-panel hidden" data-panel="holders">
                <div id="holderList" className="space-y-2 text-xs"></div>
                <div className="flex justify-between items-center mt-3 text-xs">
                  <button id="hPrev" className="pill">Prev</button>
                  <div id="hPages" className="flex gap-1 flex-wrap justify-center"></div>
                  <button id="hNext" className="pill">Next</button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[var(--border-soft)]">
              <div className="text-sm font-semibold mb-2">About NEXA</div>
              <p className="text-sm text-[var(--subtext)] leading-relaxed">NEXA is a creator‑led instant token launched with a fixed 15 BNB bonding cap. Designed to demonstrate SafuPad's premium instant launch mechanics.</p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="pill">Website</span>
                <span className="pill">X</span>
                <span className="pill">Telegram</span>
              </div>
            </div>

          </div>
        </div>

        <aside className="safu-section lg:sticky lg:top-24" id="rightPanel">
          <div className="safu-card mb-4">
            <div className="font-semibold mb-2">Creator</div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--surface-soft)] border border-[var(--border-soft)] flex items-center justify-center font-black">NX</div>
              <div className="min-w-0">
                <div className="text-sm font-black truncate">nexa.safu</div>
                <div className="text-[11px] text-[var(--subtext)]">Trust score: <span className="text-green-500 font-bold">92%</span></div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="font-semibold">Buy / Sell</div>
            <span className="pill">15 BNB cap</span>
          </div>

          <div className="mt-4 flex gap-2" id="tradeTabs">
            <button className="tab-btn is-active w-full" data-trade="buy">Buy</button>
            <button className="tab-btn w-full" data-trade="sell">Sell</button>
          </div>

          <div className="mt-4" id="tradeBox">
            <div className="flex justify-between items-center mb-2 gap-3">
              <div className="text-xs font-semibold text-[var(--subtext)]" id="amountLabel">Amount (BNB)</div>
              <div className="flex gap-1" id="currencyToggle">
                <button className="pill is-active" data-currency="BNB">BNB</button>
                <button className="pill" data-currency="USD1">USD1</button>
              </div>
            </div>

            <input id="amountInput" type="number" min="0" step="0.01" className="w-full rounded-xl border border-[var(--border-soft)] p-3 bg-[var(--surface)]" defaultValue={1} />

            <div className="grid grid-cols-4 gap-2 mt-3" id="quickBtns">
              <button className="pill" data-pct="25">25%</button>
              <button className="pill" data-pct="50">50%</button>
              <button className="pill" data-pct="75">75%</button>
              <button className="pill" data-pct="100">100%</button>
            </div>

            <input id="amountSlider" type="range" min="0" max="15" step="0.01" defaultValue={1} className="w-full mt-4" />

            <div className="text-[11px] text-[var(--subtext)] mt-2" id="previewText">
              You receive ≈ <span id="nxraOut" className="font-semibold">125,000</span> NXRA
            </div>
          </div>

          <button id="actionBtn" className="hero-btn w-full mt-4 bg-[var(--text)] text-[var(--bg)] transition-all hover:scale-[1.02] hover:shadow-xl">Buy NXRA</button>

          <div className="mt-5 text-xs text-[var(--subtext)] space-y-1 border-t border-[var(--border-soft)] pt-4" id="feeBreakdown">
            <div className="flex justify-between"><span>Trading fee</span><span>2%</span></div>
            <div className="flex justify-between"><span>Creator</span><span>1%</span></div>
            <div className="flex justify-between"><span>InfoFi</span><span>0.6%</span></div>
            <div className="flex justify-between"><span>Platform</span><span>0.1%</span></div>
            <div className="flex justify-between"><span>EduFi</span><span>0.3%</span></div>
          </div>
        </aside>
      </main>
    </div>
  )
}
