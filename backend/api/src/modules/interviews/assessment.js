import { z } from "zod";

export const questionList = z
  .array(
    z
      .object({
        prompt: z.string().trim().min(1).max(2000),
        options: z.array(z.string().trim().min(1).max(500)).min(2).max(6),
        correctOption: z.number().int().nonnegative(),
        marks: z.number().int().min(1).max(1000).default(1),
      })
      .refine(
        (q) =>
          q.correctOption < q.options.length &&
          new Set(q.options.map((s) => s.toLowerCase())).size === q.options.length,
      ),
  )
  .max(100);

const answerList = z
  .array(
    z.object({ questionId: z.string(), selectedOption: z.number().int().nonnegative() }).strict(),
  )
  .max(100);
export function grade(questions, input) {
  const parsed = answerList.safeParse(input);
  if (!parsed.success) return null;
  const selections = new Map();
  for (const answer of parsed.data) {
    const question = questions.find((q) => q.id === answer.questionId);
    if (
      !question ||
      selections.has(question.id) ||
      answer.selectedOption >= question.options.length
    )
      return null;
    selections.set(question.id, answer.selectedOption);
  }
  const items = questions.map((q) => {
    const selectedOption = selections.get(q.id) ?? null;
    return {
      questionId: q.id,
      prompt: q.prompt,
      options: q.options,
      correctOption: q.correctOption,
      selectedOption,
      marks: q.marks,
      earned: selectedOption === q.correctOption ? q.marks : 0,
    };
  });
  return {
    items,
    total: items.reduce((sum, q) => sum + q.earned, 0),
    maximum: items.reduce((sum, q) => sum + q.marks, 0),
  };
}
