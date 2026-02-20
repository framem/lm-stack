"use client";

import type { Node as FlowNode, Edge as FlowEdge, NodeProps } from "@xyflow/react";

import {
  Upload,
  MessageSquare,
  HelpCircle,
  Layers,
  TrendingUp,
  BookOpen,
  PenLine,
  Brain,
} from "lucide-react";

import { Canvas } from "@/src/components/ai-elements/canvas";
import {
  Node,
  NodeHeader,
  NodeTitle,
  NodeDescription,
  NodeContent,
} from "@/src/components/ai-elements/node";
import { Edge } from "@/src/components/ai-elements/edge";
import { Badge } from "@/src/components/ui/badge";

type WorkflowNodeData = {
  title: string;
  description: string;
  icon: typeof Upload;
  step: number;
  hasTarget: boolean;
  hasSource: boolean;
  [key: string]: unknown;
};

function WorkflowNode({ data }: NodeProps<FlowNode<WorkflowNodeData>>) {
  const Icon = data.icon;
  return (
    <Node
      handles={{ target: data.hasTarget, source: data.hasSource }}
      className="w-52"
    >
      <NodeHeader className="flex items-center gap-2 p-3!">
        <Badge
          variant="secondary"
          className="size-6 shrink-0 justify-center rounded-full p-0 text-xs"
        >
          {data.step}
        </Badge>
        <Icon className="size-4 shrink-0 text-primary" />
        <NodeTitle className="truncate text-sm">{data.title}</NodeTitle>
      </NodeHeader>
      <NodeContent>
        <NodeDescription className="text-xs">
          {data.description}
        </NodeDescription>
      </NodeContent>
    </Node>
  );
}

const nodeTypes = { workflow: WorkflowNode };
const edgeTypes = { animated: Edge.Animated };

//  Two direct inputs → LAI (central hub) → four features → one endpoint:
//
//  Hochladen  ─┐           ┌── KI-Chat ──────┐
//               ├─── LAI ──┤── Karteikarten ──├─ Fortschritt
//  Vokabel-Set─┘           ├── Quiz ──────────┤
//                          └── Vokabeln üben ─┘

const X_GAP = 280;
const Y_GAP = 210;
const Y_PAD = 30; // top/bottom breathing room so fitView doesn't clip

// Four feature rows, evenly spaced
const Y_CHAT  = Y_PAD;
const Y_FLASH = Y_PAD + Y_GAP;
const Y_QUIZ  = Y_PAD + Y_GAP * 2;
const Y_PRAC  = Y_PAD + Y_GAP * 3;

// LAI and progress sit at the vertical center of all four features
const Y_MID = (Y_CHAT + Y_PRAC) / 2;

const nodes: FlowNode<WorkflowNodeData>[] = [
  // --- Two starting points ---
  {
    id: "upload",
    type: "workflow",
    position: { x: 0, y: Y_CHAT },
    data: {
      step: 1,
      title: "Eigene Unterlagen",
      icon: Upload,
      description: "PDF, DOCX oder Markdown hochladen",
      hasTarget: false,
      hasSource: true,
    },
  },
  {
    id: "vocab_set",
    type: "workflow",
    position: { x: 0, y: Y_PRAC },
    data: {
      step: 1,
      title: "Eine Sprache lernen",
      icon: BookOpen,
      description: "Fertiges A1/A2-Set für Spanisch oder Englisch",
      hasTarget: false,
      hasSource: true,
    },
  },
  // --- Central hub ---
  {
    id: "lai",
    type: "workflow",
    position: { x: X_GAP, y: Y_MID },
    data: {
      step: 2,
      title: "LAI",
      icon: Brain,
      description: "Liest, strukturiert und schaltet alle Lernfunktionen frei",
      hasTarget: true,
      hasSource: true,
    },
  },
  // --- Features ---
  {
    id: "chat",
    type: "workflow",
    position: { x: X_GAP * 2, y: Y_CHAT },
    data: {
      step: 3,
      title: "KI-Chat",
      icon: MessageSquare,
      description: "Wie ein Tutor — mit Quellenangaben aus deinem Material",
      hasTarget: true,
      hasSource: true,
    },
  },
  {
    id: "flashcards",
    type: "workflow",
    position: { x: X_GAP * 2, y: Y_FLASH },
    data: {
      step: 3,
      title: "Karteikarten",
      icon: Layers,
      description: "Passen sich deinem Lernstand automatisch an",
      hasTarget: true,
      hasSource: true,
    },
  },
  {
    id: "quiz",
    type: "workflow",
    position: { x: X_GAP * 2, y: Y_QUIZ },
    data: {
      step: 3,
      title: "Quiz",
      icon: HelpCircle,
      description: "Fragen aus deinem Material — nicht aus dem Internet",
      hasTarget: true,
      hasSource: true,
    },
  },
  {
    id: "vocab_practice",
    type: "workflow",
    position: { x: X_GAP * 2, y: Y_PRAC },
    data: {
      step: 3,
      title: "Vokabeln üben",
      icon: PenLine,
      description: "Spaced Repetition merkt sich, was du nochmal brauchst",
      hasTarget: true,
      hasSource: true,
    },
  },
  // --- Endpoint ---
  {
    id: "progress",
    type: "workflow",
    position: { x: X_GAP * 3, y: Y_MID },
    data: {
      step: 4,
      title: "Fortschritt",
      icon: TrendingUp,
      description: "Sieh wo du stehst und was du noch üben solltest",
      hasTarget: true,
      hasSource: false,
    },
  },
];

const edges: FlowEdge[] = [
  // Both inputs → LAI
  { id: "upload-lai",        source: "upload",         target: "lai",            type: "animated" },
  { id: "vocab_set-lai",     source: "vocab_set",      target: "lai",            type: "animated" },
  // LAI → features (fan out)
  { id: "lai-chat",          source: "lai",            target: "chat",           type: "animated" },
  { id: "lai-flash",         source: "lai",            target: "flashcards",     type: "animated" },
  { id: "lai-quiz",          source: "lai",            target: "quiz",           type: "animated" },
  { id: "lai-practice",      source: "lai",            target: "vocab_practice", type: "animated" },
  // Features → progress (converge)
  { id: "chat-progress",     source: "chat",           target: "progress",       type: "animated" },
  { id: "flash-progress",    source: "flashcards",     target: "progress",       type: "animated" },
  { id: "quiz-progress",     source: "quiz",           target: "progress",       type: "animated" },
  { id: "prac-progress",     source: "vocab_practice", target: "progress",       type: "animated" },
];

export function LaiWorkflow() {
  return (
    <Canvas
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      selectionOnDrag={false}
      panOnScroll={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      fitViewOptions={{ padding: 0.25 }}
      proOptions={{ hideAttribution: true }}
    />
  );
}
