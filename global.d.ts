import type { HttpProxyAgent } from "hpagent";

declare global {
  interface RequestInit {
    agent?: HttpProxyAgent;
  }
}
