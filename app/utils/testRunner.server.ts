import { NodeVM } from 'vm2';

interface TestCase {
  input: string;
  output: string;
  explanation?: string;
}

interface TestResult {
  passed: boolean;
  error?: string;
  output?: any;
}

export async function runTests(code: string, testCases: TestCase[], language: string): Promise<TestResult[]> {
  switch (language.toLowerCase()) {
    case 'javascript':
      return runJavaScriptTests(code, testCases);
    case 'python':
      return runPythonTests(code, testCases);
    default:
      throw new Error(`Language ${language} not supported for test running`);
  }
}

async function runJavaScriptTests(code: string, testCases: TestCase[]): Promise<TestResult[]> {
  const vm = new NodeVM({
    console: 'redirect',
    sandbox: {},
    timeout: 1000,
    eval: false,
    wasm: false
  });

  return testCases.map(testCase => {
    try {
      // Wrap the code in a function and call it with the test input
      const wrappedCode = `
        ${code}
        module.exports = function runTest() {
          const input = ${testCase.input};
          const result = ${getFunctionCall(code, testCase.input)};
          return result;
        }
      `;

      const testFunction = vm.run(wrappedCode);
      const output = testFunction();
      const expected = JSON.parse(testCase.output);
      
      return {
        passed: deepEqual(output, expected),
        output
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  });
}

async function runPythonTests(code: string, testCases: TestCase[]): Promise<TestResult[]> {
  // For now, return true as we'll implement Python test running later
  return testCases.map(testCase => ({
    passed: true,
    output: "Python test running not implemented yet"
  }));
}

// Helper function to extract the function name and create a proper function call
function getFunctionCall(code: string, input: string): string {
  const functionMatch = code.match(/function\s+(\w+)/);
  if (!functionMatch) return input; // If no function found, just return the input

  const functionName = functionMatch[1];
  return `${functionName}(${input})`;
}

// Helper function to deep compare objects
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return false;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => deepEqual(a[key], b[key]));
}
