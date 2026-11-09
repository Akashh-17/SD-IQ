import { nodeFor } from "./nodeFactory";

export const SqlDbNode = nodeFor("sqldb");
export const NoSqlDbNode = nodeFor("nosqldb");
export const GraphDBNode = nodeFor("graphdb");
export const VectorDBNode = nodeFor("vectordb");
export const TimeSeriesDBNode = nodeFor("timeseriesdb");
