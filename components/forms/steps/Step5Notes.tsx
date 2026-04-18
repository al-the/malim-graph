'use client'

import { StarRating } from '@/components/ui/StarRating'
import { Textarea } from '@/components/ui/Textarea'
import type { FormData } from '../SubmissionForm'

interface Props { data: FormData; update: (p: Partial<FormData>) => void }

export function Step5Notes({ data, update }: Props) {
  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-semibold text-text-primary">5. Your reading notes</h2>
        <p className="text-2xs text-text-secondary mt-1">This section is for you and the review team. Be honest — your candour makes the whole system more reliable.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-2xs font-medium text-text-primary">How hard was this document to understand?</label>
        <p className="text-2xs text-text-secondary">This helps us match documents to the right contributors.</p>
        <StarRating
          value={(data.s5_difficulty as number) || 0}
          onChange={(v) => update({ s5_difficulty: v })}
          minLabel="1 = Very easy"
          maxLabel="5 = Very technical"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-2xs font-medium text-text-primary">How confident are you in your answers above?</label>
        <p className="text-2xs text-text-secondary">Be honest. It directly affects how we use this entry.</p>
        <StarRating
          value={(data.s5_confidence as number) || 0}
          onChange={(v) => update({ s5_confidence: v })}
          minLabel="1 = I guessed a lot"
          maxLabel="5 = Very sure"
        />
      </div>

      <Textarea
        label="Did you notice anything unusual, surprising, or worth flagging?"
        rows={4}
        value={(data.s5_unusual_findings as string) || ''}
        onChange={(e) => update({ s5_unusual_findings: e.target.value })}
        helper="Anything that made you stop and think. Not required but very useful."
      />

      <Textarea
        label="Do you have any questions for the review team?"
        rows={3}
        value={(data.s5_questions_for_admin as string) || ''}
        onChange={(e) => update({ s5_questions_for_admin: e.target.value })}
        helper="Ask anything. We'd rather you flag uncertainty than guess."
      />
    </div>
  )
}
