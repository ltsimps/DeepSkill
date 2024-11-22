import { prisma } from '../utils/db.server';
import { llmService } from './llm.server';

interface AssessmentQuestion {
  id: string;
  type: 'mcq' | 'open_ended';
  question: string;
  options?: string[];  // For MCQ
  correctAnswer?: string;  // Hidden from client
  explanation?: string;   // Hidden from client
}

interface SkillAnalysis {
  overallLevel: 'beginner' | 'intermediate' | 'advanced';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export class AssessmentService {
  async createAssessment(userId: string, domainId: string) {
    // Get domain info
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      include: { topics: true }
    });

    if (!domain) throw new Error('Domain not found');

    // Generate assessment questions using LLM
    const prompt = `Create an initial assessment for ${domain.name}. 
    Include a mix of multiple choice and open-ended questions to assess the user's knowledge level.
    Topics to cover: ${domain.topics.map(t => t.name).join(', ')}
    
    Format the response as a JSON array of questions, where each question has:
    - type: "mcq" or "open_ended"
    - question: the question text
    - options: array of choices (for MCQ only)
    - correctAnswer: the correct answer
    - explanation: explanation of the answer
    
    Generate 5-7 questions that will help determine if someone is a beginner, intermediate, or advanced.`;

    const response = await llmService.getResponse({ prompt });
    const questions: AssessmentQuestion[] = JSON.parse(response.content);

    // Create assessment in database
    return await prisma.assessment.create({
      data: {
        userId,
        domainId,
        questions: questions,
        responses: [],
        skillAnalysis: null,
        status: 'IN_PROGRESS'
      }
    });
  }

  async submitResponse(assessmentId: string, questionId: string, response: string) {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId }
    });

    if (!assessment) throw new Error('Assessment not found');

    const questions = assessment.questions as AssessmentQuestion[];
    const responses = assessment.responses as Record<string, string>;
    const question = questions.find(q => q.id === questionId);

    if (!question) throw new Error('Question not found');

    // Update responses
    const updatedResponses = {
      ...responses,
      [questionId]: response
    };

    // Check if all questions are answered
    const isComplete = questions.every(q => updatedResponses[q.id]);

    // Update assessment
    const updatedAssessment = await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        responses: updatedResponses,
        status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: isComplete ? new Date() : null
      }
    });

    // If assessment is complete, analyze skills and generate learning path
    if (isComplete) {
      await this.analyzeSkillsAndCreatePath(assessmentId);
    }

    return updatedAssessment;
  }

  private async analyzeSkillsAndCreatePath(assessmentId: string) {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { domain: true }
    });

    if (!assessment) throw new Error('Assessment not found');

    // Analyze skills using LLM
    const analysisPrompt = `Analyze these assessment responses for ${assessment.domain.name}:
    
    Questions and Responses:
    ${JSON.stringify(assessment.questions)}
    ${JSON.stringify(assessment.responses)}
    
    Provide a skill analysis in JSON format with:
    - overallLevel: "beginner", "intermediate", or "advanced"
    - strengths: array of strong areas
    - weaknesses: array of areas needing improvement
    - recommendations: array of specific learning recommendations`;

    const analysisResponse = await llmService.getResponse({ prompt: analysisPrompt });
    const skillAnalysis: SkillAnalysis = JSON.parse(analysisResponse.content);

    // Generate learning path
    const pathPrompt = `Create a structured learning path for a ${skillAnalysis.overallLevel} in ${assessment.domain.name}.
    
    Student Profile:
    - Strengths: ${skillAnalysis.strengths.join(', ')}
    - Areas for Improvement: ${skillAnalysis.weaknesses.join(', ')}
    
    Create a JSON learning path with:
    - concepts: array of concepts to learn in order
    - estimatedTimePerConcept: time in hours
    - prerequisites: any prerequisites per concept
    - projects: suggested projects to reinforce learning`;

    const pathResponse = await llmService.getResponse({ prompt: pathPrompt });
    const learningPath = JSON.parse(pathResponse.content);

    // Update assessment with analysis and create learning path
    await prisma.$transaction([
      prisma.assessment.update({
        where: { id: assessmentId },
        data: { skillAnalysis }
      }),
      prisma.learningPath.create({
        data: {
          userId: assessment.userId,
          assessmentId,
          concepts: learningPath
        }
      })
    ]);
  }
}

export const assessmentService = new AssessmentService();
