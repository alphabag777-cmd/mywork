/**
 * Node storage and management utilities
 * Handles CRUD operations for nodes using Firebase Firestore
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { NodeId } from "./contract";

export interface NodeType {
  id: string;
  name: string;
  price: number;
  color: string;
  nodeId: number; // NodeId enum value
  icon?: string;
  description?: string;
  tags?: string[];
  walletAddress?: string; // Wallet address for node purchases
  createdAt: number;
  updatedAt: number;
}

const NODES_COLLECTION = "nodes";

/**
 * Convert Firestore timestamp to number
 */
function timestampToNumber(timestamp: any): number {
  if (timestamp?.toMillis) {
    return timestamp.toMillis();
  }
  if (timestamp?.seconds) {
    return timestamp.seconds * 1000;
  }
  return timestamp || Date.now();
}

/**
 * Convert node data from Firestore format
 */
function fromFirestore(docData: any, id: string): NodeType {
  return {
    id,
    name: docData.name || "",
    price: docData.price || 0,
    color: docData.color || "gold",
    nodeId: docData.nodeId || NodeId.ALPHA,
    icon: docData.icon || "",
    description: docData.description || "",
    tags: docData.tags || [],
    walletAddress: docData.walletAddress || "",
    createdAt: timestampToNumber(docData.createdAt),
    updatedAt: timestampToNumber(docData.updatedAt),
  };
}

/**
 * Convert node data to Firestore format
 */
function toFirestore(node: Partial<NodeType>): any {
  const now = Timestamp.now();
  return {
    name: node.name || "",
    price: node.price || 0,
    color: node.color || "gold",
    nodeId: node.nodeId || NodeId.ALPHA,
    icon: node.icon || "",
    description: node.description || "",
    tags: node.tags || [],
    walletAddress: node.walletAddress || "",
    createdAt: node.createdAt ? Timestamp.fromMillis(node.createdAt) : now,
    updatedAt: now,
  };
}

/**
 * Get all nodes from Firestore
 */
export async function getAllNodes(): Promise<NodeType[]> {
  try {
    const nodesRef = collection(db, NODES_COLLECTION);
    const q = query(nodesRef, orderBy("price", "asc"));
    const querySnapshot = await getDocs(q);
    
    const nodes: NodeType[] = [];
    querySnapshot.forEach((doc) => {
      nodes.push(fromFirestore(doc.data(), doc.id));
    });
    
    return nodes;
  } catch (error) {
    console.error("Error getting nodes from Firestore:", error);
    return getNodesFromLocalStorage();
  }
}

/**
 * Get a node by ID from Firestore
 */
export async function getNodeById(id: string): Promise<NodeType | null> {
  try {
    const nodeRef = doc(db, NODES_COLLECTION, id);
    const nodeSnap = await getDoc(nodeRef);
    
    if (nodeSnap.exists()) {
      return fromFirestore(nodeSnap.data(), nodeSnap.id);
    }
    
    return null;
  } catch (error) {
    console.error("Error getting node from Firestore:", error);
    const nodes = getNodesFromLocalStorage();
    return nodes.find((n) => n.id === id) || null;
  }
}

/**
 * Save a node (create or update) to Firestore
 */
export async function saveNode(
  node: Omit<NodeType, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<NodeType> {
  try {
    const now = Date.now();
    const nodeId = node.id || `node_${now}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get existing node to preserve createdAt if updating
    let existingNode: NodeType | null = null;
    if (node.id) {
      existingNode = await getNodeById(node.id);
    }
    
    const nodeData = toFirestore({
      ...node,
      createdAt: existingNode?.createdAt || now,
    });
    
    const nodeRef = doc(db, NODES_COLLECTION, nodeId);
    await setDoc(nodeRef, nodeData);
    
    // Also save to localStorage as backup
    saveNodeToLocalStorage({
      ...node,
      id: nodeId,
    });
    
    return {
      ...node,
      id: nodeId,
      createdAt: existingNode?.createdAt || now,
      updatedAt: now,
    } as NodeType;
  } catch (error) {
    console.error("Error saving node to Firestore:", error);
    return saveNodeToLocalStorage(node);
  }
}

/**
 * Delete a node by ID from Firestore
 */
export async function deleteNode(id: string): Promise<boolean> {
  try {
    const nodeRef = doc(db, NODES_COLLECTION, id);
    await deleteDoc(nodeRef);
    
    deleteNodeFromLocalStorage(id);
    
    return true;
  } catch (error) {
    console.error("Error deleting node from Firestore:", error);
    return deleteNodeFromLocalStorage(id);
  }
}

// ========== LocalStorage Fallback Functions ==========

const NODES_STORAGE_KEY = "alphabag_nodes";

function getNodesFromLocalStorage(): NodeType[] {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = localStorage.getItem(NODES_STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse nodes from localStorage:", e);
    return [];
  }
}

function saveNodeToLocalStorage(
  node: Omit<NodeType, "id" | "createdAt" | "updatedAt"> & { id?: string }
): NodeType {
  if (typeof window === "undefined") {
    throw new Error("Cannot save node: window is undefined");
  }

  const nodes = getNodesFromLocalStorage();
  const now = Date.now();

  if (node.id && nodes.some((n) => n.id === node.id)) {
    const updatedNodes = nodes.map((n) =>
      n.id === node.id
        ? {
            ...node,
            id: node.id,
            walletAddress: node.walletAddress || "",
            updatedAt: now,
            createdAt: n.createdAt,
          }
        : n
    );
    localStorage.setItem(NODES_STORAGE_KEY, JSON.stringify(updatedNodes));
    return updatedNodes.find((n) => n.id === node.id)!;
  } else {
    const newNode: NodeType = {
      ...node,
      id: node.id || `node_${now}_${Math.random().toString(36).substr(2, 9)}`,
      walletAddress: node.walletAddress || "",
      createdAt: now,
      updatedAt: now,
    };
    nodes.push(newNode);
    localStorage.setItem(NODES_STORAGE_KEY, JSON.stringify(nodes));
    return newNode;
  }
}

function deleteNodeFromLocalStorage(id: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const nodes = getNodesFromLocalStorage();
  const filtered = nodes.filter((n) => n.id !== id);
  
  if (filtered.length === nodes.length) {
    return false;
  }

  localStorage.setItem(NODES_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

