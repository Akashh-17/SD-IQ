import { nodeFor } from "./nodeFactory";

export const ServiceNode = nodeFor("service");
export const WorkerNode = nodeFor("worker");
export const CronJobNode = nodeFor("cronjob");
