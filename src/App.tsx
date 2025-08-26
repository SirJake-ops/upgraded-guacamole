import "./App.css";
import {invoke} from "@tauri-apps/api/core";

function App() {

    async function hello() {
        const message = await invoke('test_hello');
        alert(message);
    }

  return (
    <main class="container">
      <h1>Welcome to Tauri + Solid</h1>
        <div>
            <button onClick={() => hello()}>Hello</button>
        </div>

    </main>
  );
}

export default App;
