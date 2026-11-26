# Personal finance / budgeting apps in Asia and emerging markets (state as of Nov 2026) — analogues for Mongolia

> Method note for the report writer: 25 tool calls (search-heavy). Two primary hosts (corp.moneyforward.com, support.google.com) were blocked by this session's network settings, so Money Forward IR and the Google Play policy page could NOT be opened directly; the facts from them below come from search-result extracts only. Most figures are from search-result summaries of the linked pages, not full-page reads — treat any number marked "(snippet)" as needing a primary-source check before it goes into a headline. Anything I know only from background knowledge and could not source this session is placed under "Gaps" and labelled "unverified background".

## 1. How does each app capture transactions (SMS/push parsing, statement import, receipt/QR, scraping, official APIs)?

### Takeaway
Outside markets with a regulated data-sharing rail (Korea MyData, India Account Aggregator, Japan's bank-API regime), the working capture stack is a patchwork: SMS/push-notification parsing on Android, e-statement/history-file upload (increasingly with AI/OCR), receipt photo capture, and manual "3-second" entry. Every sourced app combines several of these; none relies on one channel.

### Cited Findings

**Japan**
- Zaim (now branded 家計簿くふうZaim, operated by Kufu Company): receipt photo capture reads total, store name, category, line items and date, with no monthly cap on receipt scans; it advertises links to financial services, with counts differing by article date (1,321 in one, 2,459 in another). (snippet) — [App Store JP](https://apps.apple.com/JP/app/id445850671); [app-liv](https://app-liv.jp/5293/); [DIME](https://dime.jp/genre/1934489)
- Zaim handles PayPay not by live link but by importing the transaction-history file exported from the PayPay app — i.e. even in Japan, the dominant wallet is covered by file import rather than an API. (snippet) — [App Store JP](https://apps.apple.com/JP/app/id445850671)
- Money Forward ME: a Money Forward presentation hosted by Japan's Ministry of Finance cites ME's cumulative downloads/web registrations and linked-service count as of Nov 2025 (exact values not extracted). — [MOF seminar PDF](https://www.mof.go.jp/pri/research/seminar/fy2026/lm20261026.pdf)

**South Korea**
- Banksalad's business is built on the MyData (regulated API data-sharing) regime; its revenue compounded ~104% annually in the two years after MyData was introduced. — [Digital Today](https://www.digitaltoday.co.kr/en/view/44435/banksalad-2025-revenue-26-billion-won-up-77-percent); [Asia Economy](https://www.asiae.co.kr/en/article/2026040114150615967)

**India**
- Walnut (now axio) was an SMS-parsing expense tracker; the free tracker now sits inside a lending platform (Axio Pay Later, personal loans, fixed deposits). — [getfinny.app overview of SMS trackers, 2026](https://getfinny.app/blog/sms-expense-tracking-app); [axio App Store listing](https://apps.apple.com/in/app/axio-bnpl-personal-loan/id6449531839)
- Fold Money uses the RBI Account Aggregator (AA) framework instead: tracks bank accounts, cards, UPI spends, investments and net worth automatically with "no password sharing and no SMS reading"; data is shared directly by regulated institutions on user consent. — [Fold App Store listing](https://apps.apple.com/in/app/fold-money/id1626994334)
- AA scale: Sahamati's five-year update (2 Sep 2026) says 500M+ fulfilled consents and 310M+ linked accounts; the government's update as of 31 Mar 2026 reports 284.6M linked accounts; a June 2026 report says 45 crore (450M) consents. 1,100+ regulated entities live; 2.8B+ financial accounts enabled for sharing. — [Sahamati](https://sahamati.org.in/?p=1274421); [Dept. of Financial Services](https://financialservices.gov.in/account-aggregator-framework); [newkerala/IANS](https://www.newkerala.com/news/a/indias-account-aggregator-ecosystem-facilitates-nearly-38-crore-263.htm); [Entrepreneur India](https://india.entrepreneur.com/?p=101740)
- AA is lending-led, not PFM-led: NBFCs accounted for ~60% of AA consents in FY25; Sahamati's H1 FY26 report names personal finance management as a use case alongside lending. — [Business Standard](https://www.business-standard.com/finance/news/nbfcs-lead-account-aggregator-consents-in-fy25-with-60-share-125100600872_1.html); [Sahamati H1 FY26 PDF](https://sahamati.org.in/wp-content/uploads/2026/01/Credit-Reimagined-H1-FY26-Abridged-1.pdf)

**Southeast Asia**
- Money Lover (Finsify, Vietnam): manual entry core plus a paid "Linked Wallet" bank-link service; in 2018 it claimed to be the first mobile app in Asia letting users link ATM cards and auto-record card transactions, covering 15 of Vietnam's largest banks; current listings say linking supports banks in Vietnam, Thailand, Indonesia, Malaysia, India, Hong Kong "and more". — [Vietcetera, Nov 2018](https://vietcetera.com/en/money-lover-a-vietnamese-built-fintech-mobile-app-going-global); [App Store VN](https://apps.apple.com/vn/app/id486312413)
- Finku (Indonesia, YC-backed) explicitly positions as "AI powered personal finance app focused on geographies without Open Banking, such as Indonesia". Documented capture: (a) upload bank e-statements via the "Catat Pakai AI" menu, transactions extracted automatically; (b) "connect bank account or e-wallet" for automatic recording (technical method not disclosed). — [Y Combinator](https://ycombinator.com/companies/finku); [App Store ID](https://apps.apple.com/id/app/finku-budget-money-manager/id1587320325)

**Russia / CIS**
- ZenMoney (Дзен-мани, founded 2010): recognises bank SMS and push notifications (recent App Store release notes mention improved SMS and push recognition), plus bank card-operation import and data import/export. — [App Store RU](https://apps.apple.com/ru/app/905934786); [startpack](https://startpack.ru/application/zenmoney); [a2is](https://a2is.ru/catalog/uchyot-lichnykh-finansov/zen-money)
- User-reported limitation of SMS capture: the SMS amount is not always the final charge because it can change by clearing time (FX, holds). Users also say SMS parsing was what made regular tracking sustainable for them. — [Habr comments](https://habr.com/ru/articles/366759/comments/)
- Receipt scanning exists in Drebedengi, FinPix and ZenMoney; in some apps it is free, in others premium-gated. — [Sravni.ru](https://www.sravni.ru/text/5-udobnyh-funkczij-v-prilozheniyah-dlya-uchyota-lichnyh-rashodov/); [Lifehacker.ru](https://lifehacker.ru/5-app-check/)
- CoinKeeper: reviewed as auto-recognising SMS from any bank; a catalogue lists import from "more than a dozen online-banking systems". — [Unisender](https://www.unisender.com/ru/blog/poleznye-prilozheniya-dlya-vedeniya-byudzheta/); [crmindex](https://crmindex.ru/services/coinkeeper)

**China**
- Shark Jizhang (鲨鱼记账) sells itself on manual speed — "3 seconds to record" — rather than on automation. — [App Store](https://apps.apple.com/app/id1079718756)

**Kazakhstan**
- Kaspi.kz: capture is a non-problem because the super-app is the payment rail — active consumers in Kazakhstan make 77 transactions per month inside Kaspi (reported in FY2025 and again in 2Q 2026 releases). In 3Q 2026 management said its AI assistant "Kasper" is being integrated more deeply into the Super App with the ambition of becoming a "trusted personal assistant for everyday tasks". — [Kaspi 2Q 2026 release](https://finviz.com/news/379689/kaspikz-2q-1h-2026-financial-results); [Kaspi 3Q 2026 release](https://www.morningstar.com/news/globe-newswire/9873197/kaspikz-3q-9m-2026-financial-results); [Kaspi FY2025 PDF](https://ir.kaspi.kz/media/4Q__FY_2025_Financial_Results.pdf)

### Inferences
- Capture-method ladder for a no-open-banking market, from sourced examples: manual fast entry (Shark) -> SMS/push parsing on Android (ZenMoney, CoinKeeper, Walnut) -> statement/history-file upload with AI extraction (Finku, Zaim-PayPay) -> receipt photo (Zaim, Drebedengi) -> regulated API only where the state built it (Banksalad, Fold).
- Finku is the closest structural analogue to a Mongolian app: no open banking, bank/e-wallet-dominated market, and its primary documented automation is AI parsing of uploaded e-statements. Zaim's PayPay file-import shows the same pattern applies to a dominant wallet that will not open an API.
- Where one super-app carries most transactions (Kaspi at 77 tx/user/month), a third-party tracker's capture problem reduces to "get that one app's statement in", but the super-app can also ship analytics/AI assistant itself and has the data natively.

### Gaps
- Money Forward ME's exact linked-institution count and capture architecture (API vs. scraping) were not retrievable (corp.moneyforward.com blocked). Unverified background: MF ME historically used credential-based scraping and moved to bank API contracts after Japan's 2017 Banking Act amendment; links ~2,400+ services.
- Toss, CRED, Jupiter, INDmoney, Spendee, Moni (Indonesia), Suishouji, WeChat/Alipay bill export, Drebedengi: no sourced capture details found this session. Unverified background: CRED parses credit-card statement emails (Gmail access) and SMS; INDmoney/Jupiter use AA plus SMS; Spendee used Salt Edge-style aggregation for bank sync; Suishouji and others import Alipay/WeChat bill CSV exports; Alipay and WeChat Pay both offer built-in monthly bill/categorisation views; Drebedengi supports SMS parsing and bank file import.
- Receipt-QR linked to tax systems: I found no confirmation that ZenMoney/Drebedengi pull itemised data from Russia's FNS via the fiscal QR; one review said FNS gave no third-party API to a different product (Alzex) — [Lifehacker.ru](https://lifehacker.ru/5-app-check/). Not found: any Kazakhstan or Mongolia (e-barimt) analogue. This is a key open question for Mongolia and needs dedicated research.
- No Kazakhstan/Central Asia standalone budgeting app was identified; Kaspi "My Bank" spending-analytics feature details not found in IR material.
- Moni (Indonesia): nothing found at all; could not confirm it exists/operates in 2026.

## 2. User numbers, revenue, pricing, funding; who pivoted and why — what does this say about monetizing pure budgeting?

### Takeaway
No sourced company in this set earns a large business from budgeting alone: the winners monetise financial-product distribution/ads (Banksalad, Toss, CRED, INDmoney), lending (Walnut->axio, Suishouji's former P2P), or B2B SaaS (Money Forward), while pure trackers stay small subscription businesses at roughly US$1–5/month with low-single-digit paid conversion (Money Forward ME ~3.5% on the one figure found).

### Cited Findings

**Japan**
- Money Forward ME: 18.1M+ total users and 640,000 premium paying subscribers; premium-user revenue up 19%, driven by the Aug 2025 price revision. Secondary source, date unstated — treat as unverified. — [secondary post](https://longform.social/post/did:plc:mwi7gtnakn7adnxflkv4wt3y/3mjvnmezsku62)
- ME Standard course price from 5 Aug 2025 (app-store billing): ¥590/month or ¥6,490/year. — [Money Forward ME support notice](https://support.me.moneyforward.com/hc/ja/articles/48081250560409)
- Money Forward group FY11/2025: net sales ¥50.35bn (+25% YoY); SaaS ARR ¥39.33bn (+31.1%); FY11/2024 Business-domain net sales ¥25.25bn (+35%); FY11/2026 net-sales forecast raised to ¥60.5–62.3bn. A strategic JV was signed in July 2025 (partner not named in the extract). (snippet) — [Quartr Q4 2025](https://quartr.com/events/money-forward-inc-3994-q4-2025_FYS5EJnf); [Quartr Q4 2024](https://quartr.com/events/money-forward-inc-3994-q4-2024_FYS5vSSP); [Quartr Q2 2026](https://quartr.com/events/money-forward-inc-3994-q2-2026_FYS5HZqK); [Quartr Q2 2025](https://quartr.com/events/money-forward-inc-3994-q2-2025_FYS5E1E9)
- Zaim premium: ¥480/month or ¥4,800/year; premium removes ads and allows on-demand refresh of bank/card links. (snippet, date unclear) — [DIME](https://dime.jp/genre/1934489)

**South Korea**
- Banksalad 2025: revenue KRW 26bn (+77% from 14.7bn); operating costs KRW 33.6bn (+14%) — i.e. still loss-making at operating level; net loss ex-RCPS accounting items ~KRW 0.6bn (-89%); MAU +22%, ARPU +25%, advertising revenue +175%; "annual profitability in sight". — [Digital Today](https://www.digitaltoday.co.kr/en/view/44435/banksalad-2025-revenue-26-billion-won-up-77-percent); [Asia Economy](https://www.asiae.co.kr/en/article/2026040114150615967)
- Toss (Viva Republica) 2025: consolidated revenue ~KRW 2.7tn (+38%), operating profit KRW 336.0bn (+270%), net profit KRW 201.8bn; Toss Securities was the main driver (segment operating profit KRW 452.1bn). First-ever annual operating profit was 2024 (KRW 90.7bn). App MAU 24.8M in Q1 2025; members >30M at end-2025. — [Digital Today](https://www.digitaltoday.co.kr/en/view/44240/toss-posts-record-2025-revenue-of-2-7-trillion-won); [Asia Economy](https://www.asiae.co.kr/en/article/2025032816301145058); [Toss feed Q1 2025](https://toss.im/tossfeed/article/RevenueQ12025); [Digital Today JP](https://www.digitaltoday.co.kr/jp/view/44255/toss-posts-record-2025-revenue-of-2-7-trillion-won)
- Toss was reported in Jan 2026 to plan a US IPO at >US$10bn valuation. — [Biometric Update](https://www.biometricupdate.com/202601/toss-gets-lift-from-biometric-retail-payments-plans-2026-us-ipo); [DealStreetAsia](https://media.dealstreetasia.com/stories/s-korean-finance-app-toss-mulls-us-listing-next-year-at-over-10b-valuation-450410)

**India**
- Walnut was acquired by lender Capital Float in Aug 2018; Capital Float, Walnut and Walnut 369 were later unified under the "axio" brand (CapFloat Financial Services, an RBI-registered NBFC) covering checkout finance, credit and money management. — [CB Insights](https://www.cbinsights.com/company/walnut/financials); [PYMNTS](https://www.pymnts.com/?p=535795); [axio founder blog](https://www.axio.co.in/blogs/making-credit-worthy-from-capital-float-to-axio)
- A competitor describes Walnut as having become "a lending funnel" (rival's marketing opinion). — [WalletLoop](https://walletloop-marketing.pages.dev/compare)
- Fold Money: tracking free; Fold Plus ₹349/month, ₹799/quarter, ₹999/year; only funding found is US$2.5M seed (9 Feb 2022, third-party tracker). — [App Store IN](https://apps.apple.com/in/app/fold-money/id1626994334); [Lapaas Startup Atlas](https://lapaasvoice.com/startup/fold/)
- CRED FY25: operating revenue ₹2,735 crore (+16%); operating loss ₹298 crore (-51%); ~45% of active members used 3+ products; ARPU ~₹2,000; Inc42 reports net loss ₹1,460.6 crore (different basis). Raised US$72M at US$3.64bn valuation (a down-round vs. prior peak, per headline "valuation dip"). — [Entrackr](https://entrackr.com/news/cred-reports-rs-2735-cr-revenue-in-fy25-operating-losses-fall-51-11058243); [Inc42](https://inc42.com/company/cred/financials/); [NewsBytes](https://www.newsbytesapp.com/news/business/cred-raises-72-million-at-364b-valuation-fy25-results-show-profitability-path/tldr)
- INDmoney FY25: operating revenue ₹164 crore (2.3x from ₹70 crore); total revenue ₹214 crore; cash loss widened to ₹76 crore. — [Entrackr](https://entrackr.com/news/indmoneys-revenue-jumps-23x-to-rs-164-cr-in-fy25-10965136)
- Jupiter: raised ₹115 crore fresh capital, revenue doubled in FY25 (figure not given), 3M+ customers with ~60% actively engaging. — [Entrepreneur India](https://india.entrepreneur.com/news-and-trends/jupiter-secures-rs115-crore-fresh-capital-records-double/498969)

**Southeast Asia**
- Money Lover: 5M+ downloads worldwide (2018-era figure; one profile says >1M users). Pricing differs by market: small monthly fee for US users vs. one-time fee for Vietnamese users. Vietnam App Store: lifetime Premium 599,000đ; Linked Wallet (bank sync) sold separately at 49,000đ/month or 349,000đ/year and NOT included in lifetime Premium. Lifetime Premium is €22.99 (Ireland) / US$19.99 elsewhere. — [Vietcetera 2018](https://vietcetera.com/en/money-lover-a-vietnamese-built-fintech-mobile-app-going-global); [TopDev profile](https://topdev.vn/amp/companies/moneylover-2-88649); [App Store VN](https://apps.apple.com/vn/app/id486312413); [App Store IE](https://apps.apple.com/ie/app/id486312413?l=en-gb)
- Finku: 350,000+ users (undated, at time of seed round); seed round reported as US$2.8M (Infokomputer headline "US$2,8 juta"; ThePaypers headline renders it "USD 28 mln" — almost certainly a decimal-comma error, treat US$2.8M as correct but unconfirmed). Pre-seed backers included Global Founders Capital and 500 Startups; at pre-seed it was also "entering digital bookkeeping service". Named App Store "Best Hidden Gem App 2025" per its listing; registered with OJK, member of AFTECH/AFPI. No shutdown/pivot reports found. — [ThePaypers](https://thepaypers.com/fintech/news/finku-secures-usd-28-mln-seed-funding); [Infokomputer](https://infokomputer.grid.id/read/123279305/startup-finku-dapat-suntikan-dana-segar-us28-juta); [DailySocial](https://en.dailysocial.id/post/finku-personal-finance-app-pre-seed-global-founders-capital-500-startups); [App Store ID](https://apps.apple.com/id/app/finku-budget-money-manager/id1587320325)

**Russia / CIS**
- ZenMoney premium: US$1.99/month, US$11.99/year (Ukraine store, 2025); ¥500/month (Japan); HK$148/year; an aggregator lists a RUB 99/month starting price (possibly stale). — [App Store UA](https://apps.apple.com/ua/app/%D0%B4%D0%B7%D0%B5%D0%BD-%D0%BC%D0%B0%D0%BD%D1%96-%D0%BE%D0%B1%D0%BB%D1%96%D0%BA-%D0%B2%D0%B8%D1%82%D1%80%D0%B0%D1%82/id905934786?l=uk); [App Store JP](https://apps.apple.com/jp/app/id905934786); [App Store HK](https://apps.apple.com/hk/app/id905934786); [a2is](https://a2is.ru/catalog/uchyot-lichnykh-finansov/zen-money)
- CoinKeeper Platinum (App Store RU, ©2025): RUB 749/year, RUB 379/6 months, RUB 449/3 months. A 2026 guide exists purely on how to pay for CoinKeeper from Russia given payment restrictions. — [App Store RU](https://apps.apple.com/ru/app/coinkeeper/id1335547405?l=en); [DTF 2026](https://dtf.ru/howto/5031989-kak-oplatit-coinkeeper-v-rossii)
- Peer price points: 1Money premium RUB 199/3 months, RUB 599/year, RUB 1,199 lifetime. — [Lifehacker.ru](https://lifehacker.ru/5-app-check/)

**China**
- Suishouji (随手记, Sui Technology): ~100M cumulative users by 2014 (group 120M with Kaniu); later marketed as "used by 220M people" (promotional). Monetisation thesis was "financial supporting services" — using users' financial data to route them to financial institutions ("we don't do the transaction, we guide it; the bank completes it"), then own fixed-income wealth products and P2P lending. In April 2020 it announced a "strategic transformation" and wind-down of its P2P business, with disputes over repaying lenders; it also tried an SME edition with a WeChat mini-program store. — [iFanr interview](https://www.ifanr.com/289968.md); [Sohu, 2020](https://www.sohu.com/a/389136189_119666); [Jiemian](https://www.jiemian.com/article/4293065.html); [36Kr](https://www.36kr.com/p/1641922297857)
- Shark Jizhang: subscription ¥15/month, ¥38/quarter, ¥148/year. Usage estimates conflict wildly: Analysys put active users at ~1.09M in Q1 2020 (-20.1% QoQ, "second tier"); a third-party app-intelligence page shows ~15M MAU and 115.8M cumulative installs (undated estimate). A 2020 report judged its user stickiness and monetisation weak; monetisation attempts included a community, shopping cashback, and lead-gen for brokerage account opening, with much traffic sent to fortune-telling pages. MIIT named it in Aug 2020 for improper use of personal information. CEO/founder: Yang Lei. — [App Store](https://apps.apple.com/us/app/-/id1079718756); [Lanjinger 2020](https://www.lanjinger.com/d/143442); [AppGoblin](https://appgoblin.info/apps/1079718756/trends); [36Kr PitchHub](https://pitchhub.36kr.com/project/1679829142082310)
- An unsourced review claims China's bookkeeping-app users exceed 300M — unverifiable. — [163.com](https://c.m.163.com/news/a/KOS251RK0556L2ZU.html)

**Kazakhstan**
- Kaspi.kz 2Q 2026: revenue +15% YoY to KZT 1.1tn, adjusted EBITDA +5% to KZT 397bn (1H figures per release). 1Q 2026: payments TPV +14% YoY, active users +6.5% YoY, take rate 1.03% (from 1.09%), 20.4M active buyers (+3%). 4Q 2025: monthly active consumers +15% YoY. (Definitions differ across lines; do not combine.) — [Kaspi 2Q 2026](https://finviz.com/news/379689/kaspikz-2q-1h-2026-financial-results); [Freedom Broker 1Q 2026 note](https://fbroker.kz/en/analytics/analytics-article/kaspikz-rezultaty-1-go-kvartala-2026-goda-ru-2); [Kaspi FY2025 PDF](https://ir.kaspi.kz/media/4Q__FY_2025_Financial_Results.pdf)

### Inferences
- Paid conversion benchmark: 640k / 18.1M ≈ 3.5% for Money Forward ME after ~14 years and in a high-income market; at ¥590/month that is roughly ¥4–4.5bn/year of consumer subscription revenue at most — under 10% of group sales of ¥50bn, most of which is B2B SaaS (ARR ¥39bn). Pure consumer PFM is the minority business even at Japan's category leader. (Inference from the unverified secondary subscriber figure.)
- Banksalad needed a state-mandated data rail (MyData) plus ads/product referral to reach KRW 26bn revenue and is still below operating break-even (costs KRW 33.6bn) roughly a decade in. Its fastest-growing line is advertising (+175%), not subscriptions.
- The Indian pattern is "tracker as top of funnel": Walnut -> lender; CRED's ARPU depends on cross-sell (45% using 3+ products); INDmoney earns from brokerage/investing. Fold, the pure-play, has raised only ~US$2.5M and charges ~US$12/year.
- China shows both failure modes: Suishouji monetised via lending and was hit by the P2P collapse (regulatory/credit risk); Shark stayed "pure" and ended up with weak ads/lead-gen and a privacy citation.
- Emerging-market price anchors for premium: roughly US$12/year (ZenMoney, Fold ₹999, CoinKeeper RUB 749) up to ~US$24 lifetime (Money Lover). Money Lover separates recurring-cost bank sync (subscription) from one-time feature unlock (lifetime) — a sensible structure where sync has a marginal cost.
- For a 3.5M-population market: even at an optimistic 10% install penetration of adults and 3.5% paid conversion, subscriber counts would be in the low thousands to ~10k; at ~US$1–2/month that is a five- to low-six-figure USD annual revenue line. Subscription alone will not carry a team; referral/partnership revenue or a B2B line is needed. (Researcher arithmetic, not sourced.)

### Gaps
- Money Forward Home-domain revenue and official premium-subscriber count: not retrievable (IR host blocked); the 640k/18.1M figure is from an undated secondary post.
- Toss 2026 interim: a secondary outlet reported H1 2026 revenue KRW 1.89tn (+53.2%) and operating profit KRW 246.1bn, and another report said the Nasdaq listing was "put on hold"; I could not pin either to a specific reliable URL — verify before use.
- Banksalad MAU absolute number, funding/valuation current status, IPO plans: not found. Unverified background: Banksalad pivoted from card-recommendation/asset management to MyData-based product marketplace and health data; had layoffs in 2022–23.
- Zaim, ZenMoney, CoinKeeper, Drebedengi, Spendee, Money Lover (current), Finku (2026) user numbers and revenue: no reliable figures found. Drebedengi pricing not found. Spendee: nothing found this session. Unverified background: Zaim ~10M downloads; Spendee was acquired by Cleevio/others and is a small subscription business; ZenMoney claims several million registered users.
- Jupiter FY25 revenue figure; CRED member count; INDmoney user count: not found.
- Sensor Tower estimates: none accessed.
- "Money Forward pivoted to B2B SaaS" is supported by the revenue mix inference above but I found no sourced management statement on why.

## 3. What acquisition and retention tactics worked (gamification, cute design, community, cashback, literacy content)?

### Takeaway
Sourced evidence is thin and mostly negative: speed-of-entry and SMS automation are the retention features users actually credit, while Shark Jizhang's community/cashback add-ons were judged weak; the scaled players retain through transaction utility (payments, bill pay, rewards) rather than through budgeting features.

### Cited Findings
- Speed as the hook: Shark Jizhang's App Store title is literally "3 seconds quick bookkeeping". — [App Store](https://apps.apple.com/app/id1079718756)
- Automation as the habit-enabler: Habr users state SMS parsing is what let them keep records regularly. — [Habr](https://habr.com/ru/articles/366759/comments/)
- Shark Jizhang used an in-app community and shopping cashback for acquisition/engagement, plus brokerage lead-gen; a 2020 trade report judged scale and stickiness weak and the lead-gen "messy". — [Lanjinger 2020](https://www.lanjinger.com/d/143442)
- CRED's engagement model is multi-product rewards: ~45% of active members use 3+ products, ARPU ~₹2,000. — [Entrackr](https://entrackr.com/news/cred-reports-rs-2735-cr-revenue-in-fy25-operating-losses-fall-51-11058243)
- Finku pitches financial-literacy and increasingly personalised services, and launched an AI auto-budgeting feature framed around "70% of Indonesians find it hard to save". — [Kontan](https://keuangan.kontan.co.id/news/dorong-literasi-keuangan-finku-kembangkan-layanan-yang-makin-dipersonalisasi); [Fortune IDN](https://www.fortuneidn.com/finance/70-warga-ri-sulit-menabung-finku-hadirkan-fitur-auto-budgeting-ai-00-ccw2k-qm5klh)
- Platform editorial featuring as distribution: Finku cites App Store "Best Hidden Gem App 2025". — [App Store ID](https://apps.apple.com/id/app/finku-budget-money-manager/id1587320325)
- Localised pricing as acquisition: Money Lover charged Vietnamese users a one-time fee and Americans a monthly fee; it reported 750,000 new active users/month in 2018. — [Vietcetera 2018](https://vietcetera.com/en/money-lover-a-vietnamese-built-fintech-mobile-app-going-global)
- Kaspi's engagement comes from being the daily transaction surface (77 tx/user/month) and is now layering an AI assistant on top. — [Kaspi 3Q 2026](https://www.morningstar.com/news/globe-newswire/9873197/kaspikz-3q-9m-2026-financial-results)
- Banksalad grew MAU 22% and ARPU 25% in 2025 with ad revenue +175% — growth came with the MyData-driven product, not a pure ledger. — [Asia Economy](https://www.asiae.co.kr/en/article/2026040114150615967)

### Inferences
- The durable retention lever in these markets is reducing entry effort (automation or 3-second entry). Community, cashback and content appear as secondary layers and have at best mixed sourced evidence.
- Apps that retain at scale (Toss, Kaspi, CRED) do so because users must open them to pay; a standalone tracker needs a comparable recurring trigger (e.g. salary-day statement import, weekly digest, tax-receipt lottery tie-in).
- App Store/Play editorial featuring is a realistic, cheap acquisition channel in a small market with few local-language finance apps.

### Gaps
- No sourced data on streaks/gamification effectiveness, Shark Jizhang's mascot/cute-design effect on Gen-Z adoption, Toss's point-earning mini-features, or lottery/cashback mechanics. Unverified background: Toss is widely reported to drive DAU with step-counter rewards, "tap to earn points" and quizzes; Shark and peers (e.g. 一木记账, 松鼠记账) use mascots, skins and check-in streaks aimed at students; Zaim/Money Forward lean on household-budgeting media content. These need a dedicated source pass.
- No retention/cohort numbers (D30, churn) for any app were found.

## 4. Apple/Google restrictions on SMS reading and notification access; iOS workarounds

### Takeaway
Google Play restricts READ_SMS to default-handler apps plus a short list of reviewed exceptions, and at least one personal-finance developer reports being rejected; iOS offers no inbox access at all, so iOS-capable apps fall back to statement/file upload, receipt photos, and regulated APIs.

### Cited Findings
- Google Play restricts SMS and Call Log permission groups; apps that don't qualify must remove the permissions from the manifest. Permitted core uses are default SMS, Phone or Assistant handler, and the app must be the registered default before prompting. — [Google Play policy (snippet; page not directly opened)](https://support.google.com/googleplay/android-developer/answer/10208820?hl=en)
- Google "may provide a temporary exception" for non-default apps when the permission enables listed core functionality; the exception table includes an entry "SMS-based financial transactions" (READ_SMS, RECEIVE_MMS, RECEIVE_SMS, RECEIVE_WAP_PUSH), and the extract shows an "(effective January 27, 2027)" marker adjacent to it — implying a policy revision is scheduled; exact meaning unverified. — [Google Play policy (snippet)](https://support.google.com/googleplay/android-developer/answer/10208820?hl=en)
- Google prohibits deriving SMS/Call Log data via "alternative methods (including other permissions, APIs, or third-party sources)". — [Google Play policy (snippet)](https://support.google.com/googleplay/android-developer/answer/10208820?hl=en)
- Developer anecdote: a personal-finance app (FinVantage) was told SMS permissions need an approved Restricted Permission Declaration Form and that "reading SMS for financial data" did not qualify. Single anecdote. — [DEV Community](https://dev.to/zeta_byte/ive-been-working-on-a-personal-finance-app-called-finvantage-and-i-recently-hit-a-roadblock-4mjh)
- Background on the original 2019 rollout of the restriction. — [Android Developers Blog, Jan 2019](https://android-developers.googleblog.com/2019/01/reminder-smscall-log-policy-changes.html); [XDA](https://www.xda-developers.com/google-restriction-sms-call-log-permissions/)
- Despite this, shipping apps still advertise the feature: ZenMoney release notes cite improved SMS and push-notification recognition; CoinKeeper is reviewed as recognising any bank's SMS. — [App Store RU](https://apps.apple.com/ru/app/905934786); [Unisender](https://www.unisender.com/ru/blog/poleznye-prilozheniya-dlya-vedeniya-byudzheta/)
- iOS-compatible alternatives seen in the field: AA consent with "no SMS reading" (Fold); e-statement upload with AI (Finku); wallet history-file import (Zaim/PayPay); receipt photos (Zaim). — [Fold](https://apps.apple.com/in/app/fold-money/id1626994334); [Finku](https://apps.apple.com/id/app/finku-budget-money-manager/id1587320325); [Zaim](https://apps.apple.com/JP/app/id445850671)

### Inferences
- SMS reading on Play is a review risk, not a dependable foundation: build the product so statement upload / share-sheet import is the cross-platform baseline and Android SMS or notification-listener capture is an optional accelerator that can be removed without breaking the app.
- The "no alternative methods" clause plausibly also puts notification-listener scraping of SMS content in a grey zone; parsing bank-app push notifications (not SMS) is a different data source but still needs a prominent-disclosure flow. (Interpretation, not a sourced ruling.)
- Privacy enforcement risk is real outside Google too: Shark Jizhang was cited by China's MIIT in 2020 — [Lanjinger](https://www.lanjinger.com/d/143442).

### Gaps
- Could not open the Google policy page to confirm exact current exception wording (older versions listed "SMS-based money management" for budget/expense tracking apps — unverified background) or what changes on 27 Jan 2027. This must be checked directly before committing to SMS capture.
- iOS specifics are unverified background, not sourced this session: iOS gives third-party apps no SMS inbox or other-apps' notification access; workarounds used in the field include (a) Shortcuts automations triggered on message/Wallet transaction that pass text to the app via App Intents, (b) SMS-filter extensions (ILMessageFilter, unknown senders only, no data egress except to a declared server), (c) share-sheet/"Open in" for PDF statements, (d) email-forwarding of bank alerts/statements, (e) FinanceKit (Apple Wallet data, limited countries). No source confirming which of these the profiled apps use.
- Whether ZenMoney/CoinKeeper hold a Play exception or distribute SMS features via RuStore/APK builds: not found.

## 5. Lessons for a small market (3.5M population) where banks and super-apps dominate

### Takeaway
The sourced analogues say: design capture around what the dominant bank/wallet apps already export (statements, history files, push/SMS), keep the tracker cheap or free, and plan from day one for revenue from something other than subscriptions — while expecting the incumbent super-app to ship good-enough analytics and AI assistants itself.

### Cited Findings
- Finku is building specifically for "geographies without Open Banking", with AI e-statement upload as a first-class feature, and reached 350k+ users on ~US$2.8M seed in a 280M-population country. — [Y Combinator](https://ycombinator.com/companies/finku); [ThePaypers](https://thepaypers.com/fintech/news/finku-secures-usd-28-mln-seed-funding)
- Even in Japan, the dominant wallet (PayPay) is integrated via user-exported history file. — [Zaim App Store](https://apps.apple.com/JP/app/id445850671)
- The super-app owns the data and the relationship: Kaspi at 77 transactions/user/month, and is moving its AI assistant Kasper toward a "trusted personal assistant" role. — [Kaspi 2Q 2026](https://finviz.com/news/379689/kaspikz-2q-1h-2026-financial-results); [Kaspi 3Q 2026](https://www.morningstar.com/news/globe-newswire/9873197/kaspikz-3q-9m-2026-financial-results)
- State-built data rails are what unlocked aggregator businesses: Korea's MyData (Banksalad revenue CAGR ~104% post-MyData) and India's AA (500M+ consents by Sep 2026) — and AA usage is ~60% NBFC lending, not PFM. — [Digital Today](https://www.digitaltoday.co.kr/en/view/44435/banksalad-2025-revenue-26-billion-won-up-77-percent); [Sahamati](https://sahamati.org.in/?p=1274421); [Business Standard](https://www.business-standard.com/finance/news/nbfcs-lead-account-aggregator-consents-in-fy25-with-60-share-125100600872_1.html)
- Trackers get absorbed by lenders: Walnut -> Capital Float/axio. Lending-led monetisation carries regulatory tail risk: Suishouji's 2020 P2P exit. — [PYMNTS](https://www.pymnts.com/?p=535795); [Sohu](https://www.sohu.com/a/389136189_119666)
- Even the category leader in a 125M-population rich market gets most revenue from B2B: Money Forward FY11/2025 sales ¥50.35bn with SaaS ARR ¥39.33bn. — [Quartr](https://quartr.com/events/money-forward-inc-3994-q4-2025_FYS5EJnf)
- Low local price points are the norm; Money Lover localises (one-time fee in Vietnam) and separates paid bank-sync from lifetime premium. — [Vietcetera](https://vietcetera.com/en/money-lover-a-vietnamese-built-fintech-mobile-app-going-global); [App Store VN](https://apps.apple.com/vn/app/id486312413)
- Payment-rail fragility in sanctioned/peripheral markets affects subscription collection (2026 guide on how to pay for CoinKeeper from Russia). — [DTF](https://dtf.ru/howto/5031989-kak-oplatit-coinkeeper-v-rossii)

### Inferences
- Capture strategy for Mongolia by analogy: (1) AI parsing of bank/wallet statement exports (PDF/Excel) as the cross-platform baseline (Finku, Zaim-PayPay); (2) Android SMS/push parsing as an opt-in accelerator with Play-policy risk (ZenMoney, Walnut); (3) receipt capture, ideally tied to the national e-receipt system if it exposes itemised data (unverified — see Gaps); (4) ultra-fast manual entry as the floor (Shark).
- With only a handful of banks and one or two super-apps, parser coverage is cheap (few formats) — a structural advantage of a small concentrated market versus India/Indonesia. But the same concentration means one incumbent adding "spending analytics + AI assistant" (as Kaspi is doing) can neutralise the standalone value proposition; the defensible wedge is cross-institution view (all banks + wallets + cash in one place), which no single incumbent will offer.
- Business model: subscription at ~US$1–2/month as a baseline, but plan for a second engine — referral of financial products (Banksalad/INDmoney model), a B2B/SME bookkeeping line (Money Forward; Finku's early bookkeeping move; Suishouji SME edition), or becoming an acquisition target/partner for a bank or lender (Walnut). Avoid balance-sheet lending without a licence and risk capacity (Suishouji).
- Lobbying/aligning with any central-bank open-banking initiative matters disproportionately: both scaled aggregators in this set exist because of regulation, not scraping.
- In-app-purchase reliance has payment-rail risk in peripheral markets; consider local payment methods (bank transfer/QR) for subscriptions where store policies allow.

### Gaps
- No Mongolia-specific sourcing was in scope here (bank app export formats, e-barimt receipt API availability, Bank of Mongolia open-banking status, super-app feature sets) — the inferences above are analogies only.
- No sourced example of a successful standalone PFM in a sub-10M-population market was found (Kazakhstan search surfaced only Kaspi). Whether any exists (e.g. Georgia, Armenia, Baltics, Uzbekistan) is an open question.
- No sourced evidence on bank-partnership/white-label PFM deals (app sold to banks) in these markets; Money Forward does this in Japan per unverified background (Money Forward X).
