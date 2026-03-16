/**
 * Detailed Analysis Endpoint - Claim-level fact-checking
 * This is a helper route that extends the main analyze endpoint
 * with claim-level extraction and per-claim fact-checking
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractClaims } from '@/lib/claims-extractor';
import { checkClaimAgainstFactChecks } from '@/lib/factcheck-api';
import type { AnalysisResponse } from './route';

export interface ClaimAnalysis {
  text: string;
  confidence: number;
  factCheckMatches: {
    claim: string;
    rating: string;
    source: string;
    url: string;
    publisherName: string;
  }[];
  status: 'verified_true' | 'verified_false' | 'unverified' | 'mixed';
  explanation: string;
}

export interface DetailedAnalysisResponse extends AnalysisResponse {
  claimsAnalysis?: {
    claims: ClaimAnalysis[];
    summary: string;
  };
}

/**
 * Build claims analysis from extracted claims
 * This is called from the main analyze route when ?detailed=true
 */
export async function buildClaimsAnalysis(articleText: string): Promise<{
  claims: ClaimAnalysis[];
  summary: string;
}> {
  const claims = extractClaims(articleText);

  if (claims.length === 0) {
    return {
      claims: [],
      summary: 'Aucune affirmation factuelle extraite de cet article',
    };
  }

  // Check each claim against fact-checkers (in parallel, max 5)
  const checkPromises = claims.slice(0, 6).map(claim =>
    checkClaimAgainstFactChecks(claim.text)
      .then(result => ({
        text: claim.text,
        confidence: claim.confidence,
        status: result.status,
        matches: result.matches,
      }))
      .catch(() => ({
        text: claim.text,
        confidence: claim.confidence,
        status: 'unverified' as const,
        matches: [],
      }))
  );

  const checkedClaims = await Promise.all(checkPromises);

  // Build explanations based on status
  const claimsAnalysis: ClaimAnalysis[] = checkedClaims.map(claim => ({
    text: claim.text,
    confidence: claim.confidence,
    factCheckMatches: claim.matches,
    status: claim.status,
    explanation: buildExplanation(claim.status, claim.matches),
  }));

  // Calculate summary
  const verified_true = claimsAnalysis.filter(c => c.status === 'verified_true').length;
  const verified_false = claimsAnalysis.filter(c => c.status === 'verified_false').length;
  const mixed = claimsAnalysis.filter(c => c.status === 'mixed').length;
  const unverified = claimsAnalysis.filter(c => c.status === 'unverified').length;

  let summaryText = `Analyse de ${claimsAnalysis.length} affirmation(s)`;
  if (verified_true > 0) summaryText += ` - ${verified_true} vérifiée(s) vraie(s)`;
  if (verified_false > 0) summaryText += ` - ${verified_false} vérifiée(s) fausse(s)`;
  if (mixed > 0) summaryText += ` - ${mixed} mitigée(s)`;
  if (unverified > 0) summaryText += ` - ${unverified} non vérifiée(s)`;

  return {
    claims: claimsAnalysis,
    summary: summaryText,
  };
}

/**
 * Build a 1-2 sentence explanation for a claim based on its status
 */
function buildExplanation(status: string, matches: Array<{ publisherName: string; rating: string }>): string {
  const sources = matches.length > 0
    ? ` selon ${matches.map(m => m.publisherName).join(', ')}`
    : '';

  switch (status) {
    case 'verified_true':
      return `Cette affirmation a été vérifiée comme vraie${sources}.`;
    case 'verified_false':
      return `Cette affirmation a été vérifiée comme fausse${sources}.`;
    case 'mixed':
      return `Les fact-checkers sont en désaccord sur cette affirmation${sources}.`;
    case 'unverified':
      return 'Aucune vérification ne corrobore ou contredit cette affirmation.';
    default:
      return 'Statut d\'affirmation indéterminé.';
  }
}
