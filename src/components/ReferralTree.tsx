/**
 * ReferralTree – visual mini-map of the user's direct referral network.
 * Shows the current user at the centre with spokes to each direct referral,
 * each labelled with a short address and their personal investment amount.
 */
import { useMemo } from "react";
import { formatAddress } from "@/lib/utils";

interface TreeNode {
  wallet: string;
  personalPerformance: number;
}

interface Props {
  rootWallet: string;
  referrals: TreeNode[];
}

// Angle degrees → radians
const deg2rad = (d: number) => (d * Math.PI) / 180;

export function ReferralTree({ rootWallet, referrals }: Props) {
  const W = 340;
  const H = 260;
  const cx = W / 2;
  const cy = H / 2;
  const radius = 90;

  const nodes = useMemo(() => {
    const count = referrals.length;
    if (count === 0) return [];
    return referrals.map((ref, i) => {
      const angle = deg2rad((360 / count) * i - 90);
      return {
        ...ref,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
  }, [referrals, cx, cy, radius]);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-sm mx-auto"
        aria-label="Referral tree visualization"
      >
        {/* Spokes */}
        {nodes.map((node) => (
          <line
            key={node.wallet + "_line"}
            x1={cx}
            y1={cy}
            x2={node.x}
            y2={node.y}
            stroke="hsl(var(--border))"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        ))}

        {/* Leaf nodes */}
        {nodes.map((node) => {
          const isTop = node.personalPerformance > 0;
          return (
            <g key={node.wallet + "_node"}>
              <circle
                cx={node.x}
                cy={node.y}
                r={16}
                fill={isTop ? "hsl(var(--primary))" : "hsl(var(--muted))"}
                opacity={0.85}
              />
              <text
                x={node.x}
                y={node.y - 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="7"
                fill={isTop ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))"}
                fontFamily="monospace"
              >
                {formatAddress(node.wallet).slice(0, 8)}
              </text>
              {isTop && (
                <text
                  x={node.x}
                  y={node.y + 8}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="6.5"
                  fill="hsl(var(--primary-foreground))"
                  fontFamily="sans-serif"
                >
                  ${node.personalPerformance.toFixed(0)}
                </text>
              )}
            </g>
          );
        })}

        {/* Root node */}
        <circle cx={cx} cy={cy} r={24} fill="hsl(var(--primary))" opacity={0.95} />
        <text
          x={cx}
          y={cy - 3}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="7.5"
          fill="hsl(var(--primary-foreground))"
          fontFamily="monospace"
        >
          {formatAddress(rootWallet).slice(0, 10)}
        </text>
        <text
          x={cx}
          y={cy + 9}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="7"
          fill="hsl(var(--primary-foreground))"
          opacity={0.8}
        >
          YOU
        </text>

        {/* Empty state */}
        {nodes.length === 0 && (
          <text
            x={cx}
            y={cy + 40}
            textAnchor="middle"
            fontSize="10"
            fill="hsl(var(--muted-foreground))"
          >
            No referrals yet
          </text>
        )}
      </svg>
    </div>
  );
}
