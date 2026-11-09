import { z } from "zod";

export const STAGE_NAMES = Object.freeze([
    "Requirements", "High Level Design", "Core Flow", "Data Model",
    "Reliability", "Scaling", "Tradeoffs"
]);
export const KNOWLEDGE_FILES = Object.freeze([
    "problem.json", "architecture.json", "evaluation.json", "graph.json", "interview.json"
]);

const text = z.string().min(1).refine(value => value === value.trim(), "Text must be nonblank and trimmed");
const strings = z.array(text).min(1).refine(items => new Set(items.map(item => item.toLowerCase())).size === items.length, "Entries must be unique");
const integer = z.number().int().positive();
const bytes = z.number().int().nonnegative();
const rate = z.strictObject({
    name: text, dailyVolume: integer, averagePerSecond: z.number().positive(),
    peakMultiplier: z.number().min(1), peakPerSecond: z.number().positive()
});
const storage = z.strictObject({
    name: text, recordsPerDay: integer, bytesPerRecord: integer, days: integer,
    replicationFactor: integer, rawBytes: bytes, replicatedBytes: bytes
});
const state = z.strictObject({
    name: text, entities: integer, bytesPerEntity: integer, replicationFactor: integer,
    rawBytes: bytes, replicatedBytes: bytes
});
export const ProblemSchema = z.strictObject({
    id: z.string().regex(/^[a-z0-9_]{1,64}$/), title: text,
    problemDifficulty: z.enum(["Easy", "Medium", "Hard"]), description: text,
    functionalRequirements: strings, nonFunctionalRequirements: strings, constraints: strings,
    outOfScope: strings,
    scale: z.strictObject({
        assumption: text, dailyActiveUsers: integer.optional(), rates: z.array(rate).min(1),
        storageEstimates: z.array(storage), stateEstimates: z.array(state), notes: strings
    })
});
export const ArchitectureSchema = z.strictObject({
    components: z.array(z.strictObject({ name: text, purpose: text })).min(1),
    tradeoffs: z.array(z.strictObject({ topic: text, alternatives: strings.min(2), guidance: text })).min(1),
    dataModel: z.array(z.strictObject({ entity: text, key: text, fields: strings, notes: text })).min(1),
    flows: z.array(z.strictObject({ name: text, steps: strings })).min(1)
});
const criterion = z.strictObject({ name: text, required: z.boolean(), concepts: strings, guidance: text });
export const InterviewSchema = z.strictObject({
    estimatedDuration: integer,
    difficultyLevels: z.array(z.enum(["SDE1", "SDE2", "Senior"])).min(1),
    stages: z.array(z.strictObject({
        name: z.enum(STAGE_NAMES), entryQuestion: text, objective: text,
        completionCriteria: z.array(criterion).min(1)
    })).length(STAGE_NAMES.length)
});
export const EvaluationSchema = z.strictObject({
    guidance: strings,
    scoreAnchors: z.array(z.strictObject({ min: z.number().min(0).max(10), max: z.number().min(0).max(10), description: text })).min(1),
    topics: z.array(z.strictObject({
        name: z.enum(STAGE_NAMES), weight: z.number().positive().max(100),
        minimumCoverage: z.number().gt(0).max(1), guidance: text,
        concepts: z.array(z.strictObject({ name: text, importance: z.enum(["critical", "important", "optional"]), probe: z.boolean(), guidance: text })).min(1)
    })).length(STAGE_NAMES.length)
});
export const GraphSchema = z.strictObject({
    nodeMapping: z.record(z.string().regex(/^[a-z0-9_]+$/), text),
    recommendedNodes: strings, optionalNodes: z.array(text),
    recommendedConnections: z.array(z.strictObject({ from: text, to: text })).min(1),
    graphChecks: z.array(z.strictObject({ name: text, required: z.boolean() })).min(1)
});

// The bundle matches loadKnowledge() and the contexts passed to the agents.
export const KnowledgeBundleSchema = z.strictObject({
    problem: ProblemSchema, architecture: ArchitectureSchema, evaluation: EvaluationSchema,
    graph: GraphSchema, interview: InterviewSchema
}).superRefine((bundle, ctx) => {
    const issue = (path, message) => ctx.addIssue({ code: "custom", path, message });
    const unique = (values, path) => {
        if (new Set(values.map(value => value.toLowerCase())).size !== values.length) issue(path, "Names must be unique");
    };
    const stages = bundle.interview.stages;
    if (stages.some((stage, index) => stage.name !== STAGE_NAMES[index])) issue(["interview", "stages"], "Stage names must match the shared sequence");
    if (bundle.evaluation.topics.some((topic, index) => topic.name !== STAGE_NAMES[index])) issue(["evaluation", "topics"], "Rubric topics must match interview stages in order");
    unique(bundle.interview.difficultyLevels, ["interview", "difficultyLevels"]);
    unique(stages.map(stage => stage.entryQuestion), ["interview", "stages"]);
    stages.forEach((stage, index) => {
        unique(stage.completionCriteria.map(item => item.name), ["interview", "stages", index, "completionCriteria"]);
        if (!stage.completionCriteria.some(item => item.required)) issue(["interview", "stages", index], "Each stage needs a required completion criterion");
        const topic = bundle.evaluation.topics.find(topic => topic.name === stage.name);
        if (!topic) return;
        unique(topic.concepts.map(item => item.name), ["evaluation", "topics", index, "concepts"]);
        for (const item of stage.completionCriteria) {
            if (item.required && !topic.concepts.some(concept => concept.name === item.name && concept.importance === "critical")) {
                issue(["evaluation", "topics", index, "concepts"], `Required criterion lacks a critical rubric entry: ${item.name}`);
            }
        }
    });
    if (bundle.evaluation.topics.reduce((sum, topic) => sum + topic.weight, 0) !== 100) issue(["evaluation", "topics"], "Advisory topic weights must sum to 100");
    const anchors = bundle.evaluation.scoreAnchors;
    if (anchors[0]?.min !== 0 || anchors.at(-1)?.max !== 10 || anchors.some((anchor, index) => anchor.max < anchor.min || (index > 0 && anchor.min !== anchors[index - 1].max + 1))) issue(["evaluation", "scoreAnchors"], "Score anchors must cover integer scores 0 through 10 without gaps or overlaps");
    const components = bundle.architecture.components.map(component => component.name);
    unique(components, ["architecture", "components"]);
    unique(bundle.architecture.dataModel.map(entity => entity.entity), ["architecture", "dataModel"]);
    unique(bundle.architecture.tradeoffs.map(item => item.topic), ["architecture", "tradeoffs"]);
    const graph = bundle.graph;
    const graphNodes = [...graph.recommendedNodes, ...graph.optionalNodes];
    unique(graphNodes, ["graph", "recommendedNodes"]);
    unique(graph.graphChecks.map(item => item.name), ["graph", "graphChecks"]);
    for (const name of [...graphNodes, ...Object.values(graph.nodeMapping)]) {
        if (!components.includes(name)) issue(["graph"], `Unknown architecture component: ${name}`);
    }
    for (const name of components) {
        if (!graphNodes.includes(name) || !Object.values(graph.nodeMapping).includes(name)) issue(["graph"], `Component missing from the reference graph: ${name}`);
    }
    unique(graph.recommendedConnections.map(edge => `${edge.from} -> ${edge.to}`), ["graph", "recommendedConnections"]);
    graph.recommendedConnections.forEach((edge, index) => {
        if (!graphNodes.includes(edge.from) || !graphNodes.includes(edge.to)) issue(["graph", "recommendedConnections", index], "Connection endpoints must name declared reference graph nodes");
    });
    const scale = bundle.problem.scale;
    unique(scale.rates.map(item => item.name), ["problem", "scale", "rates"]);
    scale.rates.forEach((item, index) => {
        if (Math.abs(item.averagePerSecond - item.dailyVolume / 86400) > 0.011) issue(["problem", "scale", "rates", index, "averagePerSecond"], "Average must equal daily volume / 86400 within 0.01");
        if (Math.abs(item.peakPerSecond - item.dailyVolume / 86400 * item.peakMultiplier) > 0.011) issue(["problem", "scale", "rates", index, "peakPerSecond"], "Peak must equal the unrounded average times peak multiplier within 0.01");
    });
    for (const [kind, estimates] of [["storageEstimates", scale.storageEstimates], ["stateEstimates", scale.stateEstimates]]) {
        estimates.forEach((item, index) => {
            const raw = kind === "storageEstimates" ? item.recordsPerDay * item.bytesPerRecord * item.days : item.entities * item.bytesPerEntity;
            if (!Number.isSafeInteger(raw) || item.rawBytes !== raw || item.replicatedBytes !== raw * item.replicationFactor) issue(["problem", "scale", kind, index], "Raw and replicated byte totals must match their sizing inputs");
        });
    }
});
