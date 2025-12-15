import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import ServiceBadge from '@/components/ui/ServiceBadge';
import {
  Calendar,
  DollarSign,
  Briefcase,
  AlertCircle,
  Plus,
  Pencil,
  Trash2
} from 'lucide-react';

const PAYMENT_METHODS = [
  'venmo', 'paypal', 'cashapp', 'cash', 'check', 'zelle', 'other'
];

const HELP_TYPES = [
  { value: 'full_replacement', label: 'Full Replacement' },
  { value: 'second_shooter', label: 'Second Shooter / Assistant' },
  { value: 'assistant', label: 'Assistant' },
  { value: 'extra_help', label: 'Extra Help' },
  { value: 'last_minute_coverage', label: 'Last Minute Coverage' }
];

export default function FinalReviewStep({ jobData, updateJobData }) {
  /* -------------------- QUESTIONS STATE -------------------- */
  const [questions, setQuestions] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    if (Array.isArray(jobData.ai_generated_questions)) {
      setQuestions(jobData.ai_generated_questions);
    }
  }, [jobData.ai_generated_questions]);

  useEffect(() => {
    updateJobData({ ai_generated_questions: questions });
  }, [questions, updateJobData]);

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      { question: 'New question', answer: '' }
    ]);
    setEditingIndex(questions.length);
  };

  const deleteQuestion = (index) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
    setEditingIndex(null);
  };

  const updateQuestion = (index, field, value) => {
    setQuestions(prev =>
      prev.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      )
    );
  };

  /* -------------------- VALIDATION -------------------- */
  const missingFields = [];
  if (!jobData.title) missingFields.push('Job Title');
  if (!jobData.event_date) missingFields.push('Event Date');
  if (!jobData.city) missingFields.push('City');
  if (!jobData.state) missingFields.push('State');
  if (!jobData.pay_amount) missingFields.push('Payment Amount');
  if (!jobData.payment_method) missingFields.push('Payment Method');
  if (!jobData.help_type) missingFields.push('Help Type');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Final Review & Required Details</h2>
        <p className="text-sm text-stone-600">
          Review everything before posting
        </p>
      </div>

      {missingFields.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 text-sm">
                Missing Required Fields
              </p>
              <p className="text-xs text-amber-800">
                {missingFields.join(', ')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* JOB OVERVIEW */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Job Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={jobData.title || ''}
            onChange={(e) => updateJobData({ title: e.target.value })}
            placeholder="Job title"
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <ServiceBadge type={jobData.service_type} />

            <Select
              value={jobData.help_type}
              onValueChange={(v) => updateJobData({ help_type: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Help type" />
              </SelectTrigger>
              <SelectContent>
                {HELP_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* PAYMENT */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <Input
            type="number"
            value={jobData.pay_amount || ''}
            onChange={(e) =>
              updateJobData({ pay_amount: Number(e.target.value) || '' })
            }
            placeholder="Amount"
          />

          <Select
            value={jobData.payment_method}
            onValueChange={(v) => updateJobData({ payment_method: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Payment method" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map(m => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* QUESTIONS */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Questions for Applicants</CardTitle>
          <Button size="sm" variant="outline" onClick={addQuestion}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {questions.length === 0 && (
            <p className="text-sm text-blue-700 text-center">
              No questions added yet
            </p>
          )}

          {questions.map((q, i) => (
            <div key={i} className="bg-white border rounded p-3">
              <div className="flex justify-between items-start gap-2">
                <strong className="text-sm">
                  {i + 1}. {q.question}
                </strong>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setEditingIndex(editingIndex === i ? null : i)
                    }
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteQuestion(i)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>

              {editingIndex === i ? (
                <Textarea
                  value={q.answer || ''}
                  onChange={(e) =>
                    updateQuestion(i, 'answer', e.target.value)
                  }
                  rows={2}
                />
              ) : (
                <p className="text-sm text-stone-600 mt-1">
                  {q.answer || (
                    <span className="italic text-amber-600">
                      No answer yet
                    </span>
                  )}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
