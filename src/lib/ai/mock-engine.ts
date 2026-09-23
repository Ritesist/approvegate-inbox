import { TicketThread, TriageData, DraftReplyData, Priority, Category, SuggestedAction } from '../types';

interface TriageRule {
  keywords: RegExp[];
  priority: Priority;
  category: Category;
  owner: string;
  dueHours: number;
  sentiment: 'positive' | 'neutral' | 'frustrated' | 'urgent';
  reasoning: string;
}

const TRIAGE_RULES: TriageRule[] = [
  // P0 - Critical outages & active security breaches
  {
    keywords: [/500 errors across all/i, /db_pool_exhausted/i, /losing roughly \$[0-9]/i, /checkout pipeline is failing/i],
    priority: 'P0',
    category: 'bug',
    owner: 'Core Platform Engineering',
    dueHours: 1,
    sentiment: 'urgent',
    reasoning: 'Critical customer-facing checkout failure causing active revenue loss. Highest incident severity.',
  },
  {
    keywords: [/ssrf/i, /vulnerability/i, /aws metadata/i, /responsible disclosure/i],
    priority: 'P0',
    category: 'bug',
    owner: 'Security & Compliance',
    dueHours: 2,
    sentiment: 'urgent',
    reasoning: 'High-severity server-side vulnerability with cloud credential exposure risk.',
  },
  {
    keywords: [/suspicious mass export/i, /soc-alerts/i, /anomalous behavior/i, /session has been temporarily quarantined/i],
    priority: 'P0',
    category: 'other',
    owner: 'Security Operations',
    dueHours: 1,
    sentiment: 'urgent',
    reasoning: 'Critical security alert indicating potential account takeover and bulk data exfiltration.',
  },
  {
    keywords: [/database connection leak/i, /crash loop/i, /fatal: remaining connection slots/i, /worker-east-pool/i],
    priority: 'P0',
    category: 'bug',
    owner: 'Site Reliability Engineering',
    dueHours: 1,
    sentiment: 'urgent',
    reasoning: 'Infrastructure crash loop affecting backend webhook processing cluster.',
  },
  {
    keywords: [/unauthorized charge of \$4,200/i, /chargeback and initiate vendor termination/i, /file an immediate chargeback/i],
    priority: 'P0',
    category: 'billing',
    owner: 'Billing Ops',
    dueHours: 2,
    sentiment: 'frustrated',
    reasoning: 'High-dollar unauthorized billing dispute with immediate chargeback and churn threat.',
  },
  {
    keywords: [/churn escalation/i, /three consecutive downtime incidents/i, /sla credit proposal/i, /migrating to your competitor/i],
    priority: 'P0',
    category: 'other',
    owner: 'Customer Success Leadership',
    dueHours: 2,
    sentiment: 'frustrated',
    reasoning: 'Executive VIP churn risk requiring high-touch leadership escalation and SLA resolution.',
  },

  // P1 - High priority billing, major bugs, enterprise sales, legal demands
  {
    keywords: [/okta saml/i, /sso login loop/i, /invalid audience restriction/i, /none of our 120 employees can log in/i],
    priority: 'P1',
    category: 'bug',
    owner: 'IAM & Integration Team',
    dueHours: 4,
    sentiment: 'urgent',
    reasoning: 'Enterprise workforce blocked from logging into the workspace due to SSO failure.',
  },
  {
    keywords: [/trademark infringement/i, /cease and desist/i, /injunctive proceedings/i, /reg\. #[0-9]/i],
    priority: 'P1',
    category: 'other',
    owner: 'Legal & Compliance',
    dueHours: 8,
    sentiment: 'urgent',
    reasoning: 'Formal trademark legal notice demanding ad takedown within 48 hours.',
  },
  {
    keywords: [/double charged/i, /refund the duplicate payment/i, /charged twice/i],
    priority: 'P1',
    category: 'billing',
    owner: 'Billing Ops',
    dueHours: 4,
    sentiment: 'frustrated',
    reasoning: 'Direct duplicate billing transaction requiring payment refund verification.',
  },
  {
    keywords: [/500 seat rollout/i, /enterprise procurement rfp/i, /soc2 type ii/i, /standard vendor questionnaire/i],
    priority: 'P1',
    category: 'sales',
    owner: 'Enterprise Sales',
    dueHours: 6,
    sentiment: 'neutral',
    reasoning: 'Large enterprise expansion deal (500 seats) with time-sensitive procurement questionnaire.',
  },
  {
    keywords: [/migration from intercom to approvegate/i, /80 support reps/i, /preventing ai hallucinations/i],
    priority: 'P1',
    category: 'sales',
    owner: 'Enterprise Sales',
    dueHours: 6,
    sentiment: 'neutral',
    reasoning: 'High-value displacement sales opportunity for an 80-seat support team.',
  },
  {
    keywords: [/250,000 support triage events/i, /committed-use volume/i, /enterprise sla agreement/i],
    priority: 'P1',
    category: 'sales',
    owner: 'Enterprise Sales',
    dueHours: 8,
    sentiment: 'neutral',
    reasoning: 'High-volume contract tier inquiry exceeding standard automated plans.',
  },
  {
    keywords: [/schedule a 30-minute tailored product demo/i, /40,000 inbound tickets/i, /vp of customer experience/i],
    priority: 'P1',
    category: 'sales',
    owner: 'Enterprise Sales',
    dueHours: 8,
    sentiment: 'positive',
    reasoning: 'Inbound enterprise demo inquiry from high-volume CX leadership.',
  },
  {
    keywords: [/storage usage exceeded 90%/i, /automatic cleanup cycle will initiate/i, /s3-monitor/i],
    priority: 'P1',
    category: 'bug',
    owner: 'Site Reliability Engineering',
    dueHours: 4,
    sentiment: 'urgent',
    reasoning: 'Critical storage threshold reached that will trigger data deletion or ingestion throttling.',
  },
  {
    keywords: [/data processing addendum/i, /dpa/i, /gdpr standard contractual clauses/i, /eea/i],
    priority: 'P1',
    category: 'other',
    owner: 'Legal & Compliance',
    dueHours: 12,
    sentiment: 'neutral',
    reasoning: 'Regulatory compliance agreement requested prior to enterprise contract execution.',
  },
  {
    keywords: [/vies validation error/i, /vat exempt status/i, /reverse-charge vat/i],
    priority: 'P1',
    category: 'billing',
    owner: 'Billing Ops',
    dueHours: 6,
    sentiment: 'frustrated',
    reasoning: 'Checkout failure due to international VAT tax calculation error.',
  },
  {
    keywords: [/cancellation of our subscription/i, /cancel our subscription before auto-renew/i],
    priority: 'P1',
    category: 'billing',
    owner: 'Retention & Billing',
    dueHours: 6,
    sentiment: 'neutral',
    reasoning: 'Time-critical subscription cancellation request before renewal billing date.',
  },
  {
    keywords: [/gateway timeout on 90-day queries/i, /export audit log/i, /http 504/i],
    priority: 'P1',
    category: 'bug',
    owner: 'Platform Engineering',
    dueHours: 6,
    sentiment: 'frustrated',
    reasoning: 'Enterprise audit reporting timeout preventing regulatory audit export.',
  },

  // P2 - Moderate bugs, standard billing inquiries, operational requests
  {
    keywords: [/safari 17/i, /export csv button/i, /only the first 50 rows/i],
    priority: 'P2',
    category: 'bug',
    owner: 'Frontend Engineering',
    dueHours: 24,
    sentiment: 'frustrated',
    reasoning: 'Browser-specific export regression affecting weekly reporting workflows.',
  },
  {
    keywords: [/github sync disconnects/i, /installation access token/i, /reconnect github/i],
    priority: 'P2',
    category: 'bug',
    owner: 'Integrations Team',
    dueHours: 24,
    sentiment: 'frustrated',
    reasoning: 'OAuth / GitHub token lifecycle issue causing recurring disconnects.',
  },
  {
    keywords: [/webhook deliveries failing silently/i, /413 payload too large/i],
    priority: 'P2',
    category: 'bug',
    owner: 'Platform Engineering',
    dueHours: 24,
    sentiment: 'neutral',
    reasoning: 'Payload size threshold issue on high-volume webhook dispatches.',
  },
  {
    keywords: [/sepa wire transfer/i, /pro-forma quote/i, /vat invoice/i, /iban/i],
    priority: 'P2',
    category: 'billing',
    owner: 'Billing Ops',
    dueHours: 24,
    sentiment: 'neutral',
    reasoning: 'Standard payment method accommodation for European corporate procurement.',
  },
  {
    keywords: [/secondary admins/i, /workspace administrators/i, /admin seat/i],
    priority: 'P2',
    category: 'other',
    owner: 'Customer Support',
    dueHours: 24,
    sentiment: 'neutral',
    reasoning: 'General administrative permission configuration guidance requested.',
  },
  {
    keywords: [/embed the approve\/reject/i, /iframe sdk/i, /react npm package/i],
    priority: 'P2',
    category: 'other',
    owner: 'Developer Relations',
    dueHours: 24,
    sentiment: 'positive',
    reasoning: 'Developer architecture question on embedding ApproveGate components.',
  },
  {
    keywords: [/hmac signature verification/i, /x-signature-sha256/i, /signing secret/i],
    priority: 'P2',
    category: 'other',
    owner: 'Developer Support',
    dueHours: 24,
    sentiment: 'neutral',
    reasoning: 'Webhook security verification header integration support.',
  },

  // P3 - Low priority feature requests, FYI, spam, out-of-office, newsletter
  {
    keywords: [/out of the office/i, /mailer daemon/i, /returning oct 5/i],
    priority: 'P3',
    category: 'FYI',
    owner: 'Automation / Archive',
    dueHours: 72,
    sentiment: 'neutral',
    reasoning: 'Automated out-of-office autoreply with no action needed.',
  },
  {
    keywords: [/devops weekly/i, /kubernetes 1\.32/i, /newsletter/i],
    priority: 'P3',
    category: 'FYI',
    owner: 'Automation / Archive',
    dueHours: 72,
    sentiment: 'neutral',
    reasoning: 'External newsletter subscription digest.',
  },
  {
    keywords: [/ssl certificate auto-renewed/i, /let's encrypt/i, /no human action required/i],
    priority: 'P3',
    category: 'FYI',
    owner: 'Automation / Archive',
    dueHours: 72,
    sentiment: 'neutral',
    reasoning: 'Automated infrastructure notification confirming routine certificate renewal.',
  },
  {
    keywords: [/scheduled maintenance/i, /database patch upgrade/i, /replica failover/i],
    priority: 'P3',
    category: 'FYI',
    owner: 'Automation / Archive',
    dueHours: 72,
    sentiment: 'neutral',
    reasoning: 'Scheduled routine infrastructure maintenance advisory.',
  },
  {
    keywords: [/seo and backlink/i, /google backlinks/i, /leads@rankboost/i],
    priority: 'P3',
    category: 'FYI',
    owner: 'Spam Filter',
    dueHours: 72,
    sentiment: 'neutral',
    reasoning: 'Unsolicited cold promotional spam.',
  },
  {
    keywords: [/keyboard shortcuts/i, /cycling through pending approvals/i, /superhuman/i],
    priority: 'P3',
    category: 'other',
    owner: 'Product Team',
    dueHours: 48,
    sentiment: 'positive',
    reasoning: 'Product enhancement feedback for navigation shortcuts.',
  },
  {
    keywords: [/snoozed until today/i, /filter pill/i, /filter option for/i],
    priority: 'P3',
    category: 'other',
    owner: 'Product Team',
    dueHours: 48,
    sentiment: 'neutral',
    reasoning: 'Minor UI usability recommendation for snooze filtering.',
  },
  {
    keywords: [/keynote sponsor/i, /ai developer summit/i, /platinum sponsor booths/i],
    priority: 'P3',
    category: 'sales',
    owner: 'Marketing Partnerships',
    dueHours: 48,
    sentiment: 'neutral',
    reasoning: 'Inbound conference sponsorship solicitation.',
  },
  {
    keywords: [/receipt request/i, /pdf tax invoice/i, /es-b9812491/i],
    priority: 'P3',
    category: 'billing',
    owner: 'Billing Ops',
    dueHours: 48,
    sentiment: 'neutral',
    reasoning: 'Routine bookkeeping invoice copy request.',
  },
  {
    keywords: [/typo in api documentation/i, /confidance/i],
    priority: 'P3',
    category: 'other',
    owner: 'Technical Documentation',
    dueHours: 48,
    sentiment: 'positive',
    reasoning: 'Helpful user submission for documentation typo correction.',
  },
  {
    keywords: [/order confirmation/i, /prime lens/i, /fedex tracking/i],
    priority: 'P3',
    category: 'other',
    owner: 'Tier 1 Support',
    dueHours: 72,
    sentiment: 'neutral',
    reasoning: 'Misdirected personal retail shipping notification.',
  },
];

export function runMockTriage(thread: TicketThread): { triage: TriageData; draft: DraftReplyData } {
  const content = `${thread.subject} ${thread.rawBody}`;
  
  let matchedRule: TriageRule | null = null;
  for (const rule of TRIAGE_RULES) {
    if (rule.keywords.some((regex) => regex.test(content))) {
      matchedRule = rule;
      break;
    }
  }

  // Fallback heuristic if no rule explicitly matched
  if (!matchedRule) {
    const isBilling = /invoice|bill|charge|refund|card|payment/i.test(content);
    const isBug = /error|500|crash|fail|bug|issue|broken|exception/i.test(content);
    const isSales = /demo|pricing|quote|seats|enterprise|contract/i.test(content);
    const isFYI = /newsletter|unsubscribe|fyi|notice|automated/i.test(content);

    const category: Category = isBilling
      ? 'billing'
      : isBug
      ? 'bug'
      : isSales
      ? 'sales'
      : isFYI
      ? 'FYI'
      : 'other';

    const priority: Priority = isBug || isBilling ? 'P1' : 'P2';

    matchedRule = {
      keywords: [],
      priority,
      category,
      owner: isBilling ? 'Billing Ops' : isBug ? 'Support Engineering' : isSales ? 'Enterprise Sales' : 'Tier 1 Support',
      dueHours: 24,
      sentiment: 'neutral',
      reasoning: 'Heuristic keyword classification based on message body and subject.',
    };
  }

  const receivedDate = new Date(thread.receivedAt || new Date().toISOString());
  const dueDate = new Date(receivedDate.getTime() + matchedRule.dueHours * 3600 * 1000);

  // Generate crisp 1-2 sentence summary
  const cleanFirstLine = thread.rawBody
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 10 && !l.startsWith('>') && !l.startsWith('From:'))[0] || thread.subject;
  
  const summary = `${thread.subject.replace(/^(URGENT:|Re:|Fwd:)\s*/gi, '')}. Issue: ${cleanFirstLine.slice(0, 140)}...`;

  const triage: TriageData = {
    priority: matchedRule.priority,
    category: matchedRule.category,
    summary,
    suggestedOwner: matchedRule.owner,
    dueBy: dueDate.toISOString(),
    sentiment: matchedRule.sentiment,
    confidence: 0.96,
    reasoning: matchedRule.reasoning,
  };

  // Generate tailored draft reply + suggested next actions
  const draft = generateMockDraft(thread, triage);

  return { triage, draft };
}

function generateMockDraft(thread: TicketThread, triage: TriageData): DraftReplyData {
  const firstName = thread.from.name.split(' ')[0] || 'there';
  let body = '';
  let tone: DraftReplyData['tone'] = 'professional';
  const actions: SuggestedAction[] = [];

  switch (triage.category) {
    case 'bug':
      if (triage.priority === 'P0') {
        tone = 'apologetic';
        body = `Hi ${firstName},\n\nThank you for reaching out with highest urgency. Our on-call incident team has been paged and is actively investigating the incident. A priority bridge has been opened.\n\nWe will provide an update within 30 minutes with our mitigation progress and root cause analysis.\n\nSincerely,\nIncident Response Team`;
        actions.push(
          { id: 'act-1', title: 'Escalate to P0 On-Call SRE Bridge', type: 'escalation', completed: false, systemTarget: 'PagerDuty' },
          { id: 'act-2', title: 'Post incident update to public status page', type: 'action', completed: false, systemTarget: 'StatusPage' },
          { id: 'act-3', title: 'Collect worker / cluster diagnostics logs', type: 'investigation', completed: false, systemTarget: 'CloudWatch' }
        );
      } else {
        tone = 'technical';
        body = `Hi ${firstName},\n\nThank you for reporting this issue. We have logged ticket reference for our engineering team to investigate the root cause.\n\nWe will follow up as soon as a fix or workaround is available.\n\nBest regards,\nPlatform Support`;
        actions.push(
          { id: 'act-1', title: 'File defect in engineering backlog (Jira)', type: 'action', completed: false, systemTarget: 'Jira' },
          { id: 'act-2', title: 'Verify client reproduction steps', type: 'investigation', completed: false, systemTarget: 'DevConsole' }
        );
      }
      break;

    case 'billing':
      tone = triage.priority === 'P0' ? 'apologetic' : 'professional';
      body = `Hi ${firstName},\n\nThank you for bringing this to our attention. Our billing operations team has reviewed your account details.\n\nWe are processing the requested adjustment and will provide the transaction confirmation receipt once finalized.\n\nWarm regards,\nBilling & Accounts Team`;
      actions.push(
        { id: 'act-1', title: 'Review Stripe transaction history', type: 'action', completed: false, systemTarget: 'Stripe' },
        { id: 'act-2', title: 'Initiate payment refund / credit memo', type: 'refund', completed: false, systemTarget: 'Stripe' },
        { id: 'act-3', title: 'Update invoice record in CRM', type: 'action', completed: false, systemTarget: 'Salesforce' }
      );
      break;

    case 'sales':
      tone = 'professional';
      body = `Hi ${firstName},\n\nThank you for considering ApproveGate for your team. We would be delighted to arrange a dedicated technical walk-through tailored to your organization's workflow and compliance requirements.\n\nPlease let us know what time slots work best for your team this week, or book directly via our team calendar link.\n\nBest regards,\nEnterprise Solutions Team`;
      actions.push(
        { id: 'act-1', title: 'Route contact to Enterprise Account Executive', type: 'escalation', completed: false, systemTarget: 'Salesforce' },
        { id: 'act-2', title: 'Send executive demo scheduling link', type: 'action', completed: false, systemTarget: 'Hubspot' },
        { id: 'act-3', title: 'Prepare custom SOC2 / Security packet', type: 'action', completed: false, systemTarget: 'CompliancePortal' }
      );
      break;

    case 'FYI':
      tone = 'direct';
      body = `[Automated Log: FYI message noted. No outgoing email required.]`;
      actions.push(
        { id: 'act-1', title: 'Archive notification thread', type: 'archive', completed: false, systemTarget: 'Inbox' },
        { id: 'act-2', title: 'Mark sender domain in automated filter', type: 'action', completed: false, systemTarget: 'FilterEngine' }
      );
      break;

    default:
      tone = 'professional';
      body = `Hi ${firstName},\n\nThank you for reaching out to the ApproveGate team. We have received your request and forwarded it to the relevant specialist for review.\n\nWe will be in touch with a detailed response shortly.\n\nKind regards,\nSupport Operations`;
      actions.push(
        { id: 'act-1', title: 'Assign ticket to specialist team', type: 'action', completed: false, systemTarget: 'Zendesk' },
        { id: 'act-2', title: 'Flag for 24-hour follow-up review', type: 'investigation', completed: false, systemTarget: 'ApproveGate' }
      );
      break;
  }

  return {
    id: `draft-${thread.id}`,
    threadId: thread.id,
    recipient: thread.from.email,
    subject: thread.subject.startsWith('Re:') ? thread.subject : `Re: ${thread.subject}`,
    body,
    tone,
    suggestedActions: actions,
    version: 1,
    lastModifiedAt: new Date().toISOString(),
    lastModifiedBy: 'ai',
  };
}
