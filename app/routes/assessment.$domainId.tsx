import { json, redirect } from '@remix-run/node';
import { useLoaderData, useNavigation, Form } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { requireUserId } from '~/session.server';
import { assessmentService } from '~/services/assessment.server';
import { useChat } from 'ai/react';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { Progress } from '~/components/ui/progress';
import { Chat } from '~/components/ui/chat';
import { Container, MainContainer, SectionContainer } from '~/components/ui/container';
import { Textarea } from '~/components/ui/textarea';

export const loader = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const { domainId } = params;

  // Check if there's an ongoing assessment
  const ongoingAssessment = await prisma.assessment.findFirst({
    where: {
      userId,
      domainId,
      status: 'IN_PROGRESS'
    },
    include: {
      domain: true
    }
  });

  if (ongoingAssessment) {
    return json({ assessment: ongoingAssessment });
  }

  // Create new assessment
  const newAssessment = await assessmentService.createAssessment(userId, domainId);
  return json({ assessment: newAssessment });
};

export default function AssessmentRoute() {
  const { assessment } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const questions = assessment.questions as AssessmentQuestion[];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const { messages, append, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [{
      id: 'welcome',
      role: 'assistant',
      content: `Welcome to your ${assessment.domain.name} assessment! I'll guide you through some questions to understand your current knowledge level. Let's begin with the first question.`
    }]
  });

  const handleSubmit = async (response: string) => {
    // Submit response to server
    await assessmentService.submitResponse(assessment.id, currentQuestion.id, response);

    // Move to next question or finish
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Assessment complete, redirect to results
      return redirect(`/assessment/${assessment.id}/results`);
    }

    // Add interaction to chat
    await append({
      role: 'assistant',
      content: currentQuestion.type === 'mcq' 
        ? 'Great! Let\'s move on to the next question.'
        : 'Thanks for your detailed response. Let\'s continue with the next question.'
    });
  };

  return (
    <MainContainer>
      <Container>
        <SectionContainer className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">
              {assessment.domain.name} Assessment
            </h1>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chat Interface */}
            <Chat messages={messages} />

            {/* Question Card */}
            <Card className="p-6 space-y-6">
              <h2 className="text-xl font-semibold">
                {currentQuestion.question}
              </h2>

              {currentQuestion.type === 'mcq' ? (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="w-full justify-start h-auto py-3 px-4"
                      onClick={() => handleSubmit(option)}
                      disabled={isLoading}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              ) : (
                <Form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const response = formData.get('response') as string;
                    await handleSubmit(response);
                  }}
                  className="space-y-4"
                >
                  <Textarea
                    name="response"
                    placeholder="Type your answer here..."
                    className="min-h-[200px]"
                    required
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Submitting...' : 'Submit Answer'}
                  </Button>
                </Form>
              )}
            </Card>
          </div>
        </SectionContainer>
      </Container>
    </MainContainer>
  );
}
