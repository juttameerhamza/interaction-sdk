import { Providers } from "./providers";
import { LeadDemo } from "./lead-demo";
export default function Page() { return <main><h1>Next.js host</h1><p>The SDK runtime is client-injected; domain/API packages remain server-safe.</p><Providers><LeadDemo /></Providers></main>; }
