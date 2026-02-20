"use client";

import type { Node as FlowNode, Edge as FlowEdge, NodeProps } from "@xyflow/react";

import {
  Upload,
  Database,
  MessageSquare,
  HelpCircle,
  Layers,
  TrendingUp,
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
      className="w-48"
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

//  Layout (fan-out after step 2):
//
//                        ┌── KI-Chat ───────┐
//  Hochladen → Analyse ─┤── Karteikarten ──├─ Fortschritt
//                        └── Quiz ──────────┘

const X_GAP = 250;
const Y_OFFSET = 110;
const Y_MID = 100;

const nodes: FlowNode<WorkflowNodeData>[] = [
  {
    id: "upload",
    type: "workflow",
    position: { x: 0, y: Y_MID },
    data: {
      step: 1,
      title: "Hochladen",
      icon: Upload,
      description: "PDF, DOCX oder Markdown hochladen",
      hasTarget: false,
      hasSource: true,
    },
  },
  {
    id: "analyse",
    type: "workflow",
    position: { x: X_GAP, y: Y_MID },
    data: {
      step: 2,
      title: "Analyse",
      icon: Database,
      description: "LAI liest und strukturiert dein Material",
      hasTarget: true,
      hasSource: true,
    },
  },
  {
    id: "chat",
    type: "workflow",
    position: { x: X_GAP * 2, y: Y_MID - Y_OFFSET },
    data: {
      step: 3,
      title: "KI-Chat",
      icon: MessageSquare,
      description: "Wie ein Tutor — mit Seitenzahlen aus deinem PDF",
      hasTarget: true,
      hasSource: true,
    },
  },
  {
    id: "flashcards",
    type: "workflow",
    position: { x: X_GAP * 2, y: Y_MID },
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
    position: { x: X_GAP * 2, y: Y_MID + Y_OFFSET },
    data: {
      step: 3,
      title: "Quiz",
      icon: HelpCircle,
      description: "Fragen aus deinen Unterlagen — nicht aus dem Internet",
      hasTarget: true,
      hasSource: true,
    },
  },
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
  { id: "upload-analyse", source: "upload", target: "analyse", type: "animated" },
  { id: "analyse-chat", source: "analyse", target: "chat", type: "animated" },
  { id: "analyse-flashcards", source: "analyse", target: "flashcards", type: "animated" },
  { id: "analyse-quiz", source: "analyse", target: "quiz", type: "animated" },
  { id: "chat-progress", source: "chat", target: "progress", type: "animated" },
  { id: "flashcards-progress", source: "flashcards", target: "progress", type: "animated" },
  { id: "quiz-progress", source: "quiz", target: "progress", type: "animated" },
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
      proOptions={{ hideAttribution: true }}
    />
  );
}
