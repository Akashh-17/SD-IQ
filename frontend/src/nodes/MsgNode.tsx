import { nodeFor } from "./nodeFactory";

export const QueueNode = nodeFor("msgqueue");
export const EventBusNode = nodeFor("eventbus");
export const KafkaNode = nodeFor("kafka");
export const PublisherNode = nodeFor("publisher");
export const SubscriberNode = nodeFor("subscribe");
