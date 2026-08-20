export interface SampleDoc {
  id: string;
  title: string;
  category: string;
  sourceType: 'preset';
  content: string;
}

export const SAMPLE_DOCS: SampleDoc[] = [
  {
    id: 'doc-sre-multiregion',
    title: 'Cloud Platform Multi-Region Resiliency & Failover Architecture',
    category: 'Engineering & SRE',
    sourceType: 'preset',
    content: `# Cloud Platform Multi-Region Resiliency & Failover Architecture

## 1. Executive Summary & SLO Targets
Our distributed cloud architecture is designed to guarantee a 99.995% uptime Service Level Objective (SLO) with a Maximum Tolerable Downtime (MTD) of 4 minutes. The system operates across three primary cloud regions: \`us-east-1\` (North Virginia), \`eu-west-1\` (Ireland), and \`ap-southeast-1\` (Singapore).

## 2. Recovery Objectives (RPO and RTO)
- **Recovery Point Objective (RPO)**: <= 5 seconds for critical transactional state via asynchronous cross-region Raft replication; 0 seconds for quorum-confirmed writes.
- **Recovery Time Objective (RTO)**: <= 45 seconds for automated DNS/Anycast traffic rerouting and container auto-hydration.

## 3. Distributed Database Topology
We utilize a CockroachDB multi-region cluster with range leaseholder placement:
1. **Survivability Goal**: Region survivability. The cluster tolerates the complete loss of any single AWS/GCP region without losing access to quorum.
2. **Replication Factor**: 5 replicas per range with geographic distribution (2 in us-east-1, 2 in eu-west-1, 1 in ap-southeast-1).
3. **Write Path Latency**: Average write latency is 38ms using parallel commits and pipelining. Read-only queries against local region followers achieve < 2ms latency.

## 4. Traffic Management and Health Checking
- **Global Server Load Balancing (GSLB)**: Cloudflare Anycast layer coupled with Route53 latency-based routing.
- **Health Probing**: Probes run every 250ms from 12 synthetic edge locations. If 3 consecutive probes fail (750ms threshold), automated DNS health failover triggers.
- **Circuit Breaking**: Envoy proxy sidecars enforce a 50% concurrency limit and 5-second connection timeouts before tripping the regional circuit breaker.

## 5. Chaos Engineering & Validation Protocol
Disaster recovery drill "Operation Valkyrie" runs bi-weekly in staging and quarterly in production. It simulates complete regional fiber cuts, KMS key revocation, and sudden 400% traffic spikes. Regional failover exercises require zero human manual intervention.`,
  },
  {
    id: 'doc-fintech-webhooks',
    title: 'FinTech Payment Gateway: Webhook Integration & Security Specs',
    category: 'API & Security',
    sourceType: 'preset',
    content: `# FinTech Payment Gateway: Webhook Integration & Security Specs

## 1. Overview
The NovaPay Global Payment API uses HTTP POST webhooks to deliver asynchronous event notifications to merchant endpoints. Events include transaction settlement, chargeback disputes, KYC state changes, and recurring subscription renewals.

## 2. Cryptographic Signature Verification
Every webhook request contains the \`X-NovaPay-Signature\` header. Merchants must verify this signature before processing payloads:
1. **Timestamp Extraction**: Header format is \`t=1718002930,v1=9c4a8b7e6f...\`. The \`t\` component is the Unix timestamp in seconds.
2. **Replay Attack Prevention**: Reject any webhook where \`|current_time - t| > 300 seconds\` (5-minute tolerance window).
3. **HMAC Calculation**: Compute HMAC-SHA256 of the concatenated string \`t + "." + raw_request_body\` using your merchant secret API key (\`whsec_...\`).
4. **Constant-Time Comparison**: Use \`crypto.timingSafeEqual\` to compare computed HMAC with the \`v1\` value to prevent timing attacks.

## 3. Retry Schedule & Exponential Backoff
If a merchant endpoint returns any HTTP status code outside of \`200-299\`, or fails to respond within 8000ms:
- Attempt 1: Immediate retry (0s)
- Attempt 2: 15 seconds
- Attempt 3: 60 seconds
- Attempt 4: 5 minutes
- Attempt 5: 30 minutes
- Attempt 6 (Final): 2 hours
After 6 unsuccessful attempts, the event is marked as \`DEAD_LETTER\` and triggers an automated developer alert email.

## 4. Idempotency Guarantees
Each webhook contains a unique \`event_id\` UUID (e.g. \`evt_88301af9\`). Merchants MUST record processed \`event_id\` values in an ACID-compliant cache (such as Redis or PostgreSQL) for at least 72 hours to prevent duplicate fulfillment during network retries.

## 5. Supported Event Types
- \`payment_intent.succeeded\`: Funds successfully authorized and captured.
- \`payment_intent.failed\`: Authorization declined with specific decline code (e.g., \`insufficient_funds\`, \`fraud_suspected\`).
- \`dispute.opened\`: Customer initiated a chargeback; merchant has 7 business days to submit evidence.
- \`payout.paid\`: Funds dispersed to connected bank account via FedNow or SEPA Instant.`,
  },
  {
    id: 'doc-remote-work-policy',
    title: 'Global Remote Work & Home Office Policy 2026',
    category: 'Company Policy',
    sourceType: 'preset',
    content: `# Global Remote Work & Home Office Policy 2026

## 1. Eligibility & Core Working Hours
All full-time and part-time permanent employees are eligible for 100% remote work. To ensure cross-functional collaboration, all team members are required to be available for synchronous communication during the core collaboration window: **10:00 AM to 3:00 PM Eastern Time (ET)**, Monday through Thursday. Fridays are designated "Focus Fridays" with no mandatory synchronous meetings.

## 2. Home Office Ergonomic Stipend
- **Initial Setup Grant**: $1,500 USD one-time reimbursement upon hiring for ergonomic desks, monitor arms, 4K displays, and Herman Miller/Steelcase seating.
- **Annual Wellness & Peripheral Allowance**: $750 USD per calendar year for keyboard upgrades, noise-canceling headphones, and high-speed fiber internet subsidies.
- **Hardware Refresh Cycle**: Company-managed Apple MacBook Pro (M-series Max) or Lenovo ThinkPad X1 Extreme replaced automatically every 24 months.

## 3. Digital Security & Device Management
1. **Endpoint Protection**: All work must be conducted exclusively on MDM-enrolled corporate machines running SentinelOne and Tailscale Zero Trust VPN.
2. **Public Wi-Fi Restrictions**: Connecting to open, unencrypted Wi-Fi networks in airports or cafes without active Tailscale VPN tunnel is strictly forbidden.
3. **Screen Privacy**: Privacy screen filters must be applied when working in public shared workspaces or transit.

## 4. International "Work from Anywhere" (WFA) Policy
Employees may work outside their primary tax residency jurisdiction for up to **90 calendar days per rolling 12-month period**.
- **Tax Compliance Warning**: Working beyond 90 days in a foreign jurisdiction creates corporate Permanent Establishment (PE) tax risk and requires written approval from the Legal & People Operations team.
- **High-Risk Sanctioned Zones**: Remote work is prohibited in OFAC-sanctioned countries.`,
  },
  {
    id: 'doc-clinical-trial',
    title: 'Phase IIb Protocol: AI-Guided Monoclonal Antibody in Oncology',
    category: 'Biomedical & Research',
    sourceType: 'preset',
    content: `# Phase IIb Protocol: AI-Guided Monoclonal Antibody in Oncology (NX-409)

## 1. Study Objective & Primary Endpoints
This randomized, double-blind, placebo-controlled Phase IIb trial evaluates the therapeutic efficacy and safety profile of NX-409, a humanized IgG1 monoclonal antibody designed via deep reinforcement learning to target Claudin-18.2 in metastatic gastric adenocarcinoma.
- **Primary Endpoint**: Progression-Free Survival (PFS) at 12 months as assessed by RECIST v1.1 criteria.
- **Secondary Endpoints**: Overall Survival (OS), Objective Response Rate (ORR), and pharmacokinetic clearance rate (CL/F).

## 2. Inclusion & Exclusion Criteria
### Inclusion Criteria:
- Age >= 18 and <= 75 years at time of signed informed consent.
- Histologically confirmed HER2-negative, Claudin-18.2 positive (>= 70% tumor cells with >= 2+ staining intensity by IHC).
- ECOG performance status of 0 or 1.
- Adequate hematological reserve: Absolute Neutrophil Count (ANC) >= 1,500/uL, Platelets >= 100,000/uL, Hemoglobin >= 9.0 g/dL.

### Exclusion Criteria:
- Active CNS metastases or leptomeningeal disease.
- Prior treatment with antibody-drug conjugates (ADCs) within 28 days prior to cycle 1 day 1.
- QTc prolongation > 470ms on screening electrocardiogram.
- Known history of severe hypersensitivity to polysorbate-80 excipients.

## 3. Dosing Schedule & Pre-medication
NX-409 is administered via intravenous infusion at 600 mg fixed dose every 21 days (Q3W).
- **Pre-medication Regimen**: Diphenhydramine 50mg IV + Dexamethasone 10mg IV + Acetaminophen 650mg PO administered 30 minutes prior to infusion start.
- **Infusion Duration**: 90 minutes for Dose 1; if well-tolerated, may be reduced to 60 minutes for subsequent cycles.`,
  }
];

export const INITIAL_TEST_CASES = [
  {
    id: 'test-1',
    query: 'What is the RPO and RTO for the multi-region cloud platform?',
    expectedAnswer: 'RPO is <= 5 seconds for critical transactional state (0 seconds for quorum writes), and RTO is <= 45 seconds for automated DNS/traffic rerouting.',
    groundTruthDocId: 'doc-sre-multiregion',
    difficulty: 'easy' as const,
    category: 'Factual Retrieval'
  },
  {
    id: 'test-2',
    query: 'How does NovaPay prevent replay attacks on webhook notifications?',
    expectedAnswer: 'NovaPay includes a timestamp t in the X-NovaPay-Signature header and merchants must reject any webhook where the difference between current time and t exceeds 300 seconds (5 minutes).',
    groundTruthDocId: 'doc-fintech-webhooks',
    difficulty: 'medium' as const,
    category: 'Security Protocol'
  },
  {
    id: 'test-3',
    query: 'Can an employee work remotely from Spain for 120 days without legal approval?',
    expectedAnswer: 'No. The Work from Anywhere policy allows up to 90 calendar days per rolling 12-month period. Exceeding 90 days creates Permanent Establishment tax risk and requires written approval from Legal and People Ops.',
    groundTruthDocId: 'doc-remote-work-policy',
    difficulty: 'hard' as const,
    category: 'Policy Reasoning'
  },
  {
    id: 'test-4',
    query: 'What are the platelet and neutrophil requirements for NX-409 trial inclusion?',
    expectedAnswer: 'ANC >= 1,500/uL and Platelets >= 100,000/uL (with Hemoglobin >= 9.0 g/dL).',
    groundTruthDocId: 'doc-clinical-trial',
    difficulty: 'easy' as const,
    category: 'Biomedical Specs'
  },
  {
    id: 'test-5',
    query: 'What is the secret discount code for internal employee stock purchases mentioned in the docs?',
    expectedAnswer: 'The provided documents do not contain any information about employee stock purchase discount codes.',
    difficulty: 'adversarial' as const,
    category: 'Hallucination Resistance'
  }
];
