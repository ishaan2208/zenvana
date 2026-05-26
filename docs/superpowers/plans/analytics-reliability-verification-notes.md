# Analytics Reliability Verification Notes

Date: 2026-05-26
Scope: Inline execution in main `zenvana` repo

## Automated Checks

- `npm --prefix "/Users/ishaanbajaj/Desktop/staysystems/zenvana" run test` -> PASS (6 files, 34 tests)
- `npm --prefix "/Users/ishaanbajaj/Desktop/staysystems/zenvana" run lint` -> PASS (2 pre-existing warnings in `src/components/GoogleAdsTag.tsx`)
- `npm --prefix "/Users/ishaanbajaj/Desktop/staysystems/zenvana" run test:typecheck` -> PASS
- `npm --prefix "/Users/ishaanbajaj/Desktop/staysystems/zenvana" run build` -> PASS (validated with unrestricted network access)

## Manual Scenario Checklist (To Run Against Dev/Staging)

- [ ] Single-room pay-at-property writes `booking_completed` and corresponding audit row
- [ ] Single-room pay-now writes `payment_initiated` and `booking_completed` server events
- [ ] Single-room pay-now failure writes `payment_failed` server event
- [ ] Multi-room pay-later writes `booking_completed` and corresponding audit row
- [ ] Multi-room pay-now success/failure writes server-side payment outcome events
- [ ] Internal analytics dashboard shows recent audit signals with reason codes
- [ ] Global pageview tracking records marketing routes and excludes `/internal/*` and `/api/*`
