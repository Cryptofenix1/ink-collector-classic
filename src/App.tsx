import { InkCollectorGame } from "./components/InkCollectorGame";
import { WalletConnectButton } from "./components/WalletConnectButton";

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Ink Collector</h1>
          <p className="subtitle">Guide the Kraken and catch the ink.</p>
        </div>
        <WalletConnectButton />
      </header>

      <main className="app-main">
        <InkCollectorGame />
        <p className="hint">Use ← → or A / D keys to move the Kraken.</p>
      </main>
    </div>
  );
}

export default App;

