import { createFillInProblem, createScenarioProblem } from './seed-utils'

// Easy Problems
export const easyProblems = [
  // FILL_IN Problems
  createFillInProblem({
    title: 'Complete the Array Sum Function',
    difficulty: 'EASY',
    description: 'Complete the function that calculates the sum of all numbers in an array.',
    template: `function arraySum(numbers) {
  let sum = 0;
  for (let i = 0; i < numbers.length; i++) {
    // Fill in the missing code here
    {{CODE_1}}
  }
  return sum;
}`,
    fillInSections: [
      {
        id: 'CODE_1',
        start: 97,
        end: 97,
        solution: 'sum += numbers[i];'
      }
    ],
    hints: ['Think about how to add each number to the sum variable'],
    tags: ['arrays', 'loops', 'basic-math'],
  }),
  
  // SCENARIO Problems
  createScenarioProblem({
    title: 'Find Maximum Number',
    difficulty: 'EASY',
    description: 'Write a function that finds the largest number in an array.',
    startingCode: `function findMax(numbers) {
  // Your code here
}`,
    solution: `function findMax(numbers) {
  if (numbers.length === 0) return null;
  let max = numbers[0];
  for (let num of numbers) {
    if (num > max) max = num;
  }
  return max;
}`,
    testCases: [
      {
        input: '[1, 3, 2, 5, 4]',
        expectedOutput: '5',
        description: 'Should find max in unsorted array'
      },
      {
        input: '[-1, -3, -2, -5, -4]',
        expectedOutput: '-1',
        description: 'Should work with negative numbers'
      }
    ],
    hints: ['Start with the first number as the maximum', 'Compare each number with current maximum'],
    tags: ['arrays', 'loops', 'comparison'],
  }),
  
  // Add more easy problems...
]

// Medium Problems
export const mediumProblems = [
  // FILL_IN Problems
  createFillInProblem({
    title: 'Complete the Binary Search Implementation',
    difficulty: 'MEDIUM',
    description: 'Fill in the missing parts of this binary search implementation.',
    template: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    {{CODE_1}}
    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      {{CODE_2}}
    } else {
      {{CODE_3}}
    }
  }
  return -1;
}`,
    fillInSections: [
      {
        id: 'CODE_1',
        start: 108,
        end: 108,
        solution: 'const mid = Math.floor((left + right) / 2);'
      },
      {
        id: 'CODE_2',
        start: 190,
        end: 190,
        solution: 'left = mid + 1;'
      },
      {
        id: 'CODE_3',
        start: 229,
        end: 229,
        solution: 'right = mid - 1;'
      }
    ],
    hints: [
      'Think about how to calculate the middle index',
      'When the target is greater, we need to search the right half',
      'When the target is smaller, we need to search the left half'
    ],
    tags: ['binary-search', 'algorithms', 'arrays'],
  }),
  
  // SCENARIO Problems
  createScenarioProblem({
    title: 'Implement Queue using Stacks',
    difficulty: 'MEDIUM',
    description: 'Implement a queue using two stacks. The queue should support enqueue and dequeue operations.',
    startingCode: `class Queue {
  constructor() {
    this.stack1 = [];
    this.stack2 = [];
  }
  
  enqueue(element) {
    // Your code here
  }
  
  dequeue() {
    // Your code here
  }
}`,
    solution: `class Queue {
  constructor() {
    this.stack1 = [];
    this.stack2 = [];
  }
  
  enqueue(element) {
    this.stack1.push(element);
  }
  
  dequeue() {
    if (this.stack2.length === 0) {
      while (this.stack1.length > 0) {
        this.stack2.push(this.stack1.pop());
      }
    }
    return this.stack2.pop();
  }
}`,
    testCases: [
      {
        input: `
const q = new Queue();
q.enqueue(1);
q.enqueue(2);
q.dequeue();
q.enqueue(3);
q.dequeue();`,
        expectedOutput: '2',
        description: 'Should maintain FIFO order'
      }
    ],
    hints: [
      'Use one stack for enqueuing',
      'Use another stack for dequeuing',
      'Think about when to transfer elements between stacks'
    ],
    tags: ['stacks', 'queues', 'data-structures'],
  }),
  
  // Add more medium problems...
]

// Hard Problems
export const hardProblems = [
  // FILL_IN Problems
  createFillInProblem({
    title: 'Complete the Red-Black Tree Insertion',
    difficulty: 'HARD',
    description: 'Complete the missing parts of this Red-Black tree insertion implementation.',
    template: `class RedBlackTree {
  insert(value) {
    const node = new Node(value);
    if (!this.root) {
      {{CODE_1}}
      return;
    }
    
    this._insert(this.root, node);
    {{CODE_2}}
  }
  
  _fixInsertion(node) {
    while (node !== this.root && node.parent.color === 'RED') {
      if (node.parent === node.parent.parent.left) {
        const uncle = node.parent.parent.right;
        if (uncle && uncle.color === 'RED') {
          {{CODE_3}}
        } else {
          if (node === node.parent.right) {
            {{CODE_4}}
          }
          {{CODE_5}}
        }
      }
      // Mirror case for right parent
    }
    this.root.color = 'BLACK';
  }
}`,
    fillInSections: [
      {
        id: 'CODE_1',
        start: 108,
        end: 108,
        solution: 'this.root = node;\nthis.root.color = "BLACK";'
      },
      {
        id: 'CODE_2',
        start: 190,
        end: 190,
        solution: 'this._fixInsertion(node);'
      },
      {
        id: 'CODE_3',
        start: 380,
        end: 380,
        solution: 'node.parent.color = "BLACK";\nuncle.color = "BLACK";\nnode.parent.parent.color = "RED";\nnode = node.parent.parent;'
      },
      {
        id: 'CODE_4',
        start: 475,
        end: 475,
        solution: 'node = node.parent;\nthis._rotateLeft(node);'
      },
      {
        id: 'CODE_5',
        start: 520,
        end: 520,
        solution: 'node.parent.color = "BLACK";\nnode.parent.parent.color = "RED";\nthis._rotateRight(node.parent.parent);'
      }
    ],
    hints: [
      'Remember to handle the root node case specially',
      'Color properties must be updated during rotations',
      'Uncle node color affects the recoloring strategy'
    ],
    tags: ['trees', 'red-black-tree', 'balancing'],
    timeLimit: 600,
  }),
  
  // SCENARIO Problems
  createScenarioProblem({
    title: 'Implement A* Pathfinding',
    difficulty: 'HARD',
    description: 'Implement the A* pathfinding algorithm for a 2D grid. The grid contains obstacles (1) and empty cells (0).',
    startingCode: `function findPath(grid, start, end) {
  // Your code here
}

// Helper class if you need it
class Node {
  constructor(x, y, g = 0, h = 0) {
    this.x = x;
    this.y = y;
    this.g = g; // Cost from start to current node
    this.h = h; // Estimated cost from current node to end
    this.f = g + h; // Total cost
    this.parent = null;
  }
}`,
    solution: `function findPath(grid, start, end) {
  const openSet = new Set();
  const closedSet = new Set();
  const startNode = new Node(start[0], start[1]);
  startNode.h = heuristic(start, end);
  openSet.add(startNode);
  
  while (openSet.size > 0) {
    const current = getLowestFScore(openSet);
    if (current.x === end[0] && current.y === end[1]) {
      return reconstructPath(current);
    }
    
    openSet.delete(current);
    closedSet.add(current);
    
    for (const neighbor of getNeighbors(current, grid)) {
      if (closedSet.has(neighbor)) continue;
      
      const tentativeG = current.g + 1;
      if (!openSet.has(neighbor)) {
        openSet.add(neighbor);
      } else if (tentativeG >= neighbor.g) {
        continue;
      }
      
      neighbor.parent = current;
      neighbor.g = tentativeG;
      neighbor.h = heuristic([neighbor.x, neighbor.y], end);
      neighbor.f = neighbor.g + neighbor.h;
    }
  }
  
  return null; // No path found
}

function heuristic(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

function getLowestFScore(openSet) {
  return Array.from(openSet).reduce((lowest, node) => 
    !lowest || node.f < lowest.f ? node : lowest, null);
}

function getNeighbors(node, grid) {
  const neighbors = [];
  const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  
  for (const [dx, dy] of dirs) {
    const x = node.x + dx;
    const y = node.y + dy;
    if (x >= 0 && x < grid.length && y >= 0 && y < grid[0].length && grid[x][y] === 0) {
      neighbors.push(new Node(x, y));
    }
  }
  return neighbors;
}

function reconstructPath(endNode) {
  const path = [];
  let current = endNode;
  while (current) {
    path.unshift([current.x, current.y]);
    current = current.parent;
  }
  return path;
}`,
    testCases: [
      {
        input: `
const grid = [
  [0, 0, 0, 1],
  [1, 1, 0, 1],
  [0, 0, 0, 0]
];
findPath(grid, [0, 0], [2, 3]);`,
        expectedOutput: '[[0,0],[0,1],[0,2],[1,2],[2,2],[2,3]]',
        description: 'Should find path around obstacles'
      }
    ],
    hints: [
      'Use Manhattan distance for the heuristic',
      'Keep track of both open and closed sets',
      'Remember to update g, h, and f scores for each node'
    ],
    tags: ['pathfinding', 'graphs', 'algorithms'],
    timeLimit: 900,
  }),
  
  // Add more hard problems...
]
