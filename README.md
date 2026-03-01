# Ink Collector v2.0 🦑

> **🟢 Live Demo:** [Play Ink Collector](https://ink-collector-classic.vercel.app/)
> *(Spun up a quick Vercel instance today so you don't have to build it locally. Code is the original MVP from Summer 2025).*

A gamified entry point into the **Ink L2** ecosystem. Ink Collector is an interactive web-based mini-game designed to stress-test frontend blockchain interactions while providing an engaging user experience. 

Initially built as a simple MVP, version 2.0 introduces advanced gameplay mechanics, dynamic scaling, and guest-mode capabilities, setting a baseline for robust Web3 game development on Ink.

## 🌟 Features

* **Wallet Integration:** Seamless connection via Wagmi and Viem. Play as an authenticated Web3 user or in Guest Mode.
* **Dynamic Gameplay Mechanics:**
    * 🟣 **Common Ink:** +1 Point.
    * 🟡 **Golden Drops:** +5 Points and a 7-second Kraken speed boost.
    * 🔴 **Toxic Drops:** -3 Points, temporary slow debuff, and loss of 1 life.
    * 🔵 **Shield Drops:** Grants temporary immunity to the next toxic drop.
* **Progressive Difficulty:** Drop speed increases by 10% every 15 points.
* **Fully Responsive UI:** Smart scaling for desktop browsers and integrated touch-controls for mobile devices (`touch-action: none` optimized).
* **On-Chain Leaderboard (Demo):** Simulated contract writes for high scores to demonstrate blockchain state management.

## 🛠 Tech Stack

* **Frontend:** React 18, TypeScript, Vite 5
* **Styling:** TailwindCSS
* **Web3:** Wagmi v2, Viem

## 🚀 Getting Started

1. Install dependencies:
`npm install`

2. Run the development server:
`npm run dev`