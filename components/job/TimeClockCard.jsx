import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function TimeClockCard({ job, user }) {
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  const isClockedIn = job.clock_in_time && !job.clock_out_time;
  const clockHistory = job.clock_history || [];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const calculateElapsedTime = () => {
    if (!job.clock_in_time) return '0:00:00';
    const start = new Date(job.clock_in_time);
    const end = job.clock_out_time ? new Date(job.clock_out_time) : currentTime;
    const diff = Math.floor((end - start) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const clockInMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.HelpRequest.update(job.id, {
        clock_in_time: new Date().toISOString(),
        clock_out_time: null,
        job_status: 'in_progress'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['job']);
      toast.success('Clocked in!');
    }
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      const clockOutTime = new Date();
      const clockInTime = new Date(job.clock_in_time);
      const hours = (clockOutTime - clockInTime) / (1000 * 60 * 60);
      
      const newSession = {
        clock_in: job.clock_in_time,
        clock_out: clockOutTime.toISOString(),
        hours: parseFloat(hours.toFixed(2))
      };

      const updatedHistory = [...clockHistory, newSession];
      const totalHours = updatedHistory.reduce((sum, session) => sum + session.hours, 0);
      const calculatedPay = job.payment_type === 'hourly' ? totalHours * job.pay_amount : job.pay_amount;

      await base44.entities.HelpRequest.update(job.id, {
        clock_out_time: clockOutTime.toISOString(),
        clock_history: updatedHistory,
        total_hours: parseFloat(totalHours.toFixed(2)),
        calculated_pay: parseFloat(calculatedPay.toFixed(2))
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['job']);
      toast.success('Clocked out!');
    }
  });

  return (
    <Card className="border-stone-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Time Clock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-6 bg-stone-50 rounded-lg">
          <div className="text-4xl font-mono font-bold text-stone-900 mb-2">
            {calculateElapsedTime()}
          </div>
          {isClockedIn ? (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
              Clocked In
            </Badge>
          ) : (
            <Badge variant="outline">Not Clocked In</Badge>
          )}
        </div>

        {job.accepted_vendor_id === user?.email && job.status !== 'completed' && (
          <div className="space-y-2">
            {!isClockedIn ? (
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => clockInMutation.mutate()}
                disabled={clockInMutation.isLoading}
              >
                <Play className="w-4 h-4 mr-2" />
                Clock In
              </Button>
            ) : (
              <Button
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={() => clockOutMutation.mutate()}
                disabled={clockOutMutation.isLoading}
              >
                <Square className="w-4 h-4 mr-2" />
                Clock Out
              </Button>
            )}
          </div>
        )}

        {/* Clock History */}
        {clockHistory.length > 0 && (
          <div className="pt-3 border-t border-stone-100">
            <p className="text-sm font-medium text-stone-900 mb-2">Clock History</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {clockHistory.map((session, idx) => (
                <div key={idx} className="text-xs bg-stone-50 p-2 rounded">
                  <div className="flex justify-between">
                    <span>In: {format(new Date(session.clock_in), 'h:mm a')}</span>
                    <span>Out: {format(new Date(session.clock_out), 'h:mm a')}</span>
                  </div>
                  <div className="text-stone-500 mt-1">{session.hours.toFixed(2)} hours</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {job.total_hours > 0 && (
          <div className="text-sm text-stone-600 space-y-1 pt-3 border-t border-stone-100">
            <div className="flex justify-between font-semibold">
              <span>Total Hours:</span>
              <span>{job.total_hours?.toFixed(2)} hrs</span>
            </div>
            {job.payment_type === 'hourly' && (
              <div className="flex justify-between font-semibold text-stone-900">
                <span>Total Pay:</span>
                <span>${job.calculated_pay?.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}