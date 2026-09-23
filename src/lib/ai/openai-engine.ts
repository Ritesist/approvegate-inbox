import { TicketThread, TriageData, DraftReplyData } from '../types';
import { runMockTriage } from './mock-engine';

export async function runOpenAITriage(
  thread: TicketThread,
  apiKey?: string,
  model = 'gpt-4o-mini'
): Promise<{ triage: TriageData; draft: DraftReplyData }> {
  const effectiveKey = apiKey || process.env.OPENAI_API_KEY;
  if (!effectiveKey) {
    return runMockTriage(thread);
  }

  const systemPrompt = `You are ApproveGate AI Butler, an enterprise support triage intelligence engine.
Your task is to analyze an incoming customer support email or ticket, triage it with precision, and draft a high-quality human-ready reply with suggested next actions.

Constraints:
1. Priority must be strictly one of: "P0", "P1", "P2", "P3".
   - P0: Immediate emergency, critical service outage, security exploit, massive immediate churn or legal risk.
   - P1: High priority bug affecting many users, significant billing dispute, high-value enterprise sales prospect, urgent legal notice.
   - P2: Moderate bug with workaround, standard billing inquiry, product question.
   - P3: Minor cosmetic typo, low priority feature request, automated FYI, out of office, newsletter, spam.
2. Category must be strictly one of: "billing", "bug", "sales", "FYI", "other".
3. DO NOT use emojis anywhere in your response or draft text.
4. Provide a professional, ready-to-send draft reply suitable for human operator review and sign-off.
5. Provide 2-3 specific suggested next actions.

Output strictly valid JSON with this exact schema:
{
  "priority": "P0" | "P1" | "P2" | "P3",
  "category": "billing" | "bug" | "sales" | "FYI" | "other",
  "summary": "1-2 sentence crisp breakdown",
  "suggestedOwner": "Team name",
  "dueHours": number,
  "sentiment": "positive" | "neutral" | "frustrated" | "urgent",
  "confidence": number,
  "reasoning": "Detailed justification",
  "draft": {
    "body": "Ready-to-send reply message",
    "tone": "professional" | "apologetic" | "technical" | "direct",
    "suggestedActions": [
      { "id": "act-1", "title": "Action title", "type": "action" | "escalation" | "refund" | "investigation" | "archive", "systemTarget": "System name" }
    ]
  }
}`;

  const userPrompt = `Subject: ${thread.subject}
From: ${thread.from.name} <${thread.from.email}> (${thread.from.company || 'Unknown Company'})
Customer Tier: ${thread.customerTier}
Tags: ${thread.tags.join(', ')}
Body:
${thread.rawBody}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${effectiveKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.warn(`OpenAI API failed with status ${response.status}. Falling back to mock engine.`);
      return runMockTriage(thread);
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    const receivedDate = new Date(thread.receivedAt || new Date().toISOString());
    const dueDate = new Date(receivedDate.getTime() + (parsed.dueHours || 24) * 3600 * 1000);

    const triage: TriageData = {
      priority: parsed.priority || 'P2',
      category: parsed.category || 'other',
      summary: parsed.summary || thread.subject,
      suggestedOwner: parsed.suggestedOwner || 'Tier 1 Support',
      dueBy: dueDate.toISOString(),
      sentiment: parsed.sentiment || 'neutral',
      confidence: parsed.confidence || 0.9,
      reasoning: parsed.reasoning || 'Classified via OpenAI model.',
    };

    const draft: DraftReplyData = {
      id: `draft-${thread.id}`,
      threadId: thread.id,
      recipient: thread.from.email,
      subject: thread.subject.startsWith('Re:') ? thread.subject : `Re: ${thread.subject}`,
      body: parsed.draft?.body || 'Thank you for reaching out. We are reviewing your ticket.',
      tone: parsed.draft?.tone || 'professional',
      suggestedActions: (parsed.draft?.suggestedActions || []).map((a: any, i: number) => ({
        id: a.id || `act-${i + 1}`,
        title: a.title,
        type: a.type || 'action',
        completed: false,
        systemTarget: a.systemTarget || 'ApproveGate',
      })),
      version: 1,
      lastModifiedAt: new Date().toISOString(),
      lastModifiedBy: 'ai',
    };

    return { triage, draft };
  } catch (err) {
    console.warn('OpenAI request error, falling back to mock engine:', err);
    return runMockTriage(thread);
  }
}
