import WebSocket from 'ws';
import { env } from '~/env.server';

interface VoiceSessionConfig {
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  instructions?: string;
  inputAudioTranscription?: boolean;
  tools?: any[];
}

export class VoiceService {
  private ws: WebSocket | null = null;
  private messageQueue: string[] = [];
  private onMessageCallbacks: ((data: any) => void)[] = [];

  async connect(config: VoiceSessionConfig = {}) {
    const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
    
    this.ws = new WebSocket(url, {
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1",
      },
    });

    this.ws.on("open", () => {
      console.log("Connected to OpenAI Realtime API");
      
      // Configure session with practice-related tools
      this.ws?.send(JSON.stringify({
        type: "session.update",
        session: {
          voice: config.voice || 'shimmer',
          instructions: config.instructions || `
            You are an intelligent AI tutor helping students learn. 
            Use a friendly, encouraging tone and provide clear explanations.
            When students need help, first try to guide them with hints before revealing answers.
            Use appropriate tools to track progress and provide personalized feedback.
            Speak naturally and conversationally, but maintain a professional teaching demeanor.
          `,
          input_audio_transcription: config.inputAudioTranscription ?? true,
          tools: config.tools || [
            {
              name: "start_practice_session",
              description: "Start a practice session for a specific domain",
              parameters: {
                type: "object",
                properties: {
                  domainId: { type: "string", description: "The ID of the domain to practice" },
                  difficulty: { 
                    type: "string",
                    enum: ["EASY", "MEDIUM", "HARD"],
                    description: "Preferred difficulty level"
                  }
                },
                required: ["domainId"]
              }
            },
            {
              name: "submit_solution",
              description: "Submit a solution for evaluation",
              parameters: {
                type: "object",
                properties: {
                  code: { type: "string", description: "The code solution to evaluate" },
                  problemId: { type: "string", description: "The ID of the problem" }
                },
                required: ["code", "problemId"]
              }
            },
            {
              name: "request_hint",
              description: "Get a hint for the current problem",
              parameters: {
                type: "object",
                properties: {
                  problemId: { type: "string", description: "The ID of the problem" },
                  hintLevel: { 
                    type: "integer",
                    description: "Level of hint detail (1-3, where 1 is subtle and 3 is very detailed)",
                    minimum: 1,
                    maximum: 3
                  }
                },
                required: ["problemId"]
              }
            },
            {
              name: "show_solution",
              description: "Show the solution with explanation. Only use after multiple failed attempts.",
              parameters: {
                type: "object",
                properties: {
                  problemId: { type: "string", description: "The ID of the problem" },
                  includeExplanation: { 
                    type: "boolean",
                    description: "Whether to include a detailed explanation"
                  }
                },
                required: ["problemId"]
              }
            },
            {
              name: "track_progress",
              description: "Update learning progress for the current session",
              parameters: {
                type: "object",
                properties: {
                  userId: { type: "string" },
                  domainId: { type: "string" },
                  metrics: {
                    type: "object",
                    properties: {
                      timeSpent: { type: "number" },
                      attemptsCount: { type: "number" },
                      success: { type: "boolean" }
                    }
                  }
                },
                required: ["userId", "domainId", "metrics"]
              }
            }
          ]
        },
      }));

      // Send any queued messages
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        if (message) this.ws?.send(message);
      }
    });

    this.ws.on("message", (data) => {
      try {
        const event = JSON.parse(data.toString());
        this.handleEvent(event);
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    });

    this.ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    this.ws.on("close", () => {
      console.log("Connection closed");
      this.ws = null;
    });
  }

  private handleEvent(event: any) {
    switch (event.type) {
      case "error":
        console.error("OpenAI API error:", event.error);
        break;
      
      case "conversation.item.created":
        if (event.item.type === "message" && event.item.role === "assistant") {
          // Handle assistant messages
          const content = event.item.content;
          content.forEach((item: any) => {
            if (item.type === "text") {
              console.log("Assistant text:", item.text);
            } else if (item.type === "audio") {
              // Handle audio output
              console.log("Received audio chunk");
            }
          });
        } else if (event.item.type === "function_call") {
          // Handle function calls from the assistant
          this.handleFunctionCall(event.item);
        }
        break;
      
      case "response.function_call_arguments.done":
        // Function call is complete, execute it
        this.executeFunctionCall(
          event.name,
          JSON.parse(event.arguments),
          event.call_id
        );
        break;
    }

    // Notify all callbacks
    this.onMessageCallbacks.forEach(callback => callback(event));
  }

  private async handleFunctionCall(item: any) {
    const { name, arguments: args, call_id } = item;
    
    try {
      const result = await this.executeFunctionCall(name, args, call_id);
      
      // Send function result back to the conversation
      this.ws?.send(JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id,
          output: JSON.stringify(result)
        }
      }));

      // Generate a new response based on the function output
      this.ws?.send(JSON.stringify({
        type: "response.create"
      }));
    } catch (error) {
      console.error(`Error executing function ${name}:`, error);
    }
  }

  private async executeFunctionCall(name: string, args: any, callId: string) {
    switch (name) {
      case "start_practice_session":
        return await practiceScheduler.getNextProblem({
          userId: args.userId,
          domainId: args.domainId,
          preferredLanguages: args.preferredLanguages
        });

      case "submit_solution":
        const response = await fetch('/api/evaluate-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args)
        });
        return await response.json();

      case "request_hint":
        // Get problem details and generate appropriate hint
        const problem = await prisma.problem.findUnique({
          where: { id: args.problemId }
        });
        return {
          hint: await llmService.generateHint(problem, args.hintLevel || 1)
        };

      case "show_solution":
        const problemWithSolution = await prisma.problem.findUnique({
          where: { id: args.problemId },
          include: { solution: true }
        });
        return {
          solution: problemWithSolution.solution,
          explanation: args.includeExplanation ? 
            await llmService.explainSolution(problemWithSolution) : null
        };

      case "track_progress":
        return await practiceScheduler.updateLearningMetrics(
          args.userId,
          args.domainId,
          args.metrics
        );

      default:
        throw new Error(`Unknown function: ${name}`);
    }
  }

  async sendText(text: string) {
    const message = JSON.stringify({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{
          type: "input_text",
          text
        }]
      }
    });

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      this.messageQueue.push(message);
    }
  }

  async sendAudio(audioBase64: string) {
    const message = JSON.stringify({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{
          type: "input_audio",
          audio: audioBase64
        }]
      }
    });

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      this.messageQueue.push(message);
    }
  }

  onMessage(callback: (data: any) => void) {
    this.onMessageCallbacks.push(callback);
    return () => {
      const index = this.onMessageCallbacks.indexOf(callback);
      if (index > -1) {
        this.onMessageCallbacks.splice(index, 1);
      }
    };
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
    this.messageQueue = [];
    this.onMessageCallbacks = [];
  }
}

export const voiceService = new VoiceService();
