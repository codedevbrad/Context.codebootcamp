"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  type NodeProps,
  Position,
  ReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  updateProjectDbModelAction,
  type ErmBoard,
  type ErmModelColumn,
  type ErmRelation,
} from "@/domains/projects/project/db";

const PRISMA_FIELD_TYPES = [
  "String",
  "Int",
  "BigInt",
  "Float",
  "Decimal",
  "Boolean",
  "DateTime",
  "Json",
  "Bytes",
] as const;

type RelationType = ErmRelation["relationType"];

type ErmNodeData = {
  name: string;
  rows: ErmModelColumn[];
  onEdit?: (modelId: string) => void;
};

type ErmNode = Node<ErmNodeData>;
type ErmEdge = Edge<{ relationType: RelationType }>;

type ReactFlowComponentProps = {
  projectId: string;
  initialDbModel: unknown;
};

function badgeClasses(kind: "pk" | "fk") {
  return kind === "pk"
    ? "rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700"
    : "rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700";
}

function ModelNode({ id, data }: NodeProps<ErmNode>) {
  return (
    <div className="min-w-64 rounded-md border bg-background p-3 shadow-sm">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center justify-between border-b pb-2">
        <p className="m-0 text-sm font-semibold">{data.name}</p>
        <button
          type="button"
          className="inline-flex size-6 items-center justify-center rounded border text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={`Edit ${data.name}`}
          onClick={(event) => {
            event.stopPropagation();
            data.onEdit?.(id);
          }}
        >
          <Pencil className="size-3.5" />
        </button>
      </div>
      <div className="pt-2">
        {data.rows.length ? (
          <ul className="m-0 space-y-1.5 p-0">
            {data.rows.map((row) => (
              <li key={row.id} className="list-none rounded border bg-muted/30 px-2 py-1 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{row.name}</span>
                  <div className="flex items-center gap-1">
                    {row.isPrimaryKey ? <span className={badgeClasses("pk")}>PK</span> : null}
                    {row.isForeignKey ? <span className={badgeClasses("fk")}>FK</span> : null}
                  </div>
                </div>
                <p className="m-0 text-[11px] text-muted-foreground">
                  {row.type}
                  {row.nullable ? " | nullable" : " | required"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-xs text-muted-foreground">No rows yet.</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  modelNode: ModelNode,
};

function createId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeBoard(value: unknown): ErmBoard {
  const empty: ErmBoard = { models: [], relations: [] };

  if (!value || typeof value !== "object") {
    return empty;
  }

  const source = value as Partial<ErmBoard>;
  const models = Array.isArray(source.models) ? source.models : [];
  const relations = Array.isArray(source.relations) ? source.relations : [];

  return {
    models: models
      .map((model) => {
        if (!model || typeof model !== "object") {
          return null;
        }

        const maybeModel = model as {
          id?: unknown;
          name?: unknown;
          position?: { x?: unknown; y?: unknown };
          rows?: unknown;
        };
        const rows = Array.isArray(maybeModel.rows) ? maybeModel.rows : [];

        return {
          id: typeof maybeModel.id === "string" ? maybeModel.id : createId(),
          name:
            typeof maybeModel.name === "string" && maybeModel.name.trim()
              ? maybeModel.name
              : "Model",
          position: {
            x: typeof maybeModel.position?.x === "number" ? maybeModel.position.x : 0,
            y: typeof maybeModel.position?.y === "number" ? maybeModel.position.y : 0,
          },
          rows: rows
            .map((row) => {
              if (!row || typeof row !== "object") {
                return null;
              }
              const maybeRow = row as {
                id?: unknown;
                name?: unknown;
                type?: unknown;
                nullable?: unknown;
                isPrimaryKey?: unknown;
                isForeignKey?: unknown;
              };
              if (typeof maybeRow.name !== "string" || !maybeRow.name.trim()) {
                return null;
              }

              return {
                id: typeof maybeRow.id === "string" ? maybeRow.id : createId(),
                name: maybeRow.name,
                type:
                  typeof maybeRow.type === "string" && maybeRow.type.trim()
                    ? maybeRow.type
                    : "String",
                nullable: Boolean(maybeRow.nullable),
                isPrimaryKey: Boolean(maybeRow.isPrimaryKey),
                isForeignKey: Boolean(maybeRow.isForeignKey),
              };
            })
            .filter((row): row is ErmModelColumn => row !== null),
        };
      })
      .filter((model): model is ErmBoard["models"][number] => model !== null),
    relations: relations
      .map((relation) => {
        if (!relation || typeof relation !== "object") {
          return null;
        }
        const maybeRelation = relation as {
          id?: unknown;
          source?: unknown;
          target?: unknown;
          relationType?: unknown;
        };
        if (typeof maybeRelation.source !== "string" || typeof maybeRelation.target !== "string") {
          return null;
        }

        const relationType: RelationType =
          maybeRelation.relationType === "1:1" ||
          maybeRelation.relationType === "1:N" ||
          maybeRelation.relationType === "N:N"
            ? maybeRelation.relationType
            : "1:N";

        return {
          id: typeof maybeRelation.id === "string" ? maybeRelation.id : createId(),
          source: maybeRelation.source,
          target: maybeRelation.target,
          relationType,
        };
      })
      .filter((relation): relation is ErmBoard["relations"][number] => relation !== null),
  };
}

function boardToFlow(board: ErmBoard) {
  const nodes: ErmNode[] = board.models.map((model) => ({
    id: model.id,
    type: "modelNode",
    position: model.position,
    data: {
      name: model.name,
      rows: model.rows,
    },
  }));

  const edges: ErmEdge[] = board.relations.map((relation) => ({
    id: relation.id,
    source: relation.source,
    target: relation.target,
    data: { relationType: relation.relationType },
    label: relation.relationType,
    markerEnd: { type: MarkerType.ArrowClosed },
    animated: false,
  }));

  return { nodes, edges };
}

function flowToBoard(nodes: ErmNode[], edges: ErmEdge[]): ErmBoard {
  return {
    models: nodes.map((node) => ({
      id: node.id,
      name: node.data.name,
      position: node.position,
      rows: node.data.rows,
    })),
    relations: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      relationType:
        edge.data?.relationType === "1:1" ||
        edge.data?.relationType === "1:N" ||
        edge.data?.relationType === "N:N"
          ? edge.data.relationType
          : "1:N",
    })),
  };
}

export default function ReactFlowComponent({ projectId, initialDbModel }: ReactFlowComponentProps) {
  const initialBoard = useMemo(() => normalizeBoard(initialDbModel), [initialDbModel]);
  const initialFlow = useMemo(() => boardToFlow(initialBoard), [initialBoard]);
  const [nodes, setNodes] = useState<ErmNode[]>(initialFlow.nodes);
  const [edges, setEdges] = useState<ErmEdge[]>(initialFlow.edges);
  const [newModelName, setNewModelName] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedEdgeId, setSelectedEdgeId] = useState("");
  const [activeSidebar, setActiveSidebar] = useState<"none" | "create" | "edit">("none");
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState<(typeof PRISMA_FIELD_TYPES)[number]>("String");
  const [fieldNullable, setFieldNullable] = useState(false);
  const [fieldIsPrimaryKey, setFieldIsPrimaryKey] = useState(false);
  const [fieldIsForeignKey, setFieldIsForeignKey] = useState(false);
  const [error, setError] = useState("");

  const persistBoard = useCallback(
    async (nextNodes: ErmNode[], nextEdges: ErmEdge[]) => {
      const payload = flowToBoard(nextNodes, nextEdges);
      const result = await updateProjectDbModelAction(projectId, payload);
      if (!result.success) {
        setError(result.error);
      } else {
        setError("");
      }
    },
    [projectId]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void persistBoard(nodes, edges);
    }, 400);

    return () => clearTimeout(timer);
  }, [nodes, edges, persistBoard]);

  const onNodesChange = useCallback((changes: NodeChange<ErmNode>[]) => {
    setNodes((nodesSnapshot) => applyNodeChanges<ErmNode>(changes, nodesSnapshot));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange<ErmEdge>[]) => {
    setEdges((edgesSnapshot) => applyEdgeChanges<ErmEdge>(changes, edgesSnapshot));
  }, []);

  const onConnect = useCallback((params: Connection) => {
    if (!params.source || !params.target) {
      return;
    }

    const newEdge: ErmEdge = {
      id: createId(),
      source: params.source,
      target: params.target,
      data: { relationType: "1:N" },
      label: "1:N",
      markerEnd: { type: MarkerType.ArrowClosed },
    };
    setEdges((edgesSnapshot) => [...edgesSnapshot, newEdge]);
  }, []);

  const handleCreateModel = () => {
    const trimmedName = newModelName.trim();
    if (!trimmedName) {
      setError("Model name is required");
      return;
    }

    const newModelId = createId();
    setNodes((snapshot) => [
      ...snapshot,
      {
        id: newModelId,
        type: "modelNode",
        position: { x: 100 + snapshot.length * 60, y: 100 + snapshot.length * 40 },
        data: { name: trimmedName, rows: [] },
      },
    ]);
    setNewModelName("");
    setSelectedModelId(newModelId);
    setSelectedEdgeId("");
    setActiveSidebar("edit");
    setError("");
  };

  const selectedModel = useMemo(
    () => nodes.find((node) => node.id === selectedModelId) ?? null,
    [nodes, selectedModelId]
  );
  const selectedEdge = useMemo(
    () => edges.find((edge) => edge.id === selectedEdgeId) ?? null,
    [edges, selectedEdgeId]
  );

  const handleRenameSelectedModel = (name: string) => {
    if (!selectedModelId) {
      return;
    }

    setNodes((snapshot) =>
      snapshot.map((node) =>
        node.id === selectedModelId
          ? {
              ...node,
              data: { ...node.data, name },
            }
          : node
      )
    );
  };

  const handleDeleteSelectedModel = () => {
    if (!selectedModelId) {
      return;
    }

    setNodes((snapshot) => snapshot.filter((node) => node.id !== selectedModelId));
    setEdges((snapshot) =>
      snapshot.filter((edge) => edge.source !== selectedModelId && edge.target !== selectedModelId)
    );
    setSelectedModelId("");
    setActiveSidebar("none");
    setError("");
  };

  const handleAddField = () => {
    const trimmedName = fieldName.trim();
    if (!selectedModelId) {
      setError("Select a model first");
      return;
    }
    if (!trimmedName) {
      setError("Field name is required");
      return;
    }

    setNodes((snapshot) =>
      snapshot.map((node) => {
        if (node.id !== selectedModelId) {
          return node;
        }

        return {
          ...node,
          data: {
            ...node.data,
            rows: [
              ...node.data.rows,
              {
                id: createId(),
                name: trimmedName,
                type: fieldType,
                nullable: fieldNullable,
                isPrimaryKey: fieldIsPrimaryKey,
                isForeignKey: fieldIsForeignKey,
              },
            ],
          },
        };
      })
    );
    setFieldName("");
    setFieldType("String");
    setFieldNullable(false);
    setFieldIsPrimaryKey(false);
    setFieldIsForeignKey(false);
    setError("");
  };

  const handleDeleteField = (fieldId: string) => {
    if (!selectedModelId) {
      return;
    }

    setNodes((snapshot) =>
      snapshot.map((node) => {
        if (node.id !== selectedModelId) {
          return node;
        }
        return {
          ...node,
          data: {
            ...node.data,
            rows: node.data.rows.filter((row) => row.id !== fieldId),
          },
        };
      })
    );
  };

  const handleUpdateRelationType = (relationType: RelationType) => {
    if (!selectedEdgeId) {
      return;
    }

    setEdges((snapshot) =>
      snapshot.map((edge) =>
        edge.id === selectedEdgeId
          ? {
              ...edge,
              data: { relationType },
              label: relationType,
            }
          : edge
      )
    );
  };

  const handleDeleteSelectedRelation = () => {
    if (!selectedEdgeId) {
      return;
    }
    setEdges((snapshot) => snapshot.filter((edge) => edge.id !== selectedEdgeId));
    setSelectedEdgeId("");
  };

  const handleOpenEditSidebar = useCallback((modelId: string) => {
    setSelectedModelId(modelId);
    setSelectedEdgeId("");
    setActiveSidebar("edit");
  }, []);

  const flowNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onEdit: handleOpenEditSidebar,
        },
      })),
    [nodes, handleOpenEditSidebar]
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="mb-2 flex justify-end">
          <Button
            type="button"
            onClick={() => {
              setActiveSidebar("create");
              setSelectedEdgeId("");
            }}
          >
            Create model
          </Button>
        </div>

        <div className="h-[72vh] w-full overflow-hidden rounded-md border">
          <ReactFlow
            nodes={flowNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            defaultViewport={{ x:  0, y: 0, zoom: 1 }}
            onSelectionChange={({ nodes: selectedNodes, edges: selectedEdges }) => {
              const nodeId = selectedNodes[0]?.id ?? "";
              const edgeId = selectedEdges[0]?.id ?? "";

              if (nodeId) {
                setSelectedModelId(nodeId);
                setSelectedEdgeId("");
                return;
              }
              if (edgeId) {
                setSelectedEdgeId(edgeId);
                return;
              }
              setSelectedEdgeId("");
            }}
          >
            <MiniMap />
            <Controls />
            <Background />
          </ReactFlow>
        </div>

        {activeSidebar === "create" ? (
          <aside className="absolute right-3 top-14 z-10 w-[340px] rounded-md border bg-background p-3 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Create model</p>
              <Button type="button" size="icon-xs" variant="ghost" onClick={() => setActiveSidebar("none")}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <Input
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                placeholder="e.g. users"
              />
              <Button type="button" className="w-full" onClick={handleCreateModel}>
                Add model
              </Button>
            </div>
          </aside>
        ) : null}

        {activeSidebar === "edit" ? (
          <aside className="absolute right-3 top-14 z-10 w-[340px] rounded-md border bg-background p-3 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Edit model</p>
              <Button type="button" size="icon-xs" variant="ghost" onClick={() => setActiveSidebar("none")}>
                <X className="size-4" />
              </Button>
            </div>
            {selectedModel ? (
              <div className="space-y-3">
                <Input
                  value={selectedModel.data.name}
                  onChange={(e) => handleRenameSelectedModel(e.target.value)}
                  placeholder="Model name"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={handleDeleteSelectedModel}
                >
                  Delete model
                </Button>

                <div className="space-y-2 border-t pt-3">
                  <p className="text-sm font-medium">Add field / column</p>
                  <Input
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    placeholder="e.g. id"
                  />
                  <select
                    value={fieldType}
                    onChange={(e) =>
                      setFieldType(e.target.value as (typeof PRISMA_FIELD_TYPES)[number])
                    }
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                  >
                    {PRISMA_FIELD_TYPES.map((typeName) => (
                      <option key={typeName} value={typeName}>
                        {typeName}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <label className="flex items-center gap-2 text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={fieldNullable}
                        onChange={(e) => setFieldNullable(e.target.checked)}
                      />
                      Nullable
                    </label>
                    <label className="flex items-center gap-2 text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={fieldIsPrimaryKey}
                        onChange={(e) => setFieldIsPrimaryKey(e.target.checked)}
                      />
                      PK
                    </label>
                    <label className="flex items-center gap-2 text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={fieldIsForeignKey}
                        onChange={(e) => setFieldIsForeignKey(e.target.checked)}
                      />
                      FK
                    </label>
                  </div>
                  <Button type="button" variant="outline" className="w-full" onClick={handleAddField}>
                    Add field
                  </Button>
                </div>

                <div className="space-y-2 border-t pt-3">
                  <p className="text-sm font-medium">Fields</p>
                  {selectedModel.data.rows.length ? (
                    <ul className="m-0 max-h-52 space-y-2 overflow-y-auto p-0">
                      {selectedModel.data.rows.map((row) => (
                        <li
                          key={row.id}
                          className="list-none rounded-md border bg-muted/30 px-2 py-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{row.name}</span>
                            <Button
                              type="button"
                              size="icon-xs"
                              variant="ghost"
                              aria-label={`Delete ${row.name}`}
                              onClick={() => handleDeleteField(row.id)}
                            >
                              <Trash2 className="size-3.5 text-destructive" />
                            </Button>
                          </div>
                          <p className="m-0 text-[11px] text-muted-foreground">
                            {row.type}
                            {row.nullable ? " | nullable" : " | required"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">No fields yet.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a model edit icon on a node to open model settings.
              </p>
            )}
          </aside>
        ) : null}
      </div>

   

      <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
        Tip: drag from a model handle to another model to create a relationship, then click that
        relation line to set `1:1`, `1:N`, or `N:N`.
      </div>
    </div>
  );
}