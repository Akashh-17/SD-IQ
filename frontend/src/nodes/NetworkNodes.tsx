import { nodeFor } from "./nodeFactory";

export const ApiNode = nodeFor("apigateway");
export const LBNode = nodeFor("lb");
export const CDNNode = nodeFor("cdn");
export const ReverseProxyNode = nodeFor("proxy");
export const FirewallNode = nodeFor("firewall");
export const DNSNode = nodeFor("dns");
