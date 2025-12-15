import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Info,
  Globe,
  Link as LinkIcon,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTimestamp } from '@/components/shared/formatTimestamp';

/**
 * ---------------------------
 * Text + URL rendering helpers
 * ---------------------------
 */

// Turns: [label](https://url.com) into: "label https://url.com"
function stripMarkdownLinks(text) {
  return String(text || '').replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/gi, '$1 $2');
}

// Splits a string into ordered tokens of {type:'text'|'url', value:string}
function splitTextByUrls(text) {
  const str = String(text || '');
  const urlRe = /https?:\/\/[^\s)]+/gi; // no .test() usage
  const parts = [];
  let lastIndex = 0;

  for (const match of str.matchAll(urlRe)) {
    const start = match.index ?? 0;
    const url = match[0];

    if (start > lastIndex) parts.push({ type: 'text', value: str.slice(lastIndex, start) });
    parts.push({ type: 'url', value: url });
    lastIndex = start + url.length;
  }

  if (lastIndex < str.length) parts.push({ type: 'text', value: str.slice(lastIndex) });
  return parts;
}

function RenderTextWithLinks({ text, linkClassName = '' }) {
  const cleaned = useMemo(() => stripMarkdownLinks(text), [text]);
  const parts = useMemo(() => splitTextByUrls(cleaned), [cleaned]);

  return (
    <>
      {parts.map((p, i) =>
        p.type === 'url' ? (
          <a
            key={i}
            href={p.value}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'text-blue-600 hover:underline break-all inline-flex items-center gap-1',
              linkClassName
            )}
          >
            {p.value}
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        ) : (
          <React.Fragment key={i}>{p.value}</React.Fragment>
        )
      )}
    </>
  );
}

function safeArray(val) {
  return Array.isArray(val) ? val : [];
}

function safeNumber(val, fallback = 0) {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * ---------------------------
 * Inner content component
 * ---------------------------
 */
function AssessmentContent({ assessment }) {
  const riskLabelConfig = {
    likely_legitimate: {
      label: 'Likely Legitimate',
      icon: CheckCircle,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    unclear: {
      label: 'Unclear / Needs Review',
      icon: AlertTriangle,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    likely_scam: {
      label: 'Likely Scam',
      icon: XCircle,
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  };

  const normalized = useMemo(() => {
    const a = assessment || {};
    const risk_score = clamp(safeNumber(a.risk_score, 50), 0, 100);

    // normalize label
    const risk_label =
      a.risk_label === 'likely_legitimate' || a.risk_label === 'likely_scam' || a.risk_label === 'unclear'
        ? a.risk_label
        : 'unclear';

    // normalize confidence
    const confidence =
      a.confidence === 'high' || a.confidence === 'medium' || a.confidence === 'low'
        ? a.confidence
        : 'medium';

    return {
      ...a,
      risk_score,
      risk_label,
      confidence,
      summary: a.summary || 'No summary provided.',
      green_flags: safeArray(a.green_flags),
      red_flags: safeArray(a.red_flags),
      portfolio_analysis: safeArray(a.portfolio_analysis),
      portfolio_photo_verification: safeArray(a.portfolio_photo_verification),
      web_search_results: safeArray(a.web_search_results),
      limitations: safeArray(a.limitations),
      assessed_at: a.assessed_at || new Date().toISOString()
    };
  }, [assessment]);

  const config = riskLabelConfig[normalized.risk_label] || riskLabelConfig.unclear;
  const Icon = config.icon;

  const confidenceConfig = {
    high: { label: 'High Confidence', color: 'text-emerald-700 border-emerald-200 bg-emerald-50' },
    medium: { label: 'Medium Confidence', color: 'text-amber-700 border-amber-200 bg-amber-50' },
    low: { label: 'Low Confidence', color: 'text-red-700 border-red-200 bg-red-50' }
  };
  const confidenceStyle = confidenceConfig[normalized.confidence] || confidenceConfig.medium;

  const riskBarColor = (score) => {
    if (score < 35) return 'bg-emerald-500';
    if (score < 65) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Risk Score & Label */}
      <Card className={cn('border-2', config.borderColor, config.bgColor)}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                config.bgColor,
                'border-2',
                config.borderColor
              )}
            >
              <Icon className={cn('w-6 h-6', config.color)} />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h3 className={cn('text-xl font-bold', config.color)}>{config.label}</h3>
                <Badge variant="outline" className={cn('text-xs', confidenceStyle.color)}>
                  {confidenceStyle.label}
                </Badge>
              </div>

              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-stone-600">Risk Score:</span>
                  <span className="text-lg font-bold text-stone-900">{normalized.risk_score}/100</span>
                </div>

                <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full transition-all', riskBarColor(normalized.risk_score))}
                    style={{ width: `${normalized.risk_score}%` }}
                  />
                </div>
              </div>

              <p className="text-sm text-stone-700">{normalized.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Green Flags */}
      {normalized.green_flags.length > 0 && (
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <CheckCircle className="w-5 h-5" />
              Positive Indicators ({normalized.green_flags.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {normalized.green_flags.map((flag, index) => (
                <li key={index} className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span className="text-sm text-stone-700">
                    <RenderTextWithLinks text={flag} />
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Red Flags */}
      {normalized.red_flags.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Risk Indicators ({normalized.red_flags.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {normalized.red_flags.map((flag, index) => (
                <li key={index} className="flex items-start gap-2">
                  <TrendingDown className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <span className="text-sm text-stone-700">
                    <RenderTextWithLinks text={flag} />
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Links Analysis */}
      {normalized.portfolio_analysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Portfolio Links Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {normalized.portfolio_analysis.map((item, index) => {
                const statusConfig = {
                  accessible: { icon: CheckCircle, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
                  broken: { icon: XCircle, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
                  private: { icon: Info, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
                  needs_manual_review: { icon: AlertTriangle, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
                  error: { icon: AlertTriangle, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' }
                };
                const status = statusConfig[item?.status] || statusConfig.error;
                const StatusIcon = status.icon;

                return (
                  <div key={index} className={cn('p-3 rounded-lg border', status.bg)}>
                    <div className="flex items-start gap-3">
                      <StatusIcon className={cn('w-4 h-4 mt-0.5 shrink-0', status.color)} />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {item?.status || 'unknown'}
                          </Badge>

                          {item?.url ? (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-blue-600 hover:underline break-all inline-flex items-center gap-1"
                            >
                              {item.url}
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-xs text-stone-600">No URL provided</span>
                          )}
                        </div>

                        {item?.findings && (
                          <p className="text-xs text-stone-700 whitespace-pre-wrap">
                            <RenderTextWithLinks text={item.findings} />
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Photo Verification */}
      {normalized.portfolio_photo_verification.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📸 Portfolio Photo Verification
              <Badge variant="outline" className="text-xs">
                {normalized.portfolio_photo_verification.length} photos checked
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {normalized.portfolio_photo_verification.map((photo, idx) => {
                const likelyStolen = !!photo?.likely_stolen;
                const foundElsewhere = !!photo?.image_found_elsewhere;

                return (
                  <div key={idx} className="bg-white rounded-lg border p-3">
                    <div className="flex items-start gap-3">
                      {photo?.photo_url ? (
                        <img
                          src={photo.photo_url}
                          alt="Portfolio item"
                          className="w-20 h-20 object-cover rounded border"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded border bg-stone-50 flex items-center justify-center text-xs text-stone-400">
                          No image
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {likelyStolen ? (
                            <Badge className="bg-red-100 text-red-800 border-red-200">⚠ Likely Stolen</Badge>
                          ) : foundElsewhere ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200">Found Elsewhere</Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">✓ Appears Original</Badge>
                          )}
                        </div>

                        {photo?.findings && (
                          <p className="text-xs text-stone-600 mb-2 whitespace-pre-wrap">
                            <RenderTextWithLinks text={photo.findings} />
                          </p>
                        )}

                        {safeArray(photo?.sources_found).length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-stone-700">Found on:</p>
                            {photo.sources_found.map((source, sIdx) => (
                              <div key={sIdx} className="text-xs bg-stone-50 p-2 rounded border">
                                {source?.url ? (
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline break-all inline-flex items-center gap-1"
                                  >
                                    {source.url}
                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                  </a>
                                ) : (
                                  <span className="text-stone-600">No source URL</span>
                                )}

                                {source?.context && (
                                  <p className="text-stone-500 mt-1 whitespace-pre-wrap">
                                    <RenderTextWithLinks text={source.context} />
                                  </p>
                                )}

                                {source?.belongs_to_different_business && (
                                  <Badge className="bg-red-50 text-red-700 text-xs mt-1">Different Business</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Web Search Results */}
      {normalized.web_search_results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Online Presence Found ({normalized.web_search_results.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {normalized.web_search_results.map((result, index) => (
                <div key={index} className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <div className="flex items-start gap-2 mb-2">
                    <Globe className="w-4 h-4 text-stone-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      {result?.url ? (
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:underline inline-flex items-center gap-1 break-all"
                        >
                          {result?.source || result.url}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-sm font-medium text-stone-900">{result?.source || 'Source'}</span>
                      )}

                      {result?.matches_profile !== undefined && (
                        <Badge
                          variant={result.matches_profile ? 'default' : 'destructive'}
                          className="ml-2 text-xs"
                        >
                          {result.matches_profile ? 'Matches' : 'Mismatch'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {result?.summary && (
                    <p className="text-xs text-stone-600 ml-6 whitespace-pre-wrap">
                      <RenderTextWithLinks text={result.summary} />
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Limitations */}
      {normalized.limitations.length > 0 && (
        <Card className="border-stone-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-stone-700">
              <Info className="w-5 h-5" />
              Assessment Limitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {normalized.limitations.map((limitation, index) => (
                <li key={index} className="text-xs text-stone-600 flex items-start gap-2">
                  <span className="text-stone-400">•</span>
                  <RenderTextWithLinks text={limitation} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Timestamp */}
      <div className="flex items-center gap-2 text-xs text-stone-500">
        <Clock className="w-3 h-3" />
        Assessment completed {formatTimestamp(normalized.assessed_at)}
      </div>

      <Separator />

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> This is an automated assessment to assist in your review. Always use your judgment and verify
          information independently before making final decisions.
        </p>
      </div>
    </div>
  );
}

/**
 * ---------------------------
 * Exported component
 * ---------------------------
 */
export default function AIRiskAssessment({ open, onClose, assessment, inline = false }) {
  if (!assessment) return null;

  if (inline) {
    return <AssessmentContent assessment={assessment} />;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            AI Risk Assessment
          </DialogTitle>
          <DialogDescription>Automated analysis of vendor profile legitimacy</DialogDescription>
        </DialogHeader>

        <AssessmentContent assessment={assessment} />
      </DialogContent>
    </Dialog>
  );
}
