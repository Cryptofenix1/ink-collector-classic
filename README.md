# Ink Collector OG

Simple MVP 2D game for the Ink L2 network where a small Kraken catches falling ink drops.

## Tech

- React 18 + TypeScript
- Vite 5
- Wagmi 2 + viem for wallet connection

## Getting started

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Then open the printed localhost URL in your browser.

## Gameplay

- Use the **← →** arrow keys or **A / D** to move the Kraken left and right.
- Catch as many ink drops as you can.
- If you miss too many drops, the ink spills and the round ends. Click **“Play again”** to restart.

## Wallet

- Click **“Connect Wallet”** in the top right to connect using Wagmi.
- Once connected, the button shows the shortened wallet address; click again to disconnect.

