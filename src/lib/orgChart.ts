import { User, getAllUsers } from "./users";
import { UserInvestment, getAllUserInvestments } from "./userInvestments";

export interface OrgNode extends User {
  id: string; // Wallet address
  name: string; // Often wallet or alias
  personalSales: number;
  teamSales: number; // Sum of children's teamSales + personalSales
  children: OrgNode[];
  level?: number;
}

interface BuildOrgTreeOptions {
  startDate?: Date;
  endDate?: Date;
}

/**
 * Builds the organization tree with sales data.
 * Fetches all users and investments, aggregates sales, and builds the hierarchy.
 */
export async function buildOrgTree(options: BuildOrgTreeOptions = {}): Promise<OrgNode[]> {
  try {
    const { startDate, endDate } = options;

    // 1. Fetch all users and investments in parallel
    const [users, investments] = await Promise.all([
      getAllUsers(),
      getAllUserInvestments(),
    ]);

    // 2. Aggregate personal sales for each user
    const salesMap = new Map<string, number>();
    investments.forEach((inv) => {
      // Filter by date range if provided
      if (startDate && inv.investedAt < startDate.getTime()) return;
      if (endDate && inv.investedAt > endDate.getTime()) return;

      const userId = inv.userId.toLowerCase();
      const current = salesMap.get(userId) || 0;
      salesMap.set(userId, current + (inv.amount || 0));
    });

    // 3. Create a map of OrgNodes for quick lookup
    const nodeMap = new Map<string, OrgNode>();
    users.forEach((user) => {
      const userId = user.walletAddress.toLowerCase();
      nodeMap.set(userId, {
        ...user,
        id: userId,
        name: user.walletAddress, // Or nickname if available
        personalSales: salesMap.get(userId) || 0,
        teamSales: 0, // Will calculate later
        children: [],
      });
    });

    // 4. Build the tree structure based on referrerWallet
    const roots: OrgNode[] = [];
    nodeMap.forEach((node) => {
      const referrerWallet = node.referrerWallet?.toLowerCase();
      if (referrerWallet && nodeMap.has(referrerWallet)) {
        const parent = nodeMap.get(referrerWallet);
        parent?.children.push(node);
      } else {
        // If no referrer or referrer not found, it's a root node
        roots.push(node);
      }
    });

    // 5. Recursively calculate team sales
    function calculateTeamSales(node: OrgNode, currentLevel: number = 0): number {
      node.level = currentLevel;
      let total = node.personalSales;
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => {
          total += calculateTeamSales(child, currentLevel + 1);
        });
      }
      node.teamSales = total;
      return total;
    }

    roots.forEach((root) => calculateTeamSales(root));

    // Sort roots by team sales descending (optional)
    roots.sort((a, b) => b.teamSales - a.teamSales);

    return roots;
  } catch (error) {
    console.error("Error building org tree:", error);
    return [];
  }
}

/**
 * Converts OrgNode tree to a format compatible with react-d3-tree
 */
export function convertToD3Tree(node: OrgNode): any {
  return {
    name: formatAddress(node.walletAddress),
    fullAddress: node.walletAddress, // Store full address for searching
    attributes: {
      "Personal Sales": `${node.personalSales.toLocaleString()}`,
      "Team Sales": `${node.teamSales.toLocaleString()}`,
      "Directs": node.children.length,
      "Wallet": node.walletAddress,
    },
    children: node.children.map(convertToD3Tree),
    nodeSvgShape: {
      shape: "circle",
      shapeProps: {
        r: 10,
        fill: node.children.length > 0 ? "#4CAF50" : "#2196F3", // Green for team leaders, Blue for leaves
      },
    },
  };
}

function formatAddress(address: string): string {
  if (!address) return "Unknown";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Flattens the organization tree into a CSV string
 */
export function exportOrgDataToCSV(roots: OrgNode[]): string {
  const headers = [
    "Wallet Address",
    "Referral Code",
    "Referrer Wallet",
    "Level",
    "Personal Sales (USDT)",
    "Team Sales (USDT)",
    "Directs Count",
    "Registered At"
  ];

  const rows: string[] = [];
  rows.push(headers.join(","));

  function traverse(node: OrgNode) {
    const row = [
      node.walletAddress,
      node.referralCode || "",
      node.referrerWallet || "",
      node.level?.toString() || "0",
      node.personalSales.toString(),
      node.teamSales.toString(),
      node.children.length.toString(),
      new Date(node.createdAt).toISOString()
    ];
    
    // Escape fields that might contain commas
    const escapedRow = row.map(field => `"${field.replace(/"/g, '""')}"`);
    rows.push(escapedRow.join(","));

    node.children.forEach(traverse);
  }

  roots.forEach(traverse);

  return rows.join("\n");
}
