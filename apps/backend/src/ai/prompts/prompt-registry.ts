import { Injectable } from '@nestjs/common';
import { PROMPT_VERSIONS, PromptVersion } from '@sentinel/types';

@Injectable()
export class PromptRegistry {
  readonly BASE_SYSTEM_INSTRUCTION = `You are Sentinel's AI Intelligence and Explanation Layer.
Sentinel is an evidence-first, deterministic-security-first cybersecurity intelligence platform.

CRITICAL ARCHITECTURAL CONSTRAINTS:
1. The Sentinel Phase 5 Deterministic Security Engine is strictly authoritative for:
   - Security scores
   - Finding existence and verification
   - Finding severity (CRITICAL, HIGH, MEDIUM, LOW, INFO)
   - Verified controls and evidence status
2. You MUST NOT:
   - Calculate, alter, upgrade, downgrade, or suggest changes to deterministic security scores.
   - Modify or dispute the severity assigned by the deterministic engine.
   - Convert UNVERIFIED, UNAVAILABLE, or NOT_CHECKED status into VERIFIED status.
   - Fabricate system state, hardware specifications, or active security controls.
   - Prescribe destructive operating system commands or system alterations.
3. You MUST ALWAYS:
   - Output valid JSON strictly matching the requested schema.
   - Provide a realistic confidence value between 0.0 and 1.0 based solely on provided evidence.
   - Explicitly list limitations and what could not be determined.
   - Distinguish verified engine findings from your contextual AI interpretation.
`;

  buildSecurityExplanationPrompt(
    finding: {
      id: string;
      title: string;
      category: string;
      severity: string;
      description?: string | null;
      remediation?: string | null;
      confidence?: number | null;
    },
    evidenceList: Array<{ label?: string; key?: string; value: unknown; collectedAt?: string }>,
  ): { version: PromptVersion; prompt: string } {
    const sanitizedEvidence = evidenceList.map((e) => ({
      key: e.label || e.key || 'evidence_signal',
      value: typeof e.value === 'object' ? JSON.stringify(e.value) : String(e.value),
    }));

    const prompt = `[OPERATION: SECURITY_EXPLANATION_V1]
Analyze and explain the following verified security finding produced by the deterministic engine:

FINDING DETAILS:
- Identifier: ${finding.id}
- Category: ${finding.category}
- Title: ${finding.title}
- Engine Assigned Severity: ${finding.severity}
- Description: ${finding.description || 'N/A'}
- Baseline Remediation: ${finding.remediation || 'N/A'}

RELEVANT VERIFIED EVIDENCE:
${JSON.stringify(sanitizedEvidence, null, 2)}

TASK:
Produce a structured explanation for an ordinary user who wants to understand why this finding matters and what concrete, safe steps they can take.

REQUIRED JSON OUTPUT SCHEMA:
{
  "summary": "Clear, concise 1-2 sentence summary of what was detected",
  "explanation": "Detailed explanation of the condition in plain language",
  "whyItMatters": "Why this specific security posture matters for user privacy or defense",
  "evidenceReferences": ["List of evidence keys or items specifically supporting this conclusion"],
  "impact": "Potential security impact if unaddressed (e.g. data exposure, unauthorized access)",
  "remediation": "Concrete, step-by-step user instructions to remediate or mitigate safely",
  "limitations": ["Clear limitations of this check and what Sentinel cannot guarantee"],
  "confidence": 0.95
}
`;

    return {
      version: PROMPT_VERSIONS.SECURITY_EXPLANATION,
      prompt,
    };
  }

  buildSecurityAdvisorPrompt(
    device: { platform: string; osVersion?: string | null; model?: string | null },
    findings: Array<{
      id: string;
      title: string;
      severity: string;
      category: string;
      evidence?: unknown;
    }>,
    scoreSummary?: { score: number; evaluatedControls: number; unavailableChecks: number },
  ): { version: PromptVersion; prompt: string } {
    const prompt = `[OPERATION: SECURITY_ADVISOR_V1]
Review the current security posture for this device and generate prioritized advisory guidance:

DEVICE CONTEXT:
- Platform: ${device.platform}
- OS Version: ${device.osVersion || 'Unknown'}
- Model: ${device.model || 'Unknown'}
${scoreSummary ? `- Engine Security Score: ${scoreSummary.score}/100 (${scoreSummary.evaluatedControls} evaluated, ${scoreSummary.unavailableChecks} unavailable)` : ''}

ACTIVE DETERMINISTIC FINDINGS (${findings.length} findings):
${JSON.stringify(
  findings.slice(0, 15).map((f) => ({
    id: f.id,
    title: f.title,
    severity: f.severity,
    category: f.category,
  })),
  null,
  2,
)}

TASK:
Provide prioritized, actionable recommendations. Group them logically so the user knows what to fix first.
Never invent controls that do not exist.

REQUIRED JSON OUTPUT SCHEMA:
{
  "recommendations": [
    {
      "recommendation": "Concise action title",
      "rationale": "Why this should be prioritized based on findings",
      "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "affectedFindingId": "string finding id or omit",
      "affectedControl": "string control name",
      "evidenceReferences": ["string references"],
      "steps": ["Step 1...", "Step 2..."],
      "limitations": ["Limitations of this remediation"],
      "confidence": 0.90
    }
  ],
  "overallGuidance": "High-level summary of the device posture and key focus area",
  "priorityRationale": "Explanation of the prioritization sequence",
  "limitations": ["Limitations of the advisory based on available scan data"],
  "confidence": 0.90
}
`;

    return {
      version: PROMPT_VERSIONS.SECURITY_ADVISOR,
      prompt,
    };
  }

  buildThreatAnalysisPrompt(
    threatInput: string,
    context?: string,
  ): { version: PromptVersion; prompt: string } {
    const prompt = `[OPERATION: THREAT_ANALYZER_V1]
Analyze the following user-supplied digital threat or incident report:

USER THREAT INPUT:
"""
${threatInput}
"""
${context ? `ADDITIONAL CONTEXT: """${context}"""` : ''}

TASK:
Identify suspicious patterns, potential social engineering, malware indicators, or fraud indicators.
Distinguish indicators from certainty. Do NOT claim certainty when evidence is purely textual or circumstantial.

REQUIRED JSON OUTPUT SCHEMA:
{
  "classification": "BENIGN" | "SUSPICIOUS" | "MALICIOUS" | "UNKNOWN",
  "riskInterpretation": "Plain English summary of the potential threat risk",
  "indicators": ["List of suspicious keywords, domain anomalies, pressure tactics detected"],
  "explanation": "Detailed breakdown of the observed techniques or anomalies",
  "confidence": 0.85,
  "evidence": ["Specific phrases, tokens, or patterns extracted from the input"],
  "limitations": ["Limitations of text-based heuristics without network/sandbox execution"]
}
`;

    return {
      version: PROMPT_VERSIONS.THREAT_ANALYZER,
      prompt,
    };
  }

  buildScreenshotAnalysisPrompt(contextNote?: string): {
    version: PromptVersion;
    prompt: string;
  } {
    const prompt = `[OPERATION: SCREENSHOT_ANALYZER_V1]
Examine the user-supplied screenshot for visual cybersecurity indicators (e.g. fake login prompts, phishing pages, deceptive dialogs, scareware, fraudulent security warnings, unverified permission requests).

${contextNote ? `USER CONTEXT NOTE: """${contextNote}"""` : ''}

TASK:
1. Detect visual security-relevant elements (URL bars, login fields, logos, certificates, warning banners).
2. Note any discrepancies (e.g. mismatched branding vs domain, typos, scare tactics).
3. If the image is blurry, corrupted, unreadable, or non-security-related, explicitly set "isContentSufficient": false.

REQUIRED JSON OUTPUT SCHEMA:
{
  "detectedElements": ["List of identified visual elements"],
  "suspiciousIndicators": ["List of anomalies or phishing indicators observed"],
  "explanation": "Explanation of visual findings",
  "confidence": 0.85,
  "limitations": ["Visual inspection limitations (e.g. inability to inspect network traffic or SSL cert from pixels)"],
  "isContentSufficient": true,
  "recommendedAction": "Actionable advice for the user"
}
`;

    return {
      version: PROMPT_VERSIONS.SCREENSHOT_ANALYZER,
      prompt,
    };
  }

  buildMessageAnalysisPrompt(
    messageText: string,
    sender?: string,
  ): { version: PromptVersion; prompt: string } {
    const prompt = `[OPERATION: MESSAGE_ANALYZER_V1]
Analyze this user-submitted suspicious message (e.g. SMS, email, WhatsApp, chat):

MESSAGE CONTENT:
"""
${messageText}
"""
${sender ? `REPORTED SENDER: """${sender}"""` : ''}

TASK:
Detect social engineering, phishing, artificial urgency, impersonation, credential harvesting links, or fraudulent financial requests.
Do not guess or assume facts not present in the text.

REQUIRED JSON OUTPUT SCHEMA:
{
  "classification": "SAFE" | "SUSPICIOUS" | "PHISHING" | "SPAM" | "UNKNOWN",
  "suspiciousIndicators": ["List of specific urgency cues, suspicious links, spoofed brands"],
  "explanation": "Detailed explanation of why this message presents risk or appears benign",
  "urgencyTacticsDetected": true,
  "credentialHarvestingRisk": true,
  "recommendedAction": "Concrete guidance (e.g. do not click, block number, report)",
  "confidence": 0.90,
  "limitations": ["Heuristic textual analysis; carrier headers and routing not inspected"]
}
`;

    return {
      version: PROMPT_VERSIONS.MESSAGE_ANALYZER,
      prompt,
    };
  }

  buildUrlAnalysisPrompt(
    normalizedUrl: string,
    domain: string,
    externalThreatIntel?: {
      sourceDisplayName: string;
      verdict: string;
      threatType: string;
      severity: string;
      summary: string;
    },
  ): { version: PromptVersion; prompt: string } {
    const threatIntelContext = externalThreatIntel
      ? `\nVERIFIED EXTERNAL THREAT INTELLIGENCE (Phase 8 Ground Truth):
Source: ${externalThreatIntel.sourceDisplayName}
Verdict: ${externalThreatIntel.verdict}
Threat Category: ${externalThreatIntel.threatType}
Severity: ${externalThreatIntel.severity}
Summary: ${externalThreatIntel.summary}
CRITICAL RULE: This external threat intelligence is authoritative evidence. Do NOT contradict or fabricate provider results.\n`
      : '';

    const prompt = `[OPERATION: URL_ANALYZER_V1]
Perform syntactic, structural, and intelligence analysis of the following user-submitted URL:

NORMALIZED URL: ${normalizedUrl}
EXTRACTED DOMAIN: ${domain}
${threatIntelContext}
TASK:
Evaluate structural URL anomalies (e.g. brand impersonation in subdomain, unusual TLD, typosquatting patterns, obfuscated IP address, deceptive path).
Incorporate any provided verified external threat intelligence accurately.

REQUIRED JSON OUTPUT SCHEMA:
{
  "observations": ["List of structural, lexical, and intelligence observations"],
  "riskInterpretation": "Interpretation of potential risks associated with this URL structure and threat data",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN",
  "confidence": 0.85,
  "limitations": ["Lexical analysis and verified threat intelligence feeds"],
  "sourceAttribution": "Sentinel AI URL Orchestrator"
}
`;

    return {
      version: PROMPT_VERSIONS.URL_ANALYZER,
      prompt,
    };
  }
}
