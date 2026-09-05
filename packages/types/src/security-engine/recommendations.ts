/**
 * Sentinel Phase 5: Deterministic Recommendations Engine (Section 16).
 *
 * Requirements:
 * - Deterministic, actionable
 * - Priority reflects finding risk priority band
 * - Deduplicated by finding fingerprint
 * - When a finding is resolved, recommendation reflects resolved state
 */

import type { EngineFinding, EngineRecommendation } from './types';

/**
 * Generates actionable recommendations directly from engine findings.
 */
export function generateRecommendations(
  findings: EngineFinding[],
  evaluationDate?: Date,
): EngineRecommendation[] {
  const recommendations: EngineRecommendation[] = [];
  const seenFingerprints = new Set<string>();

  // Prioritize critical and high findings first
  const sortedFindings = [...findings].sort((a, b) => b.riskScore - a.riskScore);

  const createdAt = (evaluationDate ?? new Date()).toISOString();

  for (const f of sortedFindings) {
    if (seenFingerprints.has(f.fingerprint)) {
      continue;
    }
    seenFingerprints.add(f.fingerprint);

    const isResolved = f.status === 'RESOLVED';

    recommendations.push({
      findingFingerprint: f.fingerprint,
      findingId: f.id,
      ruleId: f.ruleId,
      category: f.category,
      title: isResolved ? `Resolved: ${f.title}` : `Remediate: ${f.title}`,
      description: f.recommendationText || f.description,
      priority: f.priority,
      status: isResolved ? 'COMPLETED' : 'PENDING',
      createdAt,
    });
  }

  return recommendations;
}
