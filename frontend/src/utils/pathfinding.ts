import { Component } from '../models/Component';

export interface Point {
  x: number;
  y: number;
}

const GRID_SIZE = 20;

// Returns coordinates normalized to our 20px grid
function snapToGrid(val: number): number {
  return Math.round(val / GRID_SIZE) * GRID_SIZE;
}

/**
 * Gets a set of grid cells that a component occupies, with some padding.
 */
function getComponentObstacles(components: Component[]): Set<string> {
  const obstacles = new Set<string>();
  
  components.forEach(comp => {
    // Standard component roughly 120x80 or similar.
    // We add padding so wires don't touch the edge.
    const PADDING = 20;
    const startX = snapToGrid(comp.position.x - PADDING);
    const startY = snapToGrid(comp.position.y - PADDING);
    const endX = snapToGrid(comp.position.x + 120 + PADDING); // Assuming max width 120
    const endY = snapToGrid(comp.position.y + 80 + PADDING);  // Assuming max height 80

    for (let x = startX; x <= endX; x += GRID_SIZE) {
      for (let y = startY; y <= endY; y += GRID_SIZE) {
        obstacles.add(`${x},${y}`);
      }
    }
  });

  return obstacles;
}

// A* Node
class AStarNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: AStarNode | null;

  constructor(x: number, y: number, parent: AStarNode | null = null, g = 0, h = 0) {
    this.x = x;
    this.y = y;
    this.parent = parent;
    this.g = g;
    this.h = h;
    this.f = g + h;
  }
}

/**
 * Finds an orthogonal path from (x1,y1) to (x2,y2) routing around components.
 * Returns an array of points [x1, y1, x2, y2, ...]
 */
export function findOrthogonalPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  components: Component[]
): number[] {
  // 1. Setup Grid constraints
  const MIN_X = -200;
  const MAX_X = 1800; // allow routing outside the normal canvas slightly
  const MIN_Y = -200;
  const MAX_Y = 1200;

  const startPt = { x: snapToGrid(startX), y: snapToGrid(startY) };
  const endPt = { x: snapToGrid(endX), y: snapToGrid(endY) };

  // 2. Identify obstacles
  const obstacles = getComponentObstacles(components);
  // Un-block the start and end points so we can actually escape them!
  const directions = [
    { x: 0, y: -GRID_SIZE },
    { x: 0, y: GRID_SIZE },
    { x: -GRID_SIZE, y: 0 },
    { x: GRID_SIZE, y: 0 },
  ];

  // We must allow the immediate area around ports to be free
  for (const dir of directions) {
    obstacles.delete(`${startPt.x + dir.x},${startPt.y + dir.y}`);
    obstacles.delete(`${endPt.x + dir.x},${endPt.y + dir.y}`);
  }
  obstacles.delete(`${startPt.x},${startPt.y}`);
  obstacles.delete(`${endPt.x},${endPt.y}`);

  // 3. A* Search
  const openList: AStarNode[] = [];
  const closedSet = new Set<string>();

  const startNode = new AStarNode(startPt.x, startPt.y, null, 0, getManhattanDst(startPt, endPt));
  openList.push(startNode);

  while (openList.length > 0) {
    // Pop node with lowest F score
    openList.sort((a, b) => a.f - b.f);
    const current = openList.shift()!;
    const currentKey = `${current.x},${current.y}`;

    if (current.x === endPt.x && current.y === endPt.y) {
      return reconstructPath(current, startX, startY, endX, endY);
    }

    closedSet.add(currentKey);

    for (const dir of directions) {
      const neighborX = current.x + dir.x;
      const neighborY = current.y + dir.y;
      const neighborKey = `${neighborX},${neighborY}`;

      // Out of bounds or obstacle
      if (
        neighborX < MIN_X || neighborX > MAX_X ||
        neighborY < MIN_Y || neighborY > MAX_Y ||
        closedSet.has(neighborKey) ||
        obstacles.has(neighborKey)
      ) {
        continue;
      }

      // We add a penalty for changing direction so we get fewer bends
      let directionChangePenalty = 0;
      if (current.parent) {
        const pdx = current.x - current.parent.x;
        const pdy = current.y - current.parent.y;
        if (pdx !== dir.x || pdy !== dir.y) {
           directionChangePenalty = GRID_SIZE * 5; // 5 units cost for bending
        }
      }

      const g = current.g + GRID_SIZE + directionChangePenalty;
      const h = getManhattanDst({x: neighborX, y: neighborY}, endPt);
      
      const existingNode = openList.find(n => n.x === neighborX && n.y === neighborY);
      
      if (!existingNode) {
        openList.push(new AStarNode(neighborX, neighborY, current, g, h));
      } else if (g < existingNode.g) {
        existingNode.g = g;
        existingNode.parent = current;
        existingNode.f = g + h;
      }
    }
  }

  // Fallback: If no path found (circuit blocked), return simple midpoint L-shape
  const midX = (startX + endX) / 2;
  return [startX, startY, midX, startY, midX, endY, endX, endY];
}

function getManhattanDst(p1: Point, p2: Point) {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

function reconstructPath(
  endNode: AStarNode, 
  originalStartX: number, 
  originalStartY: number,
  originalEndX: number,
  originalEndY: number
): number[] {
  let curr: AStarNode | null = endNode;
  const path: Point[] = [];
  
  while (curr) {
    path.push({ x: curr.x, y: curr.y });
    curr = curr.parent;
  }
  
  path.reverse();

  // Optimise path to only include corner points
  const optimized: Point[] = [path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const next = path[i + 1];

    // If changing direction
    if ((prev.x !== next.x && prev.y !== next.y)) {
      optimized.push(curr);
    }
  }
  optimized.push(path[path.length - 1]);

  // Adjust exact endpoints so they attach perfectly to the port (not grid-snapped)
  if (optimized.length > 0) {
    optimized[0] = { x: originalStartX, y: originalStartY };
    optimized[optimized.length - 1] = { x: originalEndX, y: originalEndY };
  }

  const result: number[] = [];
  optimized.forEach(pt => {
    result.push(pt.x, pt.y);
  });
  return result;
}
