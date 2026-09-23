import { TicketThread } from './types';

export function parseCSVToThreads(csvText: string): TicketThread[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((h) => h.trim().toLowerCase());

  const subjectIdx = headers.findIndex((h) => h.includes('subject') || h.includes('title'));
  const bodyIdx = headers.findIndex((h) => h.includes('body') || h.includes('description') || h.includes('message') || h.includes('content'));
  const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('from') || h.includes('sender') || h.includes('requester'));
  const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('user') || h.includes('contact'));
  const companyIdx = headers.findIndex((h) => h.includes('company') || h.includes('org') || h.includes('account'));
  const tierIdx = headers.findIndex((h) => h.includes('tier') || h.includes('plan'));

  const results: TicketThread[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length === 0) continue;

    const subject = (subjectIdx >= 0 ? cols[subjectIdx] : '') || `Imported Ticket #${i}`;
    const rawBody = (bodyIdx >= 0 ? cols[bodyIdx] : '') || subject;
    const email = (emailIdx >= 0 ? cols[emailIdx] : '') || `user${i}@example.com`;
    const name = (nameIdx >= 0 ? cols[nameIdx] : '') || email.split('@')[0];
    const company = companyIdx >= 0 ? cols[companyIdx] : undefined;
    const tierRaw = tierIdx >= 0 ? cols[tierIdx]?.toLowerCase() : 'pro';
    const customerTier = (['free', 'pro', 'enterprise', 'vip'].includes(tierRaw) ? tierRaw : 'pro') as TicketThread['customerTier'];

    const id = `thread-csv-${Date.now()}-${i}`;
    const timestamp = new Date().toISOString();

    results.push({
      id,
      subject,
      from: {
        name,
        email,
        company,
      },
      receivedAt: timestamp,
      channel: 'email',
      customerTier,
      tags: ['csv-import'],
      rawBody,
      threadMessages: [
        {
          id: `msg-${id}-1`,
          sender: name,
          email,
          timestamp,
          body: rawBody,
        },
      ],
      triage: null,
      draft: null,
      approvalStatus: 'pending',
      snoozedUntil: null,
      status: 'open',
      auditLog: [
        {
          id: `audit-imp-${Date.now()}-${i}`,
          threadId: id,
          timestamp,
          actor: 'Operator',
          action: 'thread_imported',
          note: 'Imported from CSV file',
        },
      ],
    });
  }

  return results;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export function parseJSONToThreads(jsonText: string): TicketThread[] {
  const parsed = JSON.parse(jsonText);
  const items = Array.isArray(parsed) ? parsed : [parsed];

  return items.map((item, index) => {
    const id = item.id || `thread-json-${Date.now()}-${index}`;
    const timestamp = item.receivedAt || new Date().toISOString();
    return {
      id,
      subject: item.subject || 'Imported Ticket',
      from: {
        name: item.from?.name || item.senderName || 'Customer',
        email: item.from?.email || item.senderEmail || 'customer@example.com',
        company: item.from?.company || item.company,
      },
      receivedAt: timestamp,
      channel: item.channel || 'email',
      customerTier: item.customerTier || 'pro',
      tags: item.tags || ['json-import'],
      rawBody: item.rawBody || item.body || item.message || '',
      threadMessages: item.threadMessages || [
        {
          id: `msg-${id}-1`,
          sender: item.from?.name || 'Customer',
          email: item.from?.email || 'customer@example.com',
          timestamp,
          body: item.rawBody || item.body || item.message || '',
        },
      ],
      triage: null,
      draft: null,
      approvalStatus: 'pending',
      snoozedUntil: null,
      status: 'open',
      auditLog: [
        {
          id: `audit-imp-${Date.now()}-${index}`,
          threadId: id,
          timestamp,
          actor: 'Operator',
          action: 'thread_imported',
          note: 'Imported from JSON upload',
        },
      ],
    };
  });
}
