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
    baseComplexity: 0.5,
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
    baseComplexity: 0.6,
  }),
  
  // JavaScript Problems
  createScenarioProblem({
    title: 'Find Maximum Number',
    difficulty: 'EASY',
    language: 'javascript',
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
    testCases: ['[1, 3, 2, 5, 4]'],
    hints: ['Initialize max with the first element', 'Loop through the array', 'Compare each number with max'],
    tags: ['arrays', 'loops'],
  }),

  createScenarioProblem({
    title: 'Sum Array Elements',
    difficulty: 'EASY',
    language: 'javascript',
    description: 'Write a function that calculates the sum of all numbers in an array.',
    startingCode: `function arraySum(numbers) {
  // Your code here
}`,
    solution: `function arraySum(numbers) {
  return numbers.reduce((sum, num) => sum + num, 0);
}`,
    testCases: ['[1, 2, 3, 4, 5]'],
    hints: ['Use reduce or a for loop', 'Start with sum = 0'],
    tags: ['arrays', 'reduce'],
  }),

  // Python Problems
  createScenarioProblem({
    title: 'Fibonacci Sequence',
    difficulty: 'EASY',
    language: 'python',
    description: 'Write a function that generates the first n numbers of the Fibonacci sequence.',
    startingCode: `def fibonacci_sequence(n):
    # Your code here
    pass`,
    solution: `def fibonacci_sequence(n):
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    elif n == 2:
        return [0, 1]
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    return fib`,
    testCases: ['5'],
    hints: ['Start with [0, 1]', 'Each number is sum of previous two'],
    tags: ['sequences', 'loops'],
  }),

  createScenarioProblem({
    title: 'Reverse String',
    difficulty: 'EASY',
    language: 'python',
    description: 'Write a function that reverses a string.',
    startingCode: `def reverse_string(s):
    # Your code here
    pass`,
    solution: `def reverse_string(s):
    return s[::-1]`,
    testCases: ['"hello"'],
    hints: ['Use string slicing', 'Or convert to list and reverse'],
    tags: ['strings'],
  }),
];

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
    baseComplexity: 1.2,
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
    baseComplexity: 1.4,
  }),
  
  // JavaScript Problems
  createScenarioProblem({
    title: 'Valid Parentheses',
    difficulty: 'MEDIUM',
    language: 'javascript',
    description: 'Write a function that determines if a string of parentheses is valid.',
    startingCode: `function isValidParentheses(s) {
  // Your code here
}`,
    solution: `function isValidParentheses(s) {
  const stack = [];
  for (let char of s) {
    if (char === '(') {
      stack.push(char);
    } else if (char === ')') {
      if (stack.length === 0) return false;
      stack.pop();
    }
  }
  return stack.length === 0;
}`,
    testCases: ['(())', '()()', '(()'],
    hints: ['Use a stack', 'Track opening brackets'],
    tags: ['stacks', 'strings'],
  }),

  createScenarioProblem({
    title: 'Binary Search',
    difficulty: 'MEDIUM',
    language: 'javascript',
    description: 'Implement binary search to find a number in a sorted array.',
    startingCode: `function binarySearch(arr, target) {
  // Your code here
}`,
    solution: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
    testCases: ['[1,2,3,4,5], 3', '[1,2,3,4,5], 6'],
    hints: ['Keep track of left and right bounds', 'Compare with middle element'],
    tags: ['binary-search', 'arrays'],
  }),

  // Python Problems
  createScenarioProblem({
    title: 'Merge Sort',
    difficulty: 'MEDIUM',
    language: 'python',
    description: 'Implement the merge sort algorithm.',
    startingCode: `def merge_sort(arr):
    # Your code here
    pass`,
    solution: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
        
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
            
    result.extend(left[i:])
    result.extend(right[j:])
    return result`,
    testCases: ['[64, 34, 25, 12, 22, 11, 90]'],
    hints: ['Divide array in half', 'Recursively sort', 'Merge sorted halves'],
    tags: ['sorting', 'recursion'],
  }),

  createScenarioProblem({
    title: 'Find All Anagrams',
    difficulty: 'MEDIUM',
    language: 'python',
    description: 'Write a function that finds all anagrams of a pattern in a string.',
    startingCode: `def find_anagrams(s, p):
    # Your code here
    pass`,
    solution: `def find_anagrams(s, p):
    result = []
    if len(p) > len(s):
        return result
        
    p_count = {}
    window = {}
    
    for char in p:
        p_count[char] = p_count.get(char, 0) + 1
        
    for i in range(len(p)):
        char = s[i]
        window[char] = window.get(char, 0) + 1
        
    if window == p_count:
        result.append(0)
        
    for i in range(len(p), len(s)):
        # Remove leftmost character
        left_char = s[i - len(p)]
        window[left_char] -= 1
        if window[left_char] == 0:
            del window[left_char]
            
        # Add new character
        right_char = s[i]
        window[right_char] = window.get(right_char, 0) + 1
        
        if window == p_count:
            result.append(i - len(p) + 1)
            
    return result`,
    testCases: ['"cbaebabacd", "abc"'],
    hints: ['Use sliding window', 'Compare character frequencies'],
    tags: ['strings', 'hash-table'],
  }),
];

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
    baseComplexity: 1.8,
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
    baseComplexity: 2.0,
  }),
  
  // JavaScript Problems
  createScenarioProblem({
    title: 'LRU Cache',
    difficulty: 'HARD',
    language: 'javascript',
    description: 'Implement an LRU (Least Recently Used) cache.',
    startingCode: `class LRUCache {
  constructor(capacity) {
    // Your code here
  }
  
  get(key) {
    // Your code here
  }
  
  put(key, value) {
    // Your code here
  }
}`,
    solution: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }
  
  get(key) {
    if (!this.cache.has(key)) return -1;
    
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }
  
  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, value);
  }
}`,
    testCases: ['["LRUCache","put","put","get","put","get","put","get","get","get"], [[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]'],
    hints: ['Use Map for O(1) operations', 'Track capacity', 'Remove least recently used'],
    tags: ['cache', 'hash-table'],
  }),

  // Python Problems
  createScenarioProblem({
    title: 'Minimum Window Substring',
    difficulty: 'HARD',
    language: 'python',
    description: 'Find the minimum window in a string that contains all characters of another string.',
    startingCode: `def min_window(s, t):
    # Your code here
    pass`,
    solution: `def min_window(s, t):
    if not t or not s:
        return ""

    dict_t = {}
    for c in t:
        dict_t[c] = dict_t.get(c, 0) + 1

    required = len(dict_t)
    formed = 0
    window_counts = {}
    
    ans = float("inf"), None, None
    l = 0
    
    for r in range(len(s)):
        character = s[r]
        window_counts[character] = window_counts.get(character, 0) + 1
        
        if character in dict_t and window_counts[character] == dict_t[character]:
            formed += 1
            
        while l <= r and formed == required:
            character = s[l]
            
            if r - l + 1 < ans[0]:
                ans = (r - l + 1, l, r)
                
            window_counts[character] -= 1
            if character in dict_t and window_counts[character] < dict_t[character]:
                formed -= 1
                
            l += 1
    
    return "" if ans[0] == float("inf") else s[ans[1]:ans[2] + 1]`,
    testCases: ['"ADOBECODEBANC", "ABC"'],
    hints: ['Use sliding window', 'Track character frequencies', 'Optimize window size'],
    tags: ['strings', 'sliding-window'],
  }),
];
